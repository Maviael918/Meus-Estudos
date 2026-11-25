(function () {
  const subjects = [
    {
      name: "MATEMÁTICA",
      questions: [
        { question: "Uma escola tem 4 turmas com 18 alunos em cada uma. Quantos alunos há ao todo?", options: ["22 alunos", "72 alunos", "64 alunos", "84 alunos"], answer: 1, explanation: "4 × 18 = 72 alunos." },
        { question: "Uma mochila custa R$ 80,00 e está com 25% de desconto. Qual é o preço com desconto?", options: ["R$ 55,00", "R$ 60,00", "R$ 65,00", "R$ 75,00"], answer: 1, explanation: "25% de R$ 80,00 são R$ 20,00. Então, R$ 80,00 − R$ 20,00 = R$ 60,00." },
        { question: "Um terreno retangular mede 9 m de comprimento e 4 m de largura. Qual é o seu perímetro?", options: ["13 m", "26 m", "36 m", "72 m"], answer: 1, explanation: "O perímetro é 2 × (9 + 4) = 26 m." },
        { question: "Uma receita usa 3/4 de xícara de leite. Quanto é isso em mililitros, considerando 1 xícara = 200 ml?", options: ["50 ml", "100 ml", "150 ml", "175 ml"], answer: 2, explanation: "3/4 de 200 ml = 150 ml." },
        { question: "A prefeitura plantou 5 árvores por rua em 12 ruas. Quantas árvores plantou?", options: ["17", "50", "60", "72"], answer: 2, explanation: "5 × 12 = 60 árvores." },
        { question: "Um ônibus percorreu 180 km em 3 horas, mantendo a mesma velocidade. Qual foi a velocidade média?", options: ["50 km/h", "60 km/h", "90 km/h", "540 km/h"], answer: 1, explanation: "Velocidade média = distância ÷ tempo = 180 ÷ 3 = 60 km/h." },
        { question: "A temperatura era de 7 °C e caiu 11 °C durante a noite. Qual foi a temperatura final?", options: ["18 °C", "−4 °C", "4 °C", "−18 °C"], answer: 1, explanation: "7 − 11 = −4 °C." },
        { question: "Uma caixa tem 3 filas com 8 mudas em cada fila. Quantas mudas há na caixa?", options: ["11", "21", "24", "38"], answer: 2, explanation: "3 × 8 = 24 mudas." }
      ]
    },
    {
      name: "PORTUGUÊS",
      questions: [
        { question: "Qual frase apresenta concordância correta?", options: ["Os moradores precisa de uma praça.", "Os moradores precisam de uma praça.", "Os morador precisam de uma praça.", "Os moradores precisas de uma praça."], answer: 1, explanation: "O sujeito plural “os moradores” concorda com o verbo “precisam”." },
        { question: "No aviso “A biblioteca fecha às 18h”, qual informação está explícita?", options: ["A biblioteca abre às 18h.", "A biblioteca fecha às 18h.", "A biblioteca fecha aos domingos.", "A biblioteca fica no centro."], answer: 1, explanation: "O aviso informa diretamente o horário de fechamento." },
        { question: "Qual palavra é sinônimo de “preservar” no contexto de cuidar de um parque?", options: ["Destruir", "Proteger", "Esquecer", "Dividir"], answer: 1, explanation: "Preservar significa proteger e conservar." },
        { question: "Qual frase está pontuada corretamente?", options: ["Vamos construir, uma escola.", "Vamos construir uma escola.", "Vamos, construir uma escola", "Vamos construir uma escola,"], answer: 1, explanation: "A frase está completa e não precisa de vírgula entre o verbo e seu complemento." },
        { question: "Qual é o plural correto de “cidadão”?", options: ["Cidadões", "Cidadãos", "Cidadães", "Cidadãoses"], answer: 1, explanation: "O plural de cidadão é cidadãos." },
        { question: "Leia: “A praça ganhou árvores novas. Elas oferecem sombra aos visitantes.” A que “Elas” se refere?", options: ["À praça", "Às árvores", "À sombra", "Aos visitantes"], answer: 1, explanation: "O pronome “Elas” retoma “árvores”, que está no feminino plural." },
        { question: "Qual palavra está escrita corretamente?", options: ["Excessão", "Exceção", "Esceção", "Eceção"], answer: 1, explanation: "A grafia correta é exceção." },
        { question: "Em “A equipe trabalhou cuidadosamente”, qual palavra indica como a equipe trabalhou?", options: ["A", "Equipe", "Trabalhou", "Cuidadosamente"], answer: 3, explanation: "“Cuidadosamente” modifica o verbo e indica o modo da ação." }
      ]
    },
    {
      name: "CIÊNCIAS",
      questions: [
        { question: "Qual órgão do corpo humano é responsável por bombear o sangue?", options: ["Pulmão", "Coração", "Estômago", "Rim"], answer: 1, explanation: "O coração bombeia o sangue para o corpo." },
        { question: "Qual mudança de estado ocorre quando a água líquida vira vapor?", options: ["Solidificação", "Condensação", "Evaporação", "Fusão"], answer: 2, explanation: "Na evaporação, a água passa do estado líquido para o gasoso." },
        { question: "Qual fonte de energia é renovável?", options: ["Carvão mineral", "Petróleo", "Luz do Sol", "Gás natural"], answer: 2, explanation: "A energia solar vem da luz do Sol e é renovável." },
        { question: "Na cadeia alimentar capim → gafanhoto → sapo, qual organismo é o produtor?", options: ["Capim", "Gafanhoto", "Sapo", "Todos são consumidores"], answer: 0, explanation: "O capim produz seu próprio alimento por meio da fotossíntese." },
        { question: "Qual sistema do corpo humano permite a entrada de oxigênio ao respirar?", options: ["Digestório", "Respiratório", "Esquelético", "Nervoso"], answer: 1, explanation: "O sistema respiratório realiza as trocas gasosas." },
        { question: "O que as plantas absorvem do ar durante a fotossíntese?", options: ["Oxigênio", "Gás carbônico", "Hélio", "Vapor de gasolina"], answer: 1, explanation: "Na fotossíntese, as plantas usam água e gás carbônico, com energia luminosa." },
        { question: "Qual material costuma ser atraído por um ímã?", options: ["Madeira", "Ferro", "Papel", "Vidro"], answer: 1, explanation: "O ferro é um material magnético atraído por ímãs." },
        { question: "Por que a sombra de um objeto muda de tamanho ao longo do dia?", options: ["Porque o objeto encolhe.", "Porque a posição aparente do Sol muda.", "Porque a Terra para de girar.", "Porque o ar empurra a sombra."], answer: 1, explanation: "A posição aparente do Sol muda ao longo do dia devido à rotação da Terra, alterando a sombra." }
      ]
    },
    {
      name: "GEOGRAFIA",
      questions: [
        { question: "Qual é a capital do Brasil?", options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"], answer: 2, explanation: "Brasília é a capital federal do Brasil." },
        { question: "Em um mapa, a legenda serve principalmente para:", options: ["Mostrar o significado dos símbolos.", "Indicar a previsão do tempo.", "Medir a população de uma cidade.", "Substituir o título."], answer: 0, explanation: "A legenda explica o que representam cores e símbolos do mapa." },
        { question: "Qual linha imaginária divide a Terra em hemisférios Norte e Sul?", options: ["Meridiano de Greenwich", "Trópico de Capricórnio", "Linha do Equador", "Círculo Polar Ártico"], answer: 2, explanation: "A Linha do Equador divide a Terra nos hemisférios Norte e Sul." },
        { question: "Qual bioma ocupa grande parte da região Norte do Brasil?", options: ["Pampa", "Amazônia", "Pantanal", "Caatinga"], answer: 1, explanation: "A Amazônia é o bioma predominante em grande parte da região Norte." },
        { question: "Se o Sol nasce aproximadamente no leste, em que direção ele se põe?", options: ["Norte", "Sul", "Oeste", "Nordeste"], answer: 2, explanation: "O Sol se põe aproximadamente no oeste." },
        { question: "O que a escala de um mapa ajuda a descobrir?", options: ["A relação entre a distância no mapa e a distância real.", "A idade das ruas.", "A temperatura do lugar.", "O número de habitantes por casa."], answer: 0, explanation: "A escala representa a proporção entre as distâncias do mapa e as distâncias reais." },
        { question: "Qual destes é um exemplo de paisagem natural?", options: ["Uma avenida movimentada", "Uma floresta sem construções", "Um shopping", "Uma ponte"], answer: 1, explanation: "Uma floresta sem construções é formada predominantemente por elementos naturais." },
        { question: "Por que muitas cidades se desenvolveram perto de rios?", options: ["Pela oferta de água e transporte.", "Porque rios impedem toda atividade humana.", "Para evitar o acesso à água.", "Porque rios produzem ruas."], answer: 0, explanation: "Rios historicamente facilitaram o abastecimento de água, a agricultura e o transporte." }
      ]
    },
    {
      name: "HISTÓRIA",
      questions: [
        { question: "Em que ano foi proclamada a Independência do Brasil?", options: ["1500", "1822", "1888", "1889"], answer: 1, explanation: "A Independência do Brasil foi proclamada em 1822." },
        { question: "Em que ano foi abolida oficialmente a escravidão no Brasil?", options: ["1822", "1850", "1888", "1930"], answer: 2, explanation: "A Lei Áurea, de 1888, aboliu oficialmente a escravidão no Brasil." },
        { question: "Qual documento é uma fonte histórica escrita?", options: ["Uma carta antiga", "Uma montanha", "Uma espécie de árvore", "Uma nuvem"], answer: 0, explanation: "Cartas podem registrar informações e experiências de uma época." },
        { question: "O que os povos indígenas já faziam no território que hoje é o Brasil antes da chegada dos portugueses?", options: ["Viviam em diferentes sociedades e culturas.", "Não conheciam nenhuma forma de agricultura.", "Falavam todos a mesma língua.", "Viviam apenas em cidades de pedra."], answer: 0, explanation: "Os povos indígenas tinham diversas línguas, culturas, formas de organização e conhecimentos." },
        { question: "Qual acontecimento ocorreu primeiro?", options: ["A Proclamação da República, em 1889.", "A Independência do Brasil, em 1822.", "A abolição da escravidão, em 1888.", "A construção de Brasília, em 1960."], answer: 1, explanation: "A Independência, em 1822, ocorreu antes dos outros acontecimentos listados." },
        { question: "O que é um museu histórico?", options: ["Um lugar que preserva e apresenta objetos e registros do passado.", "Uma fábrica de objetos antigos.", "Um espaço onde só se estudam mapas.", "Uma repartição que organiza eleições."], answer: 0, explanation: "Museus preservam coleções e ajudam a conhecer diferentes períodos e culturas." },
        { question: "Qual mudança marcou a Proclamação da República no Brasil, em 1889?", options: ["O início do governo republicano.", "A chegada dos portugueses.", "A Independência do Brasil.", "A abolição da escravidão."], answer: 0, explanation: "Em 1889, o Brasil deixou de ser uma monarquia e tornou-se uma república." },
        { question: "Por que comparar diferentes fontes históricas pode ser útil?", options: ["Para compreender diferentes perspectivas sobre o passado.", "Para garantir que toda fonte diga exatamente o mesmo.", "Para apagar registros antigos.", "Para substituir toda pesquisa por uma opinião."], answer: 0, explanation: "Fontes diferentes podem revelar perspectivas e informações complementares." }
      ]
    },
    {
      name: "MEIO AMBIENTE",
      questions: [
        { question: "Qual atitude ajuda a economizar água em casa?", options: ["Deixar a torneira aberta ao escovar os dentes.", "Consertar vazamentos.", "Lavar a calçada diariamente com mangueira.", "Tomar banhos mais longos."], answer: 1, explanation: "Consertar vazamentos evita desperdício contínuo de água." },
        { question: "Restos de frutas e verduras podem ser aproveitados para produzir:", options: ["Composto orgânico", "Vidro", "Metal", "Combustível nuclear"], answer: 0, explanation: "Resíduos orgânicos podem virar composto por meio da compostagem." },
        { question: "Qual ação reduz a quantidade de lixo enviada a aterros?", options: ["Separar materiais recicláveis.", "Misturar pilhas ao lixo orgânico.", "Queimar plástico no quintal.", "Jogar lixo em rios."], answer: 0, explanation: "A separação permite encaminhar materiais recicláveis para reaproveitamento." },
        { question: "Por que áreas verdes são importantes nas cidades?", options: ["Ajudam no conforto térmico e oferecem espaços de convivência.", "Impedem a existência de animais.", "Aumentam a poluição do ar.", "Substituem todo o sistema de saneamento."], answer: 0, explanation: "Áreas verdes contribuem para o bem-estar, a sombra e a convivência." },
        { question: "Qual resíduo deve ser levado a um ponto de coleta específico?", options: ["Pilhas usadas", "Casca de banana", "Folhas secas", "Pão amanhecido"], answer: 0, explanation: "Pilhas podem conter substâncias que exigem descarte adequado." },
        { question: "O que significa biodiversidade?", options: ["A variedade de seres vivos em uma região.", "A quantidade de prédios de uma cidade.", "A mudança diária do clima.", "O conjunto de ruas de um bairro."], answer: 0, explanation: "Biodiversidade é a variedade de formas de vida e de ecossistemas." },
        { question: "Qual transporte pode ajudar a reduzir a poluição por pessoa em trajetos urbanos?", options: ["Ônibus coletivo", "Um carro para cada passageiro", "Um veículo parado com motor ligado", "Queimar resíduos para se deslocar"], answer: 0, explanation: "O transporte coletivo pode transportar várias pessoas usando menos combustível por passageiro." },
        { question: "Qual é uma consequência possível do descarte de lixo em bueiros?", options: ["Alagamentos durante chuvas.", "Aumento da água potável.", "Formação de energia solar.", "Redução do nível do mar."], answer: 0, explanation: "O lixo pode obstruir a drenagem e contribuir para alagamentos." }
      ]
    },
    {
      name: "CIDADANIA",
      questions: [
        { question: "Qual é uma função da prefeitura municipal?", options: ["Administrar serviços públicos municipais.", "Criar leis para todos os países.", "Emitir a moeda nacional.", "Comandar todos os estados."], answer: 0, explanation: "A prefeitura administra o município e executa políticas e serviços locais." },
        { question: "Qual órgão municipal é responsável por discutir e aprovar leis da cidade?", options: ["Câmara Municipal", "Banco Central", "Biblioteca Nacional", "Corpo de Bombeiros"], answer: 0, explanation: "A Câmara Municipal, formada por vereadores, discute e vota leis municipais." },
        { question: "Qual atitude demonstra cuidado com um espaço público?", options: ["Pichar placas.", "Danificar bancos.", "Usar e preservar o espaço em conjunto.", "Deixar resíduos no chão."], answer: 2, explanation: "Espaços públicos são compartilhados e devem ser cuidados por todos." },
        { question: "Por que é importante ouvir moradores antes de planejar uma praça?", options: ["Para considerar necessidades diferentes da comunidade.", "Para impedir que alguém use a praça.", "Para evitar qualquer planejamento.", "Para substituir regras de segurança."], answer: 0, explanation: "A participação ajuda a identificar prioridades e tornar o espaço mais útil para a comunidade." },
        { question: "Qual comportamento ajuda a manter o trânsito seguro perto de uma escola?", options: ["Respeitar a faixa de pedestres.", "Estacionar sobre a calçada.", "Acelerar ao se aproximar da escola.", "Ignorar o semáforo."], answer: 0, explanation: "Respeitar a faixa protege quem atravessa a rua." },
        { question: "O que é um serviço público?", options: ["Um serviço organizado para atender necessidades da população.", "Um produto vendido apenas em lojas privadas.", "Uma atividade sem usuários.", "Uma tarefa feita somente em casa."], answer: 0, explanation: "Serviços públicos atendem necessidades coletivas, como saúde, educação e limpeza urbana." },
        { question: "Qual é uma forma responsável de participar de decisões da comunidade?", options: ["Compartilhar informações sem verificar.", "Participar de reuniões e apresentar ideias com respeito.", "Impedir outras pessoas de falar.", "Danificar equipamentos públicos."], answer: 1, explanation: "A participação respeitosa permite compartilhar propostas e ouvir outros pontos de vista." },
        { question: "Ao encontrar uma calçada bloqueada por um objeto, qual ação é mais segura?", options: ["Andar pela rua sem olhar.", "Pedir ajuda a um adulto ou comunicar o serviço responsável.", "Empurrar alguém para passar.", "Ignorar o problema para sempre."], answer: 1, explanation: "Comunicar o problema ajuda a desobstruir a passagem sem colocar pedestres em risco." }
      ]
    }
  ];

  const poolSize = subjects.reduce((total, subject) => total + subject.questions.length, 0);

  function hash(seed, dimension) {
    let value = (seed ^ Math.imul(dimension + 1, 0x9e3779b9)) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 0x85ebca6b) >>> 0;
    value ^= value >>> 13;
    return value >>> 0;
  }

  function gcd(a, b) {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
  }

  function permute(length, coordinate, seed, dimension) {
    const dimensionHash = hash(seed, dimension);
    let multiplier = (dimensionHash % length) || 1;
    while (gcd(multiplier, length) !== 1) multiplier = (multiplier + 1) % length || 1;
    const offset = hash(dimensionHash, dimension + 11) % length;
    return (coordinate * multiplier + offset) % length;
  }

  function nextQuestion(cursor, seed) {
    if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor >= poolSize) {
      throw new Error("Todos os desafios variados desta biblioteca já foram utilizados.");
    }
    if (!Number.isInteger(seed) || seed < 0) {
      throw new Error("A biblioteca de estudos precisa de uma semente válida.");
    }

    const subjectOrder = permute(subjects.length, cursor % subjects.length, seed, 0);
    const subject = subjects[subjectOrder];
    const round = Math.floor(cursor / subjects.length);
    const questionIndex = permute(subject.questions.length, round, seed, subjectOrder + 1);
    const question = subject.questions[questionIndex];

    return {
      id: `${subjectOrder}:${questionIndex}`,
      subject: subject.name,
      question: question.question,
      options: question.options,
      correctIndex: question.answer,
      explanation: question.explanation,
      nextCursor: cursor + 1,
      poolSize
    };
  }

  window.studyQuestionBank = { poolSize, nextQuestion };
})();
