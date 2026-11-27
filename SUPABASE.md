# Integração com Supabase

O jogo usa Supabase Auth com e-mail e senha e salva uma cidade por conta. O progresso visitante existente continua guardado no `localStorage` deste navegador, mas jogar exige entrar em uma conta para usar o calendário oficial do Supabase.

## Preparar o projeto

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute as migrações nesta ordem:
   - [`supabase/migrations/20261124210000_create_cities.sql`](./supabase/migrations/20261124210000_create_cities.sql)
   - [`supabase/migrations/20261124213000_create_study_game.sql`](./supabase/migrations/20261124213000_create_study_game.sql)
3. Execute também [`supabase/migrations/20261124230000_add_realtime_city_clock.sql`](./supabase/migrations/20261124230000_add_realtime_city_clock.sql), depois das duas migrações acima.
4. Execute [`supabase/migrations/20261125151000_add_city_simulation.sql`](./supabase/migrations/20261125151000_add_city_simulation.sql) para ativar o consumo e as contas mensais.
5. Execute [`supabase/migrations/20261126170000_add_subject_teacher_daily_salary.sql`](./supabase/migrations/20261126170000_add_subject_teacher_daily_salary.sql) para ativar a professora por matéria e o salário diário.
6. Em **Project Settings → API**, copie a Project URL e a chave pública **Publishable key** (ou a chave legada `anon`).
7. Preencha `url` e `anonKey` em [`supabase-config.js`](./supabase-config.js). Essas credenciais públicas podem estar no navegador; nunca use a `service_role` ou outra chave secreta no frontend.
8. Sirva a pasta por HTTP local, por exemplo com `python -m http.server 8000`, e abra `http://localhost:8000`. Não abra o arquivo com `file://`.
9. Clique no avatar e crie uma conta ou entre. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o endereço antes de entrar.

## Dados e segurança

- `public.cities` guarda o nome, a versão do formato e o estado JSON da cidade de cada jogador. O orçamento (inclusive saldo negativo), folha semanal, professora por matéria com salário diário configurável, calendário de desastres, contagem de erros, conta municipal, empréstimo e cursores das bibliotecas acompanham esse estado. A preferência de áudio fica apenas neste dispositivo.
- Row Level Security (RLS) limita a leitura ao proprietário. As gravações são feitas pelas RPCs autenticadas `save_city_state()` e `sync_city_clock()`; o cliente não tem permissão direta de inserir ou atualizar linhas de `cities`.
- `save_city_state()` preserva a data e os contadores de rotina do servidor, aplica alterações de saldo como diferenças sobre a última versão sincronizada e usa IDs idempotentes para não reaplicar um salvamento se a resposta da rede se perder.
- A migração recria `save_city_state()` com os nomes exatos dos parâmetros usados pelo cliente e envia `NOTIFY pgrst, 'reload schema'`. Se aparecer “Could not find the function ... in the schema cache”, execute novamente a migração completa no SQL Editor e aguarde a atualização do cache; confirme que a função existe consultando `pg_get_function_arguments()` antes de tentar entrar novamente.
- A chave pública é destinada ao cliente. A proteção dos dados depende das políticas RLS; não desative RLS nem exponha uma chave `service_role`.
- O jogo salva alterações automaticamente após mudanças. Uma falha de sincronização é exibida no jogo e também no console do navegador.
- É necessário entrar para jogar. Sem autenticação, o progresso local continua visível neste navegador, mas não é possível construir, estudar ou alterar a cidade. Ao conectar uma conta sem cidade salva, o progresso de visitante deste navegador é enviado para essa conta; se a conta já tiver uma cidade, ela é carregada e o progresso local permanece no navegador.
- A coluna `cities.last_processed_date` e a RPC `sync_city_clock()` usam `America/Sao_Paulo` e a data do servidor. O app consulta o relógio ao entrar, ao voltar à aba e periodicamente. Ao reconectar, a função processa transacionalmente cada data que passou: repasse diário, materiais, folhas semanais, desastres e parcelas de empréstimo. Repetir a chamada não duplica dias já processados.
- A RPC `process_city_simulation()` aplica o consumo diário de água e energia, as contas de serviços e o imposto municipal no mesmo calendário oficial. As contas vencem no dia 1; falta de saldo deixa a cobrança pendente, corta o serviço correspondente e reduz a felicidade enquanto houver interrupção. O consumo e as cobranças atrasadas são recuperados após períodos sem acesso.
- As configurações da simulação ficam salvas no estado da cidade. O botão **Configurar** permite alterar a recompensa por resposta correta e os valores mensais de água, energia e imposto.
- A receita e a folha vencem na mudança da data civil em Brasília; parcelas de empréstimo vencem no primeiro dia de cada mês civil. O catch-up ocorre assim que a cidade volta a sincronizar; não requer Supabase Cron.
- O estado JSON usa `state_version = 1`, permitindo migrar o formato quando o jogo evoluir.
- A migração educacional cria matérias, desafios, alternativas, tentativas e conclusões. O gabarito fica em uma tabela sem acesso direto dos jogadores.
- `get_study_challenges()` lista desafios e alternativas sem revelar o gabarito; `submit_study_answer(challenge_id, option_id)` valida a resposta no banco e concede pontos apenas na primeira resposta correta; `get_my_study_progress()` retorna o progresso por matéria.
- Essas funções RPC estão preparadas no banco. A tela atual usa as bibliotecas locais `study-question-bank.js` e `finance-question-bank.js`; ela ainda precisa ser adaptada para buscar e responder usando as RPCs antes de os pontos de estudo passarem a ser registrados nelas.
- O Banco Central da Cidade e os desafios são simulados pelo jogo e gravados no estado da cidade; não representam dinheiro nem serviços financeiros reais. A cidade sincroniza separadamente o avanço da biblioteca de sete assuntos e o dos desafios financeiros. Para as regras e conteúdos, consulte [FINANCAS.md](./FINANCAS.md).

Para produção, configure também a URL de redirecionamento e os provedores de autenticação em **Authentication → URL Configuration** no painel do Supabase.

Para publicar o jogo para acesso no iPhone, Android e computador, consulte o guia [ACESSO-MOBILE.md](./ACESSO-MOBILE.md).
