update public.cities c
   set game_state = jsonb_set(
     coalesce(c.game_state, '{}'::jsonb),
     '{payroll}',
     jsonb_set(
       jsonb_set(
         jsonb_set(
           coalesce(c.game_state -> 'payroll', '{}'::jsonb),
           '{teacherWeeklySalaryCents}',
           '0'::jsonb,
           true
         ),
         '{teacherDailySalaryCents}',
         case
           when coalesce(c.game_state #>> '{payroll,teacherDailySalaryCents}', '') ~ '^[0-9]{1,11}$'
             then to_jsonb(least((c.game_state #>> '{payroll,teacherDailySalaryCents}')::bigint, 100000000))
          when case
            when coalesce(c.game_state #>> '{payroll,teacherCount}', '') ~ '^[0-9]{1,4}$'
              then (c.game_state #>> '{payroll,teacherCount}')::integer
            else 0
          end > 0
             then to_jsonb(greatest(0, ceil(coalesce((c.game_state #>> '{payroll,teacherWeeklySalaryCents}')::numeric, 80000) / 7)::bigint))
           else '11429'::jsonb
         end,
         true
       ),
       '{teacherSubject}',
       coalesce(nullif(c.game_state #> '{payroll,teacherSubject}', '""'::jsonb), '"MATEMÁTICA"'::jsonb),
       true
     ),
     true
   );

create or replace function public.charge_teacher_daily_salary_before_clock_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payroll jsonb := coalesce(new.game_state -> 'payroll', '{}'::jsonb);
  v_teacher_count integer;
  v_daily_salary bigint;
  v_teacher_subject text;
  v_money bigint;
  v_date date;
begin
  if new.last_processed_date <= old.last_processed_date then
    return new;
  end if;

  v_teacher_count := case
    when coalesce(v_payroll ->> 'teacherCount', '') ~ '^[0-9]{1,4}$'
      then least((v_payroll ->> 'teacherCount')::integer, 1)
    else 0
  end;
  v_daily_salary := case
    when coalesce(v_payroll ->> 'teacherDailySalaryCents', '') ~ '^[0-9]{1,11}$'
      then least((v_payroll ->> 'teacherDailySalaryCents')::bigint, 100000000)
    else 0
  end;
  if v_teacher_count = 0 or v_daily_salary = 0 then
    return new;
  end if;

  v_teacher_subject := coalesce(nullif(v_payroll ->> 'teacherSubject', ''), 'MATEMÁTICA');
  v_money := case
    when coalesce(new.game_state ->> 'money', '') ~ '^-?[0-9]{1,14}$'
      then (new.game_state ->> 'money')::bigint
    else 0
  end;
  v_date := old.last_processed_date + 1;

  while v_date <= new.last_processed_date loop
    v_money := v_money - v_daily_salary;
    new.game_state := public.append_city_transaction(
      new.game_state,
      format('Salario diario da professora (%s)', v_teacher_subject),
      -v_daily_salary,
      v_date
    );
    v_date := v_date + 1;
  end loop;

  new.game_state := jsonb_set(new.game_state, '{money}', to_jsonb(v_money), true);
  return new;
end;
$$;

revoke all on function public.charge_teacher_daily_salary_before_clock_update()
  from public, anon, authenticated;

drop trigger if exists charge_teacher_daily_salary_before_clock_update on public.cities;
create trigger charge_teacher_daily_salary_before_clock_update
before update of last_processed_date on public.cities
for each row
execute function public.charge_teacher_daily_salary_before_clock_update();

notify pgrst, 'reload schema';
