# Banco Central da Cidade e matemática financeira

## Regras da simulação

- Todos os valores do jogo são em reais (R$), armazenados como centavos inteiros.
- O saldo é nominal: não sofre ajuste automático pelo IPCA. Ele só muda por receitas, despesas e recompensas explicitamente exibidas no jogo. As três missões iniciais pagam uma vez cada; depois de concluídas, não voltam a conceder recompensas.
<<<<<<< HEAD
- Cada resposta correta rende R$ 100,00 por padrão, inclusive nos desafios de construção, expansão e estudo. O valor pode ser ajustado nas configurações da simulação, de R$ 0,00 a R$ 1.000.000,00 por acerto.
- Água e energia têm uma reserva que diminui diariamente conforme a população. As contas de água (R$ 120,00), energia (R$ 180,00) e imposto municipal (R$ 75,00) vencem no primeiro dia de cada mês; os valores podem ser alterados nas configurações da cidade. Se o orçamento não cobrir uma conta, o serviço é interrompido ou o imposto fica pendente. Um serviço cortado pode ser restabelecido no próximo vencimento se a respectiva conta for paga. A felicidade diminui durante interrupções.
=======
>>>>>>> 46cdbbb6cba9dde98b3ab8c77259076d76e24196
- A prefeitura começa com 3 funcionários, cada um recebe R$ 500,00 a cada 7 dias civis. A folha semanal total é de R$ 1.500,00 e é debitada automaticamente do orçamento.
- O saldo pode ficar negativo após o pagamento da folha; construções continuam bloqueadas enquanto o orçamento não cobrir seus custos.
- Cada resposta errada custa R$ 300,00 e é registrada no histórico da conta municipal quando ela está aberta. Cinco erros consecutivos oferecem a contratação opcional de uma professora por R$ 800,00 por semana; a professora pode dar uma dica por desafio.
- A cada 7 a 14 datas civis, um desastre leve aleatório pode exigir de R$ 200,00 a R$ 800,00 em reparos. O próximo alerta aparece no painel, o ocorrido é anunciado e registrado no histórico se a conta estiver aberta.
- O jogo toca alertas diferentes para acertos, erros e desastres. A preferência de áudio pode ser desligada e é guardada neste dispositivo; o áudio começa após uma interação do jogador, conforme as regras dos navegadores móveis.
- O calendário real é controlado pelo servidor Supabase no fuso `America/Sao_Paulo`; não existe botão para avançar o dia. A receita diária é creditada na mudança de data em Brasília, e a folha vence a cada 7 datas civis. O servidor recupera todos os dias vencidos quando a cidade volta a sincronizar.
<<<<<<< HEAD
- O consumo, os vencimentos, os cortes de serviço e os efeitos na felicidade também são processados por data civil no servidor, inclusive ao recuperar dias sem acesso. A configuração requer a migração de simulação descrita em [SUPABASE.md](./SUPABASE.md).
=======
>>>>>>> 46cdbbb6cba9dde98b3ab8c77259076d76e24196
- A contagem para o próximo pagamento e o número de folhas pagas são persistidos por cidade para evitar reiniciar o calendário ao recarregar ou sincronizar.
- A conta municipal é gratuita e usa o mesmo saldo do orçamento apresentado no painel da cidade.
- A cidade pode ter apenas um empréstimo ativo por vez, nos valores de R$ 1.000,00, R$ 5.000,00 ou R$ 10.000,00.
- Empréstimos de juros simples cobram 2% ao mês; empréstimos de juros compostos cobram 1,5% ao mês. O jogador escolhe 6 ou 12 parcelas.
- Antes da liberação, o jogador resolve um desafio do mesmo tipo de juros. O valor calculado no desafio é um exemplo de estudo; o contrato mostra separadamente o total e as parcelas do produto selecionado.
- Uma parcela vence no primeiro dia de cada mês civil em Brasília. Se faltar saldo, ela fica pendente e o jogo tenta novamente no próximo mês, sem multa nesta versão educativa.
- O saldo, a conta, o contrato e os avanços das bibliotecas de estudo são guardados no progresso local e, quando há sessão, sincronizados no estado da cidade no Supabase. O calendário real exige uma conta autenticada e a migração de relógio descrita em [SUPABASE.md](./SUPABASE.md).

## Desafios de vários assuntos

Os desafios para construir, expandir a cidade e praticar alternam entre **Matemática, Português, Ciências, Geografia, História, Meio Ambiente e Cidadania**. A biblioteca [`study-question-bank.js`](./study-question-bank.js) contém 56 questões revisadas, oito por assunto. Cada bloco de sete desafios apresenta um de cada assunto; as perguntas são embaralhadas por cidade e não se repetem até a biblioteca ser concluída.

O progresso guarda cursores independentes para essa biblioteca variada e para os exercícios de juros. Assim, responder a um desafio de empréstimo não força as próximas atividades a continuarem apenas em matemática financeira. Ao concluir as 56 questões variadas, o jogo avisa que a biblioteca foi concluída em vez de repetir perguntas.

## Exercícios de matemática financeira

[`finance-question-bank.js`](./finance-question-bank.js) gera desafios de juros para a etapa de empréstimo. Ele combina dois regimes de juros, três objetivos de cálculo, 991 capitais, 46 taxas mensais e 10 prazos: **2.735.160 questões possíveis**. Cada cidade guarda a posição nessa sequência. Os exercícios do empréstimo continuam focados em juros porque esse conhecimento é necessário para entender o contrato.

As fórmulas usadas são:

- Juros simples: `M = C × (1 + i × t)`.
- Juros compostos: `M = C × (1 + i)ᵗ`.
- Parcela igual estimada: `M ÷ número de meses`.

Os resultados são arredondados para centavos. A construção antiga usava números inteiros de créditos; o carregamento converte esse saldo legado para centavos de real uma única vez.

> **Uso educativo:** o Banco Central da Cidade, as contas e os créditos são fictícios. Não há transações com dinheiro real nem oferta financeira.
