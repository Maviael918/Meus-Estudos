# Integração com Supabase

O jogo usa Supabase Auth com e-mail e senha e salva uma cidade por conta. Sem configuração, continua funcionando como visitante e guarda o progresso no `localStorage` deste navegador.

## Preparar o projeto

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute as migrações nesta ordem:
   - [`supabase/migrations/20261124210000_create_cities.sql`](./supabase/migrations/20261124210000_create_cities.sql)
   - [`supabase/migrations/20261124213000_create_study_game.sql`](./supabase/migrations/20261124213000_create_study_game.sql)
3. Em **Project Settings → API**, copie a Project URL e a chave pública **Publishable key** (ou a chave legada `anon`).
4. Preencha `url` e `anonKey` em [`supabase-config.js`](./supabase-config.js). Essas credenciais públicas podem estar no navegador; nunca use a `service_role` ou outra chave secreta no frontend.
5. Sirva a pasta por HTTP local, por exemplo com `python -m http.server 8000`, e abra `http://localhost:8000`. Não abra o arquivo com `file://`.
6. Clique no avatar e crie uma conta ou entre. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o endereço antes de entrar.

## Dados e segurança

- `public.cities` guarda o nome, a versão do formato e o estado JSON da cidade de cada jogador. O orçamento em centavos de real, a conta municipal, o empréstimo e o cursor da biblioteca de desafios acompanham esse estado.
- Row Level Security (RLS) limita leitura e gravação ao usuário autenticado que possui a linha.
- A chave pública é destinada ao cliente. A proteção dos dados depende das políticas RLS; não desative RLS nem exponha uma chave `service_role`.
- O jogo salva alterações automaticamente após mudanças. Uma falha de sincronização é exibida no jogo e também no console do navegador.
- Ao conectar uma conta sem cidade salva, o progresso de visitante deste navegador é enviado para essa conta.
- O estado JSON usa `state_version = 1`, permitindo migrar o formato quando o jogo evoluir.
- A migração educacional cria matérias, desafios, alternativas, tentativas e conclusões. O gabarito fica em uma tabela sem acesso direto dos jogadores.
- `get_study_challenges()` lista desafios e alternativas sem revelar o gabarito; `submit_study_answer(challenge_id, option_id)` valida a resposta no banco e concede pontos apenas na primeira resposta correta; `get_my_study_progress()` retorna o progresso por matéria.
- Essas funções RPC estão preparadas no banco. A tela atual ainda apresenta os desafios definidos em `app.js`; ela precisa ser adaptada para buscar e responder usando as RPCs antes de os pontos de estudo passarem a ser registrados nelas.
- O Banco Central da Cidade e os desafios financeiros atuais são simulados pelo jogo e gravados no estado da cidade; não representam dinheiro nem serviços financeiros reais. Para as regras, taxas e biblioteca sem repetição, consulte [FINANCAS.md](./FINANCAS.md).

Para produção, configure também a URL de redirecionamento e os provedores de autenticação em **Authentication → URL Configuration** no painel do Supabase.

Para publicar o jogo para acesso no iPhone, Android e computador, consulte o guia [ACESSO-MOBILE.md](./ACESSO-MOBILE.md).
