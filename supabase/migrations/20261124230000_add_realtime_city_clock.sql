alter table public.cities
  add column if not exists last_processed_date date
  not null default (timezone('America/Sao_Paulo', now())::date);

update public.cities
   set last_processed_date = timezone('America/Sao_Paulo', now())::date
 where last_processed_date is null;

revoke insert, update, delete on public.cities from public, anon, authenticated;
grant select on public.cities to authenticated;

create table if not exists public.city_save_operations (
  owner_id uuid not null references auth.users (id) on delete cascade,
  operation_id text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, operation_id)
);

alter table public.city_save_operations enable row level security;
revoke all on public.city_save_operations from public, anon, authenticated;

create or replace function public.append_city_transaction(
  p_state jsonb,
  p_label text,
  p_amount_cents bigint,
  p_date date
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_transactions jsonb;
begin
  if p_state #>> '{bank,accountNumber}' is null then
    return p_state;
  end if;

  v_transactions := coalesce(p_state #> '{bank,transactions}', '[]'::jsonb);
  if jsonb_typeof(v_transactions) <> 'array' then
    v_transactions := '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
    into v_transactions
    from (
      select entry, ordinal
        from jsonb_array_elements(
          jsonb_build_array(jsonb_build_object(
            'label', p_label,
            'amountCents', p_amount_cents,
            'date', to_char(p_date, '"Dia "DD" · Mês "MM')
          )) || v_transactions
        ) with ordinality as items(entry, ordinal)
       order by ordinal
       limit 30
    ) recent;

  return jsonb_set(
    p_state,
    '{bank,transactions}',
    v_transactions,
    true
  );
end;
$$;

revoke all on function public.append_city_transaction(jsonb, text, bigint, date)
  from public, anon, authenticated;

create or replace function public.save_city_state(
  p_name text,
  p_game_state jsonb,
  p_base_money bigint,
  p_base_materials bigint,
  p_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_city_id uuid;
  v_clock_date date;
  v_state jsonb;
  v_current_state jsonb;
  v_current_payroll jsonb;
  v_current_disasters jsonb;
  v_current_loan jsonb;
  v_is_new boolean := false;
  v_money bigint;
  v_current_money bigint;
  v_materials bigint;
  v_name text;
  v_result jsonb;
  v_cached_result jsonb;
  v_server_now timestamptz := now();
begin
  if v_owner_id is null then
    raise exception 'É necessário entrar na conta para salvar a cidade.'
      using errcode = '28000';
  end if;
  if p_game_state is null or jsonb_typeof(p_game_state) <> 'object' then
    raise exception 'O progresso da cidade precisa ser um objeto JSON válido.'
      using errcode = '22023';
  end if;
  if p_operation_id is null or char_length(p_operation_id) > 128 then
    raise exception 'Identificador de salvamento inválido.'
      using errcode = '22023';
  end if;

  select op.result
    into v_cached_result
    from public.city_save_operations op
   where op.owner_id = v_owner_id
     and op.operation_id = p_operation_id;
  if found then
    select jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'state_version', c.state_version,
      'game_state', c.game_state,
      'server_date', c.last_processed_date,
      'server_now', now()
    )
      into v_result
      from public.cities c
     where c.owner_id = v_owner_id;
    return coalesce(v_result, v_cached_result);
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), 'Vila das Flores');
  if char_length(v_name) > 80 then
    raise exception 'O nome da cidade deve ter até 80 caracteres.'
      using errcode = '22023';
  end if;

  select c.id, c.last_processed_date, c.game_state
    into v_city_id, v_clock_date, v_current_state
    from public.cities c
   where c.owner_id = v_owner_id
   for update;

  if not found then
    v_clock_date := timezone('America/Sao_Paulo', v_server_now)::date;
    insert into public.cities (owner_id, name, game_state, last_processed_date)
    values (v_owner_id, v_name, '{}'::jsonb, v_clock_date)
    on conflict (owner_id) do nothing
    returning id into v_city_id;
    if v_city_id is not null then
      v_is_new := true;
    else
      select c.id, c.last_processed_date, c.game_state
        into v_city_id, v_clock_date, v_current_state
        from public.cities c
       where c.owner_id = v_owner_id
       for update;
    end if;
  end if;

  select op.result
    into v_cached_result
    from public.city_save_operations op
   where op.owner_id = v_owner_id
     and op.operation_id = p_operation_id;
  if found then
    select jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'state_version', c.state_version,
      'game_state', c.game_state,
      'server_date', c.last_processed_date,
      'server_now', now()
    )
      into v_result
      from public.cities c
     where c.owner_id = v_owner_id;
    return coalesce(v_result, v_cached_result);
  end if;

  v_state := p_game_state;
  if not v_is_new then
    v_current_money := coalesce((v_current_state ->> 'money')::bigint, 0);
    if coalesce(v_current_state ->> 'economyVersion', '1') = '1' then
      v_current_money := v_current_money * 100;
    end if;
    v_money := v_current_money
      + coalesce((p_game_state ->> 'money')::bigint, 0)
      - coalesce(p_base_money, v_current_money);
    v_materials := greatest(0,
      coalesce((v_current_state ->> 'materials')::bigint, 0)
      + coalesce((p_game_state ->> 'materials')::bigint, 0)
      - coalesce(p_base_materials, (v_current_state ->> 'materials')::bigint, 0)
    );
    v_state := jsonb_set(v_state, '{money}', to_jsonb(v_money), true);
    v_state := jsonb_set(v_state, '{materials}', to_jsonb(v_materials), true);

    v_current_payroll := coalesce(v_current_state -> 'payroll', '{}'::jsonb);
    v_current_disasters := coalesce(v_current_state -> 'disasters', '{}'::jsonb);
    v_state := jsonb_set(
      v_state,
      '{payroll,daysUntilPayment}',
      coalesce(v_current_payroll -> 'daysUntilPayment', v_state #> '{payroll,daysUntilPayment}', '7'::jsonb),
      true
    );

    v_state := jsonb_set(
      v_state,
      '{payroll,employeeCount}',
      coalesce(v_current_payroll -> 'employeeCount', v_state #> '{payroll,employeeCount}', '3'::jsonb),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{payroll,weeklySalaryCents}',
      coalesce(v_current_payroll -> 'weeklySalaryCents', v_state #> '{payroll,weeklySalaryCents}', '50000'::jsonb),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{payroll,teacherCount}',
      to_jsonb(greatest(
        coalesce((v_current_payroll ->> 'teacherCount')::integer, 0),
        coalesce((v_state #>> '{payroll,teacherCount}')::integer, 0)
      )),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{payroll,teacherWeeklySalaryCents}',
      coalesce(v_current_payroll -> 'teacherWeeklySalaryCents', v_state #> '{payroll,teacherWeeklySalaryCents}', '80000'::jsonb),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{payroll,paymentsMade}',
      coalesce(v_current_payroll -> 'paymentsMade', v_state #> '{payroll,paymentsMade}', '0'::jsonb),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{disasters,daysUntilEvent}',
      coalesce(v_current_disasters -> 'daysUntilEvent', v_state #> '{disasters,daysUntilEvent}', '7'::jsonb),
      true
    );
    v_state := jsonb_set(
      v_state,
      '{disasters,eventsTriggered}',
      coalesce(v_current_disasters -> 'eventsTriggered', v_state #> '{disasters,eventsTriggered}', '0'::jsonb),
      true
    );

    v_current_loan := v_current_state #> '{bank,loan}';
    if coalesce(v_current_loan ->> 'status', '') in ('active', 'overdue')
      or (
        coalesce(v_current_loan ->> 'status', '') = 'paid'
        and v_current_loan ->> 'contractId' = v_state #>> '{bank,loan,contractId}'
      ) then
      v_state := jsonb_set(v_state, '{bank,loan}', v_current_loan, true);
    end if;
    if v_current_state #>> '{bank,accountNumber}' is not null then
      v_state := jsonb_set(v_state, '{bank,accountNumber}', v_current_state #> '{bank,accountNumber}', true);
      v_state := jsonb_set(v_state, '{bank,openedAt}', v_current_state #> '{bank,openedAt}', true);
    end if;
  end if;

  v_state := jsonb_set(v_state, '{day}', to_jsonb(extract(day from v_clock_date)::integer), true);
  v_state := jsonb_set(v_state, '{month}', to_jsonb(extract(month from v_clock_date)::integer), true);
  v_state := jsonb_set(v_state, '{economyVersion}', '2'::jsonb, true);

  update public.cities
     set name = v_name,
         game_state = v_state
   where id = v_city_id;

  v_result := jsonb_build_object(
    'id', v_city_id,
    'name', v_name,
    'state_version', 1,
    'game_state', v_state,
    'server_date', v_clock_date,
    'server_now', v_server_now
  );

  insert into public.city_save_operations (owner_id, operation_id, result)
  values (v_owner_id, p_operation_id, v_result)
  on conflict (owner_id, operation_id) do nothing;

  delete from public.city_save_operations op
   where op.owner_id = v_owner_id
     and op.operation_id not in (
       select recent.operation_id
         from (
           select operations.operation_id
             from public.city_save_operations operations
            where operations.owner_id = v_owner_id
            order by (operations.operation_id = p_operation_id) desc,
                     operations.created_at desc,
                     operations.operation_id desc
            limit 100
         ) recent
     );

  return v_result;
end;
$$;

revoke all on function public.save_city_state(text, jsonb, bigint, bigint, text) from public, anon;
grant execute on function public.save_city_state(text, jsonb, bigint, bigint, text) to authenticated;

create or replace function public.sync_city_clock()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_city public.cities%rowtype;
  v_today date := timezone('America/Sao_Paulo', now())::date;
  v_server_now timestamptz := now();
  v_date date;
  v_processed integer := 0;
  v_money bigint;
  v_materials bigint;
  v_payroll jsonb;
  v_disasters jsonb;
  v_bank jsonb;
  v_loan jsonb;
  v_events jsonb := '[]'::jsonb;
  v_employee_count integer;
  v_employee_salary bigint;
  v_teacher_count integer;
  v_teacher_salary bigint;
  v_days_until_payment integer;
  v_payments_made bigint;
  v_payroll_total bigint;
  v_days_until_event integer;
  v_events_triggered bigint;
  v_damage bigint;
  v_incident text;
  v_months_remaining integer;
  v_remaining bigint;
  v_installment bigint;
  v_amount_due bigint;
  v_missed integer;
  v_daily_events jsonb;
begin
  if v_owner_id is null then
    raise exception 'Entre na sua conta para usar o calendário em tempo real.'
      using errcode = '28000';
  end if;

  select c.*
    into v_city
    from public.cities c
   where c.owner_id = v_owner_id
   for update;

  if not found then
    raise exception 'A cidade ainda não foi inicializada.'
      using errcode = 'P0002';
  end if;

  v_date := v_city.last_processed_date;
  v_money := coalesce((v_city.game_state ->> 'money')::bigint, 0);
  v_materials := coalesce((v_city.game_state ->> 'materials')::bigint, 0);
  v_payroll := coalesce(v_city.game_state -> 'payroll', '{}'::jsonb);
  v_employee_count := coalesce((v_payroll ->> 'employeeCount')::integer, 3);
  v_employee_salary := coalesce((v_payroll ->> 'weeklySalaryCents')::bigint, 50000);
  v_teacher_count := coalesce((v_payroll ->> 'teacherCount')::integer, 0);
  v_teacher_salary := coalesce((v_payroll ->> 'teacherWeeklySalaryCents')::bigint, 80000);
  v_days_until_payment := coalesce((v_payroll ->> 'daysUntilPayment')::integer, 7);
  v_payments_made := coalesce((v_payroll ->> 'paymentsMade')::bigint, 0);
  v_disasters := coalesce(v_city.game_state -> 'disasters', '{}'::jsonb);
  v_days_until_event := coalesce(
    (v_disasters ->> 'daysUntilEvent')::integer,
    7 + floor(random() * 8)::integer
  );
  v_events_triggered := coalesce((v_disasters ->> 'eventsTriggered')::bigint, 0);
  v_bank := coalesce(v_city.game_state -> 'bank', '{}'::jsonb);
  v_loan := v_bank -> 'loan';
  v_daily_events := '[]'::jsonb;

  while v_date < v_today loop
    v_date := v_date + 1;
    v_processed := v_processed + 1;
    v_money := v_money + 12000;
    v_materials := v_materials + 10;

    v_city.game_state := public.append_city_transaction(
      v_city.game_state,
      'Repasse diário da prefeitura',
      12000,
      v_date
    );

    v_days_until_payment := v_days_until_payment - 1;
    if v_days_until_payment <= 0 then
      v_payroll_total := (v_employee_count * v_employee_salary)
        + (v_teacher_count * v_teacher_salary);
      v_money := v_money - v_payroll_total;
      v_payments_made := v_payments_made + 1;
      v_days_until_payment := 7;
      v_city.game_state := public.append_city_transaction(
        v_city.game_state,
        format('Folha semanal (%s funcionários)', v_employee_count + v_teacher_count),
        -v_payroll_total,
        v_date
      );
      v_daily_events := v_daily_events || jsonb_build_array(jsonb_build_object(
        'type', 'payroll',
        'date', v_date,
        'amountCents', v_payroll_total,
        'message', format('Folha semanal paga: R$ %s.', to_char(v_payroll_total / 100.0, 'FM999G999G990D00'))
      ));
    end if;

    v_days_until_event := v_days_until_event - 1;
    if v_days_until_event <= 0 then
      case floor(random() * 4)::integer
        when 0 then
          v_incident := 'Temporal danificou vias e drenagem';
          v_damage := 20000 + floor(random() * 25001)::bigint;
        when 1 then
          v_incident := 'Seca exigiu abastecimento emergencial';
          v_damage := 30000 + floor(random() * 30001)::bigint;
        when 2 then
          v_incident := 'Ventos fortes danificaram equipamentos públicos';
          v_damage := 25000 + floor(random() * 30001)::bigint;
        else
          v_incident := 'Alagamento exigiu reparos emergenciais';
          v_damage := 40000 + floor(random() * 40001)::bigint;
      end case;
      v_money := v_money - v_damage;
      v_events_triggered := v_events_triggered + 1;
      v_days_until_event := 7 + floor(random() * 8)::integer;
      v_city.game_state := public.append_city_transaction(
        v_city.game_state,
        format('Desastre: %s', v_incident),
        -v_damage,
        v_date
      );
      v_daily_events := v_daily_events || jsonb_build_array(jsonb_build_object(
        'type', 'disaster',
        'date', v_date,
        'amountCents', v_damage,
        'message', format(
          'Alerta da cidade: %s. Reparo emergencial: R$ %s.',
          v_incident,
          to_char(v_damage / 100.0, 'FM999G999G990D00')
        )
      ));
    end if;

    if extract(day from v_date) = 1
      and jsonb_typeof(v_loan) = 'object'
      and coalesce(v_loan ->> 'status', '') in ('active', 'overdue') then
      v_months_remaining := coalesce((v_loan ->> 'monthsRemaining')::integer, 0);
      v_remaining := coalesce((v_loan ->> 'remainingCents')::bigint, 0);
      v_installment := coalesce((v_loan ->> 'installmentCents')::bigint, 0);
      v_missed := coalesce((v_loan ->> 'missedPayments')::integer, 0);
      v_amount_due := case
        when v_months_remaining = 1 then v_remaining
        else least(v_installment, v_remaining)
      end;

      if v_money < v_amount_due then
        v_loan := jsonb_set(v_loan, '{status}', '"overdue"'::jsonb, true);
        v_loan := jsonb_set(v_loan, '{missedPayments}', to_jsonb(v_missed + 1), true);
        v_city.game_state := public.append_city_transaction(
          v_city.game_state,
          'Parcela não paga — saldo insuficiente',
          0,
          v_date
        );
        v_daily_events := v_daily_events || jsonb_build_array(jsonb_build_object(
          'type', 'loan_overdue',
          'date', v_date,
          'amountCents', v_amount_due,
          'message', format('Parcela do empréstimo de R$ %s pendente por falta de saldo.', to_char(v_amount_due / 100.0, 'FM999G999G990D00'))
        ));
      else
        v_money := v_money - v_amount_due;
        v_remaining := v_remaining - v_amount_due;
        v_months_remaining := greatest(0, v_months_remaining - 1);
        v_loan := jsonb_set(v_loan, '{remainingCents}', to_jsonb(v_remaining), true);
        v_loan := jsonb_set(v_loan, '{monthsRemaining}', to_jsonb(v_months_remaining), true);
        v_loan := jsonb_set(v_loan, '{status}', to_jsonb(case when v_months_remaining = 0 then 'paid' else 'active' end), true);
        v_city.game_state := public.append_city_transaction(
          v_city.game_state,
          'Parcela do empréstimo',
          -v_amount_due,
          v_date
        );
        v_daily_events := v_daily_events || jsonb_build_array(jsonb_build_object(
          'type', 'loan_payment',
          'date', v_date,
          'amountCents', v_amount_due,
          'message', case
            when v_months_remaining = 0 then format('Empréstimo quitado com a parcela de R$ %s.', to_char(v_amount_due / 100.0, 'FM999G999G990D00'))
            else format('Parcela do empréstimo de R$ %s paga; restam %s.', to_char(v_amount_due / 100.0, 'FM999G999G990D00'), v_months_remaining)
          end
        ));
      end if;
    end if;
  end loop;

  v_payroll := jsonb_set(v_payroll, '{employeeCount}', to_jsonb(v_employee_count), true);
  v_payroll := jsonb_set(v_payroll, '{weeklySalaryCents}', to_jsonb(v_employee_salary), true);
  v_payroll := jsonb_set(v_payroll, '{teacherCount}', to_jsonb(v_teacher_count), true);
  v_payroll := jsonb_set(v_payroll, '{teacherWeeklySalaryCents}', to_jsonb(v_teacher_salary), true);
  v_payroll := jsonb_set(v_payroll, '{daysUntilPayment}', to_jsonb(v_days_until_payment), true);
  v_payroll := jsonb_set(v_payroll, '{paymentsMade}', to_jsonb(v_payments_made), true);
  v_disasters := jsonb_set(v_disasters, '{daysUntilEvent}', to_jsonb(v_days_until_event), true);
  v_disasters := jsonb_set(v_disasters, '{eventsTriggered}', to_jsonb(v_events_triggered), true);
  v_bank := jsonb_set(v_bank, '{loan}', coalesce(v_loan, 'null'::jsonb), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{money}', to_jsonb(v_money), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{materials}', to_jsonb(v_materials), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{day}', to_jsonb(extract(day from v_today)::integer), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{month}', to_jsonb(extract(month from v_today)::integer), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{economyVersion}', '2'::jsonb, true);
  v_city.game_state := jsonb_set(v_city.game_state, '{payroll}', v_payroll, true);
  v_city.game_state := jsonb_set(v_city.game_state, '{disasters}', v_disasters, true);
  v_city.game_state := jsonb_set(v_city.game_state, '{bank}', v_bank, true);

  update public.cities
     set game_state = v_city.game_state,
         last_processed_date = v_today
   where id = v_city.id;

  select coalesce(jsonb_agg(event order by event_date), '[]'::jsonb)
    into v_events
    from (
      select event, event ->> 'date' as event_date
        from jsonb_array_elements(v_daily_events) as events(event)
       order by event ->> 'date' desc
       limit 30
    ) recent;

  return jsonb_build_object(
    'game_state', v_city.game_state,
    'server_date', v_today,
    'server_now', v_server_now,
    'processed_days', v_processed,
    'events', v_events
  );
end;
$$;

revoke all on function public.sync_city_clock() from public, anon;
grant execute on function public.sync_city_clock() to authenticated;
