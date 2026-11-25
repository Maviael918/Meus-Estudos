# Acessar Cidade em Construção no computador e no celular

O jogo é uma aplicação web responsiva. Não é necessário publicar na App Store nem instalar um aplicativo nativo.

## Publicar para acesso fora do computador

Hospede os arquivos do projeto em um endereço público com **HTTPS**. GitHub Pages, Netlify, Vercel ou outro serviço de hospedagem estática pode servir os arquivos. O HTTPS é necessário para o service worker, instalação e uso offline.

Publique juntos `index.html`, `style.css`, `app.js`, `supabase-client.js`, `supabase-config.js`, `manifest.webmanifest`, `service-worker.js` e a pasta `icons/`. O caminho raiz do site deve permitir carregar esses arquivos, pois o manifesto e o service worker usam caminhos relativos.

## Adicionar à Tela de Início no iPhone ou iPad

1. Abra o endereço publicado no **Safari**.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Se a opção aparecer, mantenha **Abrir como App Web** ativada e toque em **Adicionar**.
5. Abra o ícone criado para jogar em uma janela própria.

O botão **Instalar** do jogo mostra estas instruções no Safari do iPhone. Em navegadores compatíveis no Android ou computador, ele também pode abrir a instalação oferecida pelo navegador.

## Acesso e sincronização

O jogador pode abrir o endereço no navegador do computador e do celular. Para sincronizar o progresso entre dispositivos, configure o Supabase, publique as migrações e entre na mesma conta nos dois aparelhos. Como visitante, o progresso fica somente no armazenamento local de cada navegador.

O app shell é armazenado pelo service worker para carregamento posterior sem rede. A sincronização de conta e outros pedidos ao Supabase ainda precisam de conexão com a internet.
