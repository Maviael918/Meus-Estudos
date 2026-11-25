# Banco Central da Cidade e matemática financeira

## Regras da simulação

- Todos os valores do jogo são em reais (R$), armazenados como centavos inteiros.
- A conta municipal é gratuita e usa o mesmo saldo do orçamento apresentado no painel da cidade.
- A cidade pode ter apenas um empréstimo ativo por vez, nos valores de R$ 1.000,00, R$ 5.000,00 ou R$ 10.000,00.
- Empréstimos de juros simples cobram 2% ao mês; empréstimos de juros compostos cobram 1,5% ao mês. O jogador escolhe 6 ou 12 parcelas.
- Antes da liberação, o jogador resolve um desafio do mesmo tipo de juros. O valor calculado no desafio é um exemplo de estudo; o contrato mostra separadamente o total e as parcelas do produto selecionado.
- Uma parcela é cobrada ao avançar para o mês seguinte no jogo (a cada 30 dias simulados). Se faltar saldo, ela fica pendente e o jogo tenta novamente no próximo mês, sem multa nesta versão educativa.
- O saldo, a conta, o contrato e o avanço da biblioteca são guardados no progresso local e, quando há sessão, sincronizados no estado da cidade no Supabase.

## Biblioteca de desafios exclusivos

[`finance-question-bank.js`](./finance-question-bank.js) é uma biblioteca independente do código principal. Ela combina dois regimes de juros, três objetivos de cálculo, 991 capitais, 46 taxas mensais e 10 prazos: **2.735.160 questões possíveis**.

Cada progresso guarda uma semente e um cursor. O gerador percorre as combinações por uma permutação determinística completa, sem guardar uma lista crescente de perguntas e sem emitir novamente a mesma questão nessa cidade. Ao chegar ao final do catálogo, ele informa que os desafios exclusivos se esgotaram em vez de repetir questões.

As fórmulas usadas são:

- Juros simples: `M = C × (1 + i × t)`.
- Juros compostos: `M = C × (1 + i)ᵗ`.
- Parcela igual estimada: `M ÷ número de meses`.

Os resultados são arredondados para centavos. A construção antiga usava números inteiros de créditos; o carregamento converte esse saldo legado para centavos de real uma única vez.

> **Uso educativo:** o Banco Central da Cidade, as contas e os créditos são fictícios. Não há transações com dinheiro real nem oferta financeira.
