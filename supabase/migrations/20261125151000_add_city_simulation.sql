create table if not exists public.city_simulation_progress (
  city_id uuid primary key references public.cities (id) on delete cascade,
  last_processed_date date not null,
  water_level integer not null check (water_level between 0 and 100),
  energy_level integer not null check (energy_level between 0 and 100),
  water_connected boolean not null,
  energy_connected boolean not null,
  property_tax_paid boolean not null
);

alter table public.city_simulation_progress enable row level security;
revoke all on public.city_simulation_progress from public, anon, authenticated;

create or replace function public.process_city_simulation(p_processed_days integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_city public.cities%rowtype;
  v_progress public.city_simulation_progress%rowtype;
  v_simulation jsonb;
  v_bank jsonb;
  v_date date;
  v_processed integer := 0;
  v_money bigint;
  v_water_bill bigint;
  v_energy_bill bigint;
  v_property_tax bigint;
  v_water_residents_per_point integer;
  v_energy_residents_per_point integer;
  v_water_level integer;
  v_energy_level integer;
  v_water_connected boolean;
  v_energy_connected boolean;
  v_property_tax_paid boolean;
  v_population integer;
  v_happiness integer;
  v_water_use integer;
  v_energy_use integer;
  v_events jsonb := '[]'::jsonb;
  v_event jsonb;
  v_message text;
begin
  if v_owner_id is null then
    raise exception 'Entre na sua conta para processar a simulação da cidade.'
      using errcode = '28000';
  end if;
  if p_processed_days is null or p_processed_days < 0 or p_processed_days > 3660 then
    raise exception 'Quantidade de dias inválida para processar a simulação.'
      using errcode = '22023';
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

  v_simulation := coalesce(v_city.game_state -> 'simulation', '{}'::jsonb);
  v_money := coalesce((v_city.game_state ->> 'money')::bigint, 0);
  v_population := greatest(1, coalesce((v_city.game_state ->> 'population')::integer, 24));
  v_happiness := greatest(0, least(100, coalesce((v_city.game_state ->> 'happiness')::integer, 72)));
  v_water_bill := case
    when v_simulation ->> 'waterBillCents' ~ '^[0-9]{1,11}$'
      then least((v_simulation ->> 'waterBillCents')::bigint, 100000000)
    else 12000
  end;
  v_energy_bill := case
    when v_simulation ->> 'energyBillCents' ~ '^[0-9]{1,11}$'
      then least((v_simulation ->> 'energyBillCents')::bigint, 100000000)
    else 18000
  end;
  v_property_tax := case
    when v_simulation ->> 'propertyTaxCents' ~ '^[0-9]{1,11}$'
      then least((v_simulation ->> 'propertyTaxCents')::bigint, 100000000)
    else 7500
  end;
  v_water_residents_per_point := case
    when v_simulation ->> 'waterResidentsPerPoint' ~ '^[0-9]{1,4}$'
      then greatest(1, least((v_simulation ->> 'waterResidentsPerPoint')::integer, 1000))
    else 12
  end;
  v_energy_residents_per_point := case
    when v_simulation ->> 'energyResidentsPerPoint' ~ '^[0-9]{1,4}$'
      then greatest(1, least((v_simulation ->> 'energyResidentsPerPoint')::integer, 1000))
    else 8
  end;
  v_water_level := case
    when v_simulation ->> 'waterLevel' ~ '^(100|[0-9]{1,2})$'
      then (v_simulation ->> 'waterLevel')::integer
    else 100
  end;
  v_energy_level := case
    when v_simulation ->> 'energyLevel' ~ '^(100|[0-9]{1,2})$'
      then (v_simulation ->> 'energyLevel')::integer
    else 100
  end;
  v_water_connected := case
    when v_simulation ->> 'waterConnected' in ('true', 'false')
      then (v_simulation ->> 'waterConnected')::boolean
    else true
  end;
  v_energy_connected := case
    when v_simulation ->> 'energyConnected' in ('true', 'false')
      then (v_simulation ->> 'energyConnected')::boolean
    else true
  end;
  v_property_tax_paid := case
    when v_simulation ->> 'propertyTaxPaid' in ('true', 'false')
      then (v_simulation ->> 'propertyTaxPaid')::boolean
    else true
  end;

  select p.*
    into v_progress
    from public.city_simulation_progress p
   where p.city_id = v_city.id
   for update;

  if found then
    v_date := v_progress.last_processed_date;
    v_water_level := v_progress.water_level;
    v_energy_level := v_progress.energy_level;
    v_water_connected := v_progress.water_connected;
    v_energy_connected := v_progress.energy_connected;
    v_property_tax_paid := v_progress.property_tax_paid;
  else
    v_date := v_city.last_processed_date - p_processed_days;
    insert into public.city_simulation_progress (
      city_id, last_processed_date, water_level, energy_level,
      water_connected, energy_connected, property_tax_paid
    ) values (
      v_city.id, v_date, v_water_level, v_energy_level,
      v_water_connected, v_energy_connected, v_property_tax_paid
    );
  end if;

  v_bank := coalesce(v_city.game_state -> 'bank', '{}'::jsonb);

  while v_date < v_city.last_processed_date loop
    v_date := v_date + 1;
    v_processed := v_processed + 1;

    if extract(day from v_date) = 1 then
      if v_money >= v_water_bill then
        v_money := v_money - v_water_bill;
        v_water_connected := true;
        v_water_level := 100;
        if v_water_bill > 0 then
          v_city.game_state := public.append_city_transaction(
            v_city.game_state, 'Conta mensal de água', -v_water_bill, v_date
          );
        end if;
        v_message := format('Conta de água paga: R$ %s.', to_char(v_water_bill / 100.0, 'FM999G999G990D00'));
        v_event := jsonb_build_object('type', 'utility_bill', 'date', v_date, 'amountCents', v_water_bill, 'message', v_message);
        v_events := v_events || jsonb_build_array(v_event);
      else
        v_water_connected := false;
        v_city.game_state := public.append_city_transaction(
          v_city.game_state, 'Conta de água pendente — saldo insuficiente', 0, v_date
        );
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'utility_outage', 'date', v_date, 'amountCents', v_water_bill,
          'message', format('Água cortada: faltou saldo para pagar R$ %s.', to_char(v_water_bill / 100.0, 'FM999G999G990D00'))
        ));
      end if;

      if v_money >= v_energy_bill then
        v_money := v_money - v_energy_bill;
        v_energy_connected := true;
        v_energy_level := 100;
        if v_energy_bill > 0 then
          v_city.game_state := public.append_city_transaction(
            v_city.game_state, 'Conta mensal de energia', -v_energy_bill, v_date
          );
        end if;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'utility_bill', 'date', v_date, 'amountCents', v_energy_bill,
          'message', format('Conta de energia paga: R$ %s.', to_char(v_energy_bill / 100.0, 'FM999G999G990D00'))
        ));
      else
        v_energy_connected := false;
        v_city.game_state := public.append_city_transaction(
          v_city.game_state, 'Conta de energia pendente — saldo insuficiente', 0, v_date
        );
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'utility_outage', 'date', v_date, 'amountCents', v_energy_bill,
          'message', format('Energia cortada: faltou saldo para pagar R$ %s.', to_char(v_energy_bill / 100.0, 'FM999G999G990D00'))
        ));
      end if;

      if v_money >= v_property_tax then
        v_money := v_money - v_property_tax;
        v_property_tax_paid := true;
        if v_property_tax > 0 then
          v_city.game_state := public.append_city_transaction(
            v_city.game_state, 'Imposto municipal mensal', -v_property_tax, v_date
          );
        end if;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'property_tax', 'date', v_date, 'amountCents', v_property_tax,
          'message', format('Imposto municipal pago: R$ %s.', to_char(v_property_tax / 100.0, 'FM999G999G990D00'))
        ));
      else
        v_property_tax_paid := false;
        v_city.game_state := public.append_city_transaction(
          v_city.game_state, 'Imposto municipal pendente — saldo insuficiente', 0, v_date
        );
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'property_tax', 'date', v_date, 'amountCents', v_property_tax,
          'message', format('Imposto municipal pendente: faltou saldo para pagar R$ %s.', to_char(v_property_tax / 100.0, 'FM999G999G990D00'))
        ));
      end if;
    end if;

    if v_water_connected then
      v_water_use := greatest(1, ceil(v_population::numeric / v_water_residents_per_point)::integer);
      v_water_level := greatest(0, v_water_level - v_water_use);
      if v_water_level = 0 then
        v_water_connected := false;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'utility_outage', 'date', v_date, 'amountCents', 0,
          'message', 'A reserva de água acabou. O serviço volta após o próximo pagamento da conta.'
        ));
      end if;
    end if;

    if v_energy_connected then
      v_energy_use := greatest(1, ceil(v_population::numeric / v_energy_residents_per_point)::integer);
      v_energy_level := greatest(0, v_energy_level - v_energy_use);
      if v_energy_level = 0 then
        v_energy_connected := false;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'utility_outage', 'date', v_date, 'amountCents', 0,
          'message', 'A reserva de energia acabou. O serviço volta após o próximo pagamento da conta.'
        ));
      end if;
    end if;

    if not v_water_connected or not v_energy_connected then
      v_happiness := greatest(0, v_happiness - 1);
    end if;
  end loop;

  v_simulation := jsonb_set(v_simulation, '{waterBillCents}', to_jsonb(v_water_bill), true);
  v_simulation := jsonb_set(v_simulation, '{energyBillCents}', to_jsonb(v_energy_bill), true);
  v_simulation := jsonb_set(v_simulation, '{propertyTaxCents}', to_jsonb(v_property_tax), true);
  v_simulation := jsonb_set(v_simulation, '{waterResidentsPerPoint}', to_jsonb(v_water_residents_per_point), true);
  v_simulation := jsonb_set(v_simulation, '{energyResidentsPerPoint}', to_jsonb(v_energy_residents_per_point), true);
  v_simulation := jsonb_set(v_simulation, '{waterLevel}', to_jsonb(v_water_level), true);
  v_simulation := jsonb_set(v_simulation, '{energyLevel}', to_jsonb(v_energy_level), true);
  v_simulation := jsonb_set(v_simulation, '{waterConnected}', to_jsonb(v_water_connected), true);
  v_simulation := jsonb_set(v_simulation, '{energyConnected}', to_jsonb(v_energy_connected), true);
  v_simulation := jsonb_set(v_simulation, '{propertyTaxPaid}', to_jsonb(v_property_tax_paid), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{money}', to_jsonb(v_money), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{happiness}', to_jsonb(v_happiness), true);
  v_city.game_state := jsonb_set(v_city.game_state, '{simulation}', v_simulation, true);

  update public.cities
     set game_state = v_city.game_state
   where id = v_city.id;

  update public.city_simulation_progress
     set last_processed_date = v_date,
         water_level = v_water_level,
         energy_level = v_energy_level,
         water_connected = v_water_connected,
         energy_connected = v_energy_connected,
         property_tax_paid = v_property_tax_paid
   where city_id = v_city.id;

  select coalesce(jsonb_agg(recent.event order by recent.event_date), '[]'::jsonb)
    into v_events
    from (
      select event, event ->> 'date' as event_date
        from jsonb_array_elements(v_events) as events(event)
       order by event ->> 'date' desc
       limit 30
    ) recent;

  return jsonb_build_object(
    'game_state', v_city.game_state,
    'processed_days', v_processed,
    'events', v_events
  );
end;
$$;

revoke all on function public.process_city_simulation(integer) from public, anon;
grant execute on function public.process_city_simulation(integer) to authenticated;

notify pgrst, 'reload schema';
