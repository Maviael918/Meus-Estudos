create table if not exists public.study_subjects (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.study_challenges (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.study_subjects (id) on delete restrict,
  prompt text not null,
  points integer not null default 10 check (points between 1 and 1000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists study_challenges_active_subject_idx
  on public.study_challenges (subject_id, id)
  where is_active;

create table if not exists public.study_options (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.study_challenges (id) on delete cascade,
  label text not null,
  sort_order smallint not null check (sort_order > 0),
  unique (challenge_id, sort_order),
  unique (challenge_id, id)
);

create table if not exists public.study_answer_keys (
  challenge_id uuid primary key references public.study_challenges (id) on delete cascade,
  correct_option_id uuid not null,
  explanation text not null,
  foreign key (challenge_id, correct_option_id)
    references public.study_options (challenge_id, id)
    on delete cascade
);

create table if not exists public.study_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null,
  selected_option_id uuid not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  foreign key (challenge_id, selected_option_id)
    references public.study_options (challenge_id, id)
    on delete cascade
);

create index if not exists study_attempts_player_created_idx
  on public.study_attempts (player_id, created_at desc);

create table if not exists public.study_completions (
  player_id uuid not null references auth.users (id) on delete cascade,
  challenge_id uuid not null references public.study_challenges (id) on delete cascade,
  points_awarded integer not null check (points_awarded > 0),
  completed_at timestamptz not null default now(),
  primary key (player_id, challenge_id)
);

alter table public.study_subjects enable row level security;
alter table public.study_challenges enable row level security;
alter table public.study_options enable row level security;
alter table public.study_answer_keys enable row level security;
alter table public.study_attempts enable row level security;
alter table public.study_completions enable row level security;

revoke all on public.study_subjects, public.study_challenges, public.study_options,
  public.study_answer_keys, public.study_attempts, public.study_completions
  from public, anon, authenticated;

grant select on public.study_subjects, public.study_challenges, public.study_options
  to authenticated;
grant select on public.study_attempts, public.study_completions to authenticated;

drop policy if exists "Authenticated players can read subjects"
  on public.study_subjects;
create policy "Authenticated players can read subjects"
  on public.study_subjects for select
  to authenticated
  using (true);

drop policy if exists "Authenticated players can read active challenges"
  on public.study_challenges;
create policy "Authenticated players can read active challenges"
  on public.study_challenges for select
  to authenticated
  using (is_active);

drop policy if exists "Authenticated players can read options of active challenges"
  on public.study_options;
create policy "Authenticated players can read options of active challenges"
  on public.study_options for select
  to authenticated
  using (
    exists (
      select 1
      from public.study_challenges c
      where c.id = challenge_id
        and c.is_active
    )
  );

drop policy if exists "Players can read their own attempts"
  on public.study_attempts;
create policy "Players can read their own attempts"
  on public.study_attempts for select
  to authenticated
  using ((select auth.uid()) = player_id);

drop policy if exists "Players can read their own completions"
  on public.study_completions;
create policy "Players can read their own completions"
  on public.study_completions for select
  to authenticated
  using ((select auth.uid()) = player_id);

create or replace function public.get_study_challenges()
returns table (
  challenge_id uuid,
  subject_id text,
  subject_name text,
  prompt text,
  points integer,
  options jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    s.id,
    s.name,
    c.prompt,
    c.points,
    jsonb_agg(
      jsonb_build_object('id', o.id, 'label', o.label)
      order by o.sort_order
    )
  from public.study_challenges c
  join public.study_subjects s on s.id = c.subject_id
  join public.study_options o on o.challenge_id = c.id
  where c.is_active
  group by c.id, s.id, s.name, c.prompt, c.points
  order by s.name, c.created_at, c.id;
$$;

create or replace function public.get_my_study_progress()
returns table (
  subject_id text,
  subject_name text,
  completed_challenges bigint,
  total_points bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id,
    s.name,
    count(distinct sc.challenge_id),
    coalesce(sum(sc.points_awarded), 0)::bigint
  from public.study_subjects s
  left join public.study_challenges c
    on c.subject_id = s.id
   and c.is_active
  left join public.study_completions sc
    on sc.challenge_id = c.id
   and sc.player_id = (select auth.uid())
  group by s.id, s.name
  order by s.name;
$$;

create or replace function public.submit_study_answer(
  p_challenge_id uuid,
  p_selected_option_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid := auth.uid();
  v_correct_option_id uuid;
  v_explanation text;
  v_points integer;
  v_is_correct boolean;
  v_points_awarded integer := 0;
  v_already_completed boolean := false;
begin
  if v_player_id is null then
    raise exception 'É necessário entrar na conta para responder desafios.'
      using errcode = '28000';
  end if;

  select c.points
    into v_points
    from public.study_challenges c
   where c.id = p_challenge_id
     and c.is_active
   for share;

  if not found then
    raise exception 'Desafio não encontrado ou inativo.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.study_options o
     where o.challenge_id = p_challenge_id
       and o.id = p_selected_option_id
  ) then
    raise exception 'A alternativa não pertence a este desafio.'
      using errcode = '22023';
  end if;

  select k.correct_option_id, k.explanation
    into v_correct_option_id, v_explanation
    from public.study_answer_keys k
   where k.challenge_id = p_challenge_id;

  if not found then
    raise exception 'O gabarito deste desafio ainda não foi configurado.'
      using errcode = '55000';
  end if;

  v_is_correct := p_selected_option_id = v_correct_option_id;

  insert into public.study_attempts (
    player_id, challenge_id, selected_option_id, is_correct
  ) values (
    v_player_id, p_challenge_id, p_selected_option_id, v_is_correct
  );

  if v_is_correct then
    insert into public.study_completions (
      player_id, challenge_id, points_awarded
    ) values (
      v_player_id, p_challenge_id, v_points
    )
    on conflict (player_id, challenge_id) do nothing
    returning points_awarded into v_points_awarded;

    if not found then
      v_points_awarded := 0;
      v_already_completed := true;
    end if;
  end if;

  return jsonb_build_object(
    'correct', v_is_correct,
    'explanation', v_explanation,
    'points_awarded', v_points_awarded,
    'already_completed', v_already_completed
  );
end;
$$;

revoke all on function public.get_study_challenges() from public, anon;
revoke all on function public.get_my_study_progress() from public, anon;
revoke all on function public.submit_study_answer(uuid, uuid) from public, anon;
grant execute on function public.get_study_challenges() to authenticated;
grant execute on function public.get_my_study_progress() to authenticated;
grant execute on function public.submit_study_answer(uuid, uuid) to authenticated;

insert into public.study_subjects (id, name)
values ('matematica', 'Matemática'), ('portugues', 'Português')
on conflict (id) do nothing;

insert into public.study_challenges (id, subject_id, prompt, points)
values
  ('20000000-0000-4000-8000-000000000001', 'matematica', 'Uma casa recebe 8 moradores. Se construirmos 2 casas, quantas pessoas poderão morar nelas?', 10),
  ('20000000-0000-4000-8000-000000000002', 'portugues', 'Qual frase está escrita corretamente?', 10),
  ('20000000-0000-4000-8000-000000000003', 'matematica', 'O mercadinho faturou 200 ₡ e gastou 80 ₡. Quanto sobrou?', 10),
  ('20000000-0000-4000-8000-000000000004', 'portugues', 'Em um aviso, qual frase informa com clareza o horário de funcionamento?', 10),
  ('20000000-0000-4000-8000-000000000005', 'matematica', 'A escola tem 3 turmas com 12 alunos em cada uma. Quantos alunos estudam lá?', 10),
  ('20000000-0000-4000-8000-000000000006', 'matematica', 'A escola recebeu 40 livros e distribuiu 25. Quantos livros restaram?', 10),
  ('20000000-0000-4000-8000-000000000007', 'matematica', 'No parque há 4 canteiros com 6 flores em cada um. Quantas flores há ao todo?', 10),
  ('20000000-0000-4000-8000-000000000008', 'portugues', 'Qual atitude ajuda a manter o parque limpo?', 10),
  ('20000000-0000-4000-8000-000000000009', 'matematica', 'Uma fábrica produz 15 brinquedos por dia. Quantos produz em 4 dias?', 10),
  ('20000000-0000-4000-8000-000000000010', 'matematica', 'Uma máquina custa 500 ₡ e tem desconto de 10%. Qual é o preço com desconto?', 10),
  ('20000000-0000-4000-8000-000000000011', 'matematica', 'A nova região terá 5 terrenos. Se 2 serão usados para moradias, quantos terrenos sobram para outros projetos?', 10)
on conflict (id) do nothing;

insert into public.study_options (id, challenge_id, label, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '12 pessoas', 1),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '16 pessoas', 2),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '18 pessoas', 3),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'As famílias precisa de moradia.', 1),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'As famílias precisam de moradia.', 2),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'As família precisam de moradia.', 3),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000003', '120 ₡', 1),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000003', '180 ₡', 2),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', '280 ₡', 3),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000004', 'Abrimos quando o sol aparece.', 1),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000004', 'Funcionamos das 8h às 18h.', 2),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000004', 'O mercado é bem legal.', 3),
  ('30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000005', '15 alunos', 1),
  ('30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000005', '36 alunos', 2),
  ('30000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000005', '32 alunos', 3),
  ('30000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000006', '15 livros', 1),
  ('30000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000006', '25 livros', 2),
  ('30000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000006', '65 livros', 3),
  ('30000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000007', '10 flores', 1),
  ('30000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000007', '24 flores', 2),
  ('30000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000007', '46 flores', 3),
  ('30000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000008', 'Deixar o lixo no gramado.', 1),
  ('30000000-0000-4000-8000-000000000023', '20000000-0000-4000-8000-000000000008', 'Separar e descartar o lixo corretamente.', 2),
  ('30000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000008', 'Arrancar as plantas.', 3),
  ('30000000-0000-4000-8000-000000000025', '20000000-0000-4000-8000-000000000009', '19 brinquedos', 1),
  ('30000000-0000-4000-8000-000000000026', '20000000-0000-4000-8000-000000000009', '60 brinquedos', 2),
  ('30000000-0000-4000-8000-000000000027', '20000000-0000-4000-8000-000000000009', '45 brinquedos', 3),
  ('30000000-0000-4000-8000-000000000028', '20000000-0000-4000-8000-000000000010', '450 ₡', 1),
  ('30000000-0000-4000-8000-000000000029', '20000000-0000-4000-8000-000000000010', '490 ₡', 2),
  ('30000000-0000-4000-8000-000000000030', '20000000-0000-4000-8000-000000000010', '550 ₡', 3),
  ('30000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-000000000011', '2 terrenos', 1),
  ('30000000-0000-4000-8000-000000000032', '20000000-0000-4000-8000-000000000011', '3 terrenos', 2),
  ('30000000-0000-4000-8000-000000000033', '20000000-0000-4000-8000-000000000011', '7 terrenos', 3)
on conflict (id) do nothing;

insert into public.study_answer_keys (challenge_id, correct_option_id, explanation)
values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', '8 moradores × 2 casas = 16 pessoas.'),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000005', 'O sujeito "as famílias" está no plural: precisam.'),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000007', '200 − 80 = 120 ₡ de saldo.'),
  ('20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000011', 'A frase apresenta informação objetiva e precisa.'),
  ('20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000014', '3 × 12 = 36 alunos.'),
  ('20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000016', '40 − 25 = 15 livros.'),
  ('20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000020', '4 × 6 = 24 flores.'),
  ('20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000023', 'Descartar o lixo corretamente preserva os espaços públicos.'),
  ('20000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000026', '15 × 4 = 60 brinquedos.'),
  ('20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000028', '10% de 500 é 50; 500 − 50 = 450 ₡.'),
  ('20000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000032', '5 − 2 = 3 terrenos disponíveis para outros projetos.')
on conflict (challenge_id) do nothing;

comment on table public.study_answer_keys is
  'Gabarito privado: nunca conceder SELECT para anon ou authenticated.';

comment on function public.submit_study_answer(uuid, uuid) is
  'Valida uma alternativa, registra a tentativa e concede pontos apenas na primeira resposta correta de cada desafio.';
