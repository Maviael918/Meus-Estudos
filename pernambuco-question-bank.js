(function () {
  const references = {
    pombal: {
      board: "CPCON/UEPB",
      city: "Pombal/PB",
      year: "2025",
      exam: "Prefeitura Municipal de Pombal — Agente Administrativo",
      url: "https://cpcon.uepb.edu.br/download/3-agente-administrativo/?wpdmdl=7635"
    },
    camocim: {
      board: "IAUPE-Concursos",
      city: "Camocim de São Félix/PE",
      year: "2024",
      exam: "Caderno 01 — Agente Administrativo (edital 2023)",
      url: "https://www.upenet.com.br/concursos/23_Camocim/DIVULGACAO/PROVAS/MANH%C3%83/CADERNO%2001%20AGENTE%20ADMINISTRATIVO%20.pdf"
    }
  };

  const questions = [
    {
      subject: "PORTUGUÊS",
      difficulty: "Intermediária",
      topic: "Interpretação de texto: inferência",
      question: "Leia: “A secretaria prorrogou o prazo para entrega dos documentos. Ainda assim, muitos requerimentos permaneceram incompletos, pois os interessados não consultaram a lista de exigências.” Qual conclusão é autorizada pelo texto?",
      options: [
        "A prorrogação eliminou a necessidade de apresentar todos os documentos.",
        "O prazo maior, por si só, não resolveu as pendências causadas pela falta de consulta às exigências.",
        "A secretaria recusou todos os requerimentos entregues no prazo original.",
        "A lista de exigências foi publicada depois do encerramento do prazo prorrogado."
      ],
      answer: 1,
      explanation: "O trecho atribui a permanência das pendências à falta de consulta à lista. Não afirma que a prorrogação eliminou documentos ou que houve recusa geral.",
      sourceKey: "pombal"
    },
    {
      subject: "PORTUGUÊS",
      difficulty: "Intermediária",
      topic: "Gêneros textuais e finalidade",
      question: "Um aviso da prefeitura informa o horário de atendimento, os documentos necessários e o canal para tirar dúvidas. Considerando sua finalidade predominante, esse texto é principalmente:",
      options: [
        "Um relato narrativo, porque apresenta acontecimentos em sequência.",
        "Uma peça publicitária, porque busca persuadir o cidadão a contratar um serviço.",
        "Um comunicado informativo, porque orienta o público sobre um serviço.",
        "Um texto científico, porque apresenta resultados de pesquisa."
      ],
      answer: 2,
      explanation: "A finalidade descrita é informar e orientar os usuários sobre o serviço, característica de um comunicado informativo.",
      sourceKey: "pombal"
    },
    {
      subject: "PORTUGUÊS",
      difficulty: "Avançada",
      topic: "Formação de palavras",
      question: "Na palavra “reaproveitamento”, a presença de “re-” e “-mento” indica, no processo de formação da palavra, ocorrência de:",
      options: [
        "Composição por justaposição.",
        "Derivação prefixal e sufixal.",
        "Derivação parassintética, pois a retirada de qualquer afixo impede a existência da base.",
        "Derivação regressiva."
      ],
      answer: 1,
      explanation: "A palavra apresenta o prefixo re- e o sufixo -mento; formas como “aproveitamento” e “reaproveitar” existem, então não é parassíntese.",
      sourceKey: "pombal"
    },
    {
      subject: "PORTUGUÊS",
      difficulty: "Intermediária",
      topic: "Conectivos e relações de sentido",
      question: "Em “Embora o sistema tenha sido atualizado, a equipe manteve a conferência manual dos registros”, o conectivo “embora” introduz uma ideia de:",
      options: [
        "Concessão: apresenta um fato que não impede o que é afirmado depois.",
        "Causa: explica por que o sistema foi atualizado.",
        "Conclusão: resume os resultados da atualização.",
        "Condição: estabelece um requisito para a conferência."
      ],
      answer: 0,
      explanation: "“Embora” é concessivo: a atualização poderia sugerir que a conferência seria dispensada, mas ela foi mantida.",
      sourceKey: "pombal"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Atualizações e segurança",
      question: "Uma estação de trabalho está com atualizações de segurança pendentes. Qual conduta é tecnicamente mais adequada?",
      options: [
        "Adiar todas as atualizações indefinidamente para evitar alterações no sistema.",
        "Instalar atualizações obtidas de qualquer site que ofereça uma versão mais recente.",
        "Aplicar as atualizações por um canal confiável, observando as orientações e a janela de manutenção do órgão.",
        "Desativar o serviço de atualização depois de instalar apenas as atualizações opcionais."
      ],
      answer: 2,
      explanation: "Atualizações corrigem vulnerabilidades e devem vir de fontes confiáveis; em ambiente institucional, também se observam procedimentos de implantação e continuidade.",
      sourceKey: "pombal"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Firewall e segurança de redes",
      question: "Um órgão precisa controlar conexões de rede permitidas conforme regras de segurança. Qual solução desempenha principalmente essa função?",
      options: [
        "Um firewall, que filtra o tráfego de rede de acordo com regras definidas.",
        "Um navegador, que organiza o acesso a páginas web.",
        "Uma ferramenta de backup, que recupera arquivos excluídos.",
        "Uma planilha eletrônica, que registra os endereços acessados."
      ],
      answer: 0,
      explanation: "Um firewall monitora e controla o tráfego de entrada e saída conforme regras de segurança; não substitui backup, navegador ou planilha.",
      sourceKey: "camocim"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Avançada",
      topic: "Excel: busca vertical com correspondência exata",
      question: "Uma tabela de servidores tem matrículas na primeira coluna e nomes na segunda, mas as linhas não estão ordenadas. Para retornar o nome associado a uma matrícula exata usando PROCV, qual configuração é adequada?",
      options: [
        "Usar a segunda coluna como coluna de retorno e FALSO (ou 0) para exigir correspondência exata.",
        "Usar a primeira coluna como coluna de retorno e VERDADEIRO para ignorar a ordem.",
        "Usar SOMA na coluna de matrículas e FALSO como intervalo.",
        "Ordenar a coluna de nomes e usar CONT.VALORES como busca."
      ],
      answer: 0,
      explanation: "PROCV procura o valor na primeira coluna do intervalo. O índice 2 retorna o nome e FALSO/0 solicita correspondência exata, sem depender de ordenação aproximada.",
      sourceKey: "camocim"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Internet e intranet",
      question: "Um sistema de consulta foi disponibilizado somente na rede interna do órgão para uso dos servidores, sem acesso público pela internet. Essa rede privada é uma:",
      options: [
        "Intranet.",
        "Rede mundial pública.",
        "Extranet aberta a qualquer usuário.",
        "Página web pública."
      ],
      answer: 0,
      explanation: "Intranet é uma rede privada de uma organização. A internet é uma rede pública global; a disponibilidade de um serviço interno não o torna público.",
      sourceKey: "camocim"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Protocolos de correio eletrônico",
      question: "Uma servidora precisa enviar uma mensagem e manter a caixa de entrada sincronizada entre o computador e o celular. Qual combinação descreve corretamente os protocolos envolvidos?",
      options: [
        "SMTP para envio e IMAP para sincronizar mensagens recebidas.",
        "IMAP para envio e SMTP para sincronizar mensagens recebidas.",
        "FTP para envio e POP3 para sincronizar pastas remotas.",
        "HTTP para envio e DNS para armazenar as mensagens."
      ],
      answer: 0,
      explanation: "SMTP é usado para envio de e-mail. IMAP mantém as mensagens e pastas sincronizadas com o servidor entre dispositivos.",
      sourceKey: "pombal"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Avançada",
      topic: "Navegadores e privacidade",
      question: "Um navegador mantém um cookie de sessão para que o usuário continue autenticado enquanto navega no sistema. Qual afirmação é correta?",
      options: [
        "O cookie é necessariamente um programa executável instalado no computador.",
        "Cookies podem armazenar identificadores e preferências; seu uso deve ser avaliado conforme finalidade e privacidade.",
        "Apagar cookies remove automaticamente todos os arquivos pessoais do dispositivo.",
        "Cookies substituem a necessidade de autenticação no servidor."
      ],
      answer: 1,
      explanation: "Cookies são pequenos dados associados ao navegador e podem apoiar sessões e preferências. Eles não são, por definição, programas executáveis nem substituem a validação do servidor.",
      sourceKey: "camocim"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Armazenamento em nuvem e compartilhamento",
      question: "Para que uma colega revise um documento na nuvem sem torná-lo público, a configuração mais apropriada é:",
      options: [
        "Publicar o documento na web e enviar o endereço a qualquer pessoa.",
        "Enviar a senha pessoal da conta junto com o arquivo.",
        "Compartilhar com a conta específica da colega e conceder apenas a permissão necessária.",
        "Desativar o controle de acesso para permitir a edição simultânea."
      ],
      answer: 2,
      explanation: "O compartilhamento direcionado com privilégio mínimo permite colaboração sem exposição pública ou compartilhamento de credenciais.",
      sourceKey: "pombal"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Intermediária",
      topic: "Hardware: dispositivos de entrada",
      question: "Em um posto de protocolo, qual dispositivo é classificado como de entrada por permitir a captura de dados para o computador?",
      options: [
        "Impressora a laser.",
        "Leitor de código de barras.",
        "Projetor multimídia.",
        "Caixa de som."
      ],
      answer: 1,
      explanation: "O leitor captura o código e envia os dados ao computador. Os demais itens listados são dispositivos de saída.",
      sourceKey: "pombal"
    },
    {
      subject: "INFORMÁTICA",
      difficulty: "Avançada",
      topic: "Compartilhamento de arquivos e controle de acesso",
      question: "Um usuário precisa compartilhar uma pasta em uma rede local do Windows. Qual caminho corresponde às propriedades de compartilhamento da pasta, sem confundir compartilhamento com permissões locais de segurança?",
      options: [
        "Propriedades da pasta → Compartilhamento.",
        "Gerenciador de Tarefas → Inicializar.",
        "Configurações de tela → Projetar.",
        "Lixeira → Restaurar configurações."
      ],
      answer: 0,
      explanation: "As opções de compartilhamento de rede ficam nas propriedades da pasta, na guia Compartilhamento. Permissões da guia Segurança são relacionadas ao controle de acesso local/NTFS.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Avançada",
      topic: "Eficiência, eficácia e efetividade",
      question: "Um setor cumpriu a meta de analisar 500 processos no mês, mas empregou o dobro das horas previstas e não reduziu o tempo de espera dos cidadãos. Qual avaliação é mais precisa?",
      options: [
        "A meta foi eficazmente cumprida; houve baixa eficiência no uso de recursos, e o impacto pretendido não foi demonstrado.",
        "Houve eficiência elevada porque a meta numérica foi cumprida.",
        "A efetividade está comprovada, ainda que o serviço não tenha melhorado para os cidadãos.",
        "Não houve eficácia, pois o setor utilizou mais horas do que o previsto."
      ],
      answer: 0,
      explanation: "A eficácia se refere ao alcance da meta; eficiência considera a relação entre recursos e resultados; efetividade observa os efeitos concretos para a sociedade.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Avançada",
      topic: "Princípios da Administração Pública",
      question: "Um gestor determina que pedidos de pessoas conhecidas sejam analisados antes dos demais, sem critério público ou justificativa legal. Qual princípio é diretamente afrontado?",
      options: [
        "Impessoalidade, pois a atuação não deve privilegiar pessoas por relações pessoais.",
        "Publicidade, porque todo atendimento deve ocorrer em sessão pública.",
        "Eficiência, pois a ordem de análise não pode ser alterada em nenhuma circunstância.",
        "Continuidade, pois o serviço público não pode estabelecer prioridades."
      ],
      answer: 0,
      explanation: "Favorecer conhecidos por motivo pessoal viola a impessoalidade. Prioridades podem existir quando previstas em lei e aplicadas por critérios objetivos.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Intermediária",
      topic: "Planejamento: políticas e diretrizes",
      question: "A direção de um órgão define orientações gerais para que diferentes setores decidam como priorizar solicitações, respeitando a legislação e os objetivos institucionais. Essas orientações gerais são mais bem caracterizadas como:",
      options: [
        "Políticas, que funcionam como guias para decisões e ações.",
        "Metas, que expressam exclusivamente resultados numéricos e prazos.",
        "Procedimentos, que descrevem cada passo operacional de uma tarefa.",
        "Organogramas, que representam a estrutura hierárquica."
      ],
      answer: 0,
      explanation: "Políticas orientam decisões em determinada área. Metas são resultados pretendidos; procedimentos detalham etapas; organogramas mostram relações estruturais.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Intermediária",
      topic: "Função de controle",
      question: "O relatório mensal mostra que o tempo médio de resposta superou o limite estabelecido. Qual providência corresponde à função administrativa de controle?",
      options: [
        "Redefinir a missão do órgão sem analisar os dados.",
        "Comparar o resultado com o padrão, investigar causas e adotar correção acompanhável.",
        "Distribuir as tarefas entre os setores sem registrar responsabilidades.",
        "Aguardar o próximo exercício para verificar se o desvio desaparece."
      ],
      answer: 1,
      explanation: "Controle envolve medir e comparar o desempenho com padrões, identificar desvios e implementar ações corretivas para apoiar os objetivos.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Intermediária",
      topic: "Organização: descrição de cargo",
      question: "Ao documentar as principais tarefas, responsabilidades e relações de um posto de trabalho, a unidade está elaborando:",
      options: [
        "A descrição do cargo.",
        "A avaliação de desempenho individual.",
        "O organograma institucional.",
        "O plano de capacitação anual."
      ],
      answer: 0,
      explanation: "A descrição de cargo registra tarefas e responsabilidades. Requisitos de formação e competências costumam integrar a especificação do cargo.",
      sourceKey: "pombal"
    },
    {
      subject: "GESTÃO DE PESSOAS",
      difficulty: "Avançada",
      topic: "Comportamento organizacional: lócus de controle",
      question: "Após um resultado desfavorável, uma servidora avalia quais decisões e ações sob seu controle contribuíram para o resultado e planeja ajustes, sem negar fatores externos. Essa análise se relaciona mais diretamente a:",
      options: [
        "Lócus de controle, isto é, como a pessoa percebe as causas e o controle dos acontecimentos.",
        "Estereótipo, isto é, a generalização de características atribuídas a um grupo.",
        "Comunicação institucional, isto é, a divulgação externa da missão do órgão.",
        "Descrição de cargo, isto é, o registro das tarefas de uma função."
      ],
      answer: 0,
      explanation: "Lócus de controle se refere às percepções sobre as causas dos acontecimentos e sobre a influência das próprias ações.",
      sourceKey: "pombal"
    },
    {
      subject: "GESTÃO DE PESSOAS",
      difficulty: "Intermediária",
      topic: "Diversidade: estereótipos",
      question: "Um processo seletivo é orientado pela crença generalizada de que pessoas de determinado grupo não dominam ferramentas digitais, sem avaliação individual. Essa crença é um exemplo de:",
      options: [
        "Estereótipo, uma generalização sobre características atribuídas a um grupo.",
        "Feedback, uma informação específica sobre desempenho observado.",
        "Socialização, a conversão de conhecimento individual em coletivo.",
        "Impessoalidade, a aplicação de critérios objetivos."
      ],
      answer: 0,
      explanation: "Atribuir uma característica geral a todas as pessoas de um grupo é estereotipar; usar essa crença na seleção também pode produzir discriminação.",
      sourceKey: "pombal"
    },
    {
      subject: "GESTÃO DE PESSOAS",
      difficulty: "Intermediária",
      topic: "Comunicação organizacional",
      question: "Uma campanha externa apresenta a missão, os valores e os serviços de um órgão para fortalecer a compreensão pública sobre sua atuação. Trata-se principalmente de comunicação:",
      options: [
        "Institucional.",
        "Informal.",
        "Ascendente.",
        "Operacional restrita à equipe."
      ],
      answer: 0,
      explanation: "A comunicação institucional apresenta identidade, missão, valores e atuação da organização perante seus públicos.",
      sourceKey: "pombal"
    },
    {
      subject: "ARQUIVOLOGIA",
      difficulty: "Avançada",
      topic: "Princípios arquivísticos: proveniência",
      question: "Ao reorganizar o arquivo, uma equipe identifica documentos produzidos por duas secretarias diferentes e decide reuni-los em uma única série apenas porque tratam do mesmo assunto. Qual princípio arquivístico recomenda preservar a separação por produtor?",
      options: [
        "Princípio da proveniência.",
        "Princípio da publicidade.",
        "Princípio da territorialidade aplicada aos municípios.",
        "Princípio da ordem cronológica universal."
      ],
      answer: 0,
      explanation: "O princípio da proveniência determina que documentos de produtores distintos não sejam misturados, preservando sua relação com a origem.",
      sourceKey: "pombal"
    },
    {
      subject: "GESTÃO DE MATERIAIS",
      difficulty: "Intermediária",
      topic: "Recursos materiais e patrimoniais",
      question: "Na classificação dos recursos organizacionais, mesas, computadores e veículos de uso duradouro do órgão são considerados:",
      options: [
        "Recursos patrimoniais.",
        "Materiais de consumo, por serem usados durante o expediente.",
        "Recursos financeiros, por terem valor de aquisição.",
        "Capital intelectual, por apoiarem as atividades dos servidores."
      ],
      answer: 0,
      explanation: "Bens tangíveis de caráter permanente, como móveis e veículos, integram os recursos patrimoniais; materiais de consumo são utilizados ou se desgastam no uso.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Avançada",
      topic: "Gestão pública empreendedora",
      question: "Qual conjunto de práticas se aproxima de uma gestão pública empreendedora e orientada a resultados?",
      options: [
        "Planejar preventivamente, acompanhar indicadores e ampliar a participação e o controle social.",
        "Concentrar decisões, evitar a divulgação de resultados e afastar os usuários do acompanhamento.",
        "Substituir metas por ações improvisadas e avaliar apenas o volume de recursos gastos.",
        "Priorizar a estrutura interna e dispensar a avaliação da qualidade dos serviços."
      ],
      answer: 0,
      explanation: "Gestão orientada a resultados combina planejamento, avaliação por indicadores, qualidade do serviço e participação cidadã.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Avançada",
      topic: "Gestão da qualidade",
      question: "Um programa de qualidade em um órgão público pretende reduzir retrabalho e melhorar o atendimento. Qual premissa deve orientar sua implantação?",
      options: [
        "A liderança deve se comprometer, os usuários devem ser considerados e os processos precisam ser avaliados para reduzir desperdícios.",
        "A qualidade depende apenas de uma inspeção final, sem participação das equipes.",
        "A satisfação do usuário é incompatível com o uso eficiente dos recursos.",
        "O programa deve aceitar erros recorrentes como parte inevitável do processo."
      ],
      answer: 0,
      explanation: "Programas de qualidade exigem apoio da liderança, foco nos usuários, análise dos processos e busca de eficiência e melhoria contínua.",
      sourceKey: "pombal"
    },
    {
      subject: "ADMINISTRAÇÃO PÚBLICA",
      difficulty: "Avançada",
      topic: "Gestão do conhecimento: externalização",
      question: "Uma servidora experiente transforma procedimentos que executava de forma intuitiva em um manual com exemplos e critérios, permitindo que a equipe consulte e reaplique esse conhecimento. Na conversão do conhecimento, essa passagem é denominada:",
      options: [
        "Externalização: de conhecimento tácito para explícito.",
        "Socialização: de conhecimento explícito para tácito.",
        "Combinação: de conhecimento tácito para tácito.",
        "Internalização: de conhecimento explícito para explícito."
      ],
      answer: 0,
      explanation: "Externalização converte conhecimento tácito em explícito, por exemplo, ao registrar experiência e procedimentos em documentos.",
      sourceKey: "pombal"
    }
  ];

  const generatedCount = 3000;
  const shuffleOptions = (answer, seed) => {
    const offsets = [0, -2, 2, 5];
    const shift = seed % offsets.length;
    const options = offsets.map((_, index) => String(answer + offsets[(index + shift) % offsets.length]));
    return { options, answer: (offsets.length - shift) % offsets.length };
  };
  for (let i = 0; i < generatedCount; i++) {
    const variant = Math.floor(i / 10) + 1;
    const kind = i % 10;
    const a = 35 + (variant * 17) % 465;
    const b = 12 + (variant * 13) % 88;
    let subject, question, explanation, correct;
    if (kind === 0) {
      subject = "Raciocínio Lógico"; correct = Math.round(a * b / 100);
      question = `Um setor concluiu ${b}% de ${a} solicitações. Quantas foram concluídas?`;
      explanation = `${b}% de ${a} = ${correct}.`;
    } else if (kind === 1) {
      subject = "Gestão de Materiais"; const daily = 3 + variant % 18; const days = 2 + variant % 25; correct = daily * days;
      question = `O almoxarifado consome ${daily} unidades por dia. Qual quantidade atende ${days} dias, sem considerar estoque de segurança?`;
      explanation = `${daily} × ${days} = ${correct} unidades.`;
    } else if (kind === 2) {
      subject = "Matemática"; const people = 2 + variant % 15; const files = 20 + (variant * 7) % 180; const groups = 2 + variant % 6; correct = Math.round(files * groups / people);
      question = `${people} servidores organizam ${files} processos em certo período. Mantido o ritmo, quantos processos ${groups} servidores organizariam?`;
      explanation = `Regra de três direta: ${files} × ${groups} ÷ ${people} = ${correct}.`;
    } else if (kind === 3) {
      subject = "Raciocínio Lógico"; const initial = 100 + (variant * 19) % 900; const reduction = 5 + variant % 45; correct = initial - Math.round(initial * reduction / 100);
      question = `A fila de atendimento tinha ${initial} solicitações e diminuiu ${reduction}%. Quantas restaram?`;
      explanation = `${reduction}% de ${initial} são ${Math.round(initial * reduction / 100)}; restam ${correct}.`;
    } else if (kind === 4) {
      subject = "Gestão de Materiais"; const pack = 5 + variant % 20; const boxes = 3 + variant % 30; correct = pack * boxes;
      question = `${boxes} caixas de material contêm ${pack} unidades cada. Qual é o total recebido?`;
      explanation = `${boxes} × ${pack} = ${correct} unidades.`;
    } else if (kind === 5) {
      subject = "Administração Geral"; const completed = 10 + (variant * 11) % 190; const total = completed + 10 + (variant * 3) % 100; correct = Math.round(completed / total * 100);
      question = `De ${total} tarefas planejadas, ${completed} foram concluídas. Aproximadamente qual percentual foi realizado?`;
      explanation = `${completed} ÷ ${total} × 100 ≈ ${correct}%.`;
    } else if (kind === 6) {
      subject = "Raciocínio Lógico"; const start = 2 + variant % 12; const step = 2 + variant % 9; correct = start + step * 4;
      question = `Identifique o próximo termo: ${start}, ${start + step}, ${start + 2 * step}, ${start + 3 * step}, ...`;
      explanation = `A sequência soma ${step} a cada termo; o próximo é ${correct}.`;
    } else if (kind === 7) {
      subject = "Matemática"; const price = 80 + (variant * 23) % 920; const discount = 5 + variant % 35; correct = Math.round(price * (100 - discount) / 100);
      question = `Um lote de materiais custa R$ ${price},00 e recebe desconto de ${discount}%. Qual o preço final aproximado em reais?`;
      explanation = `R$ ${price} × ${100 - discount}% = aproximadamente R$ ${correct},00.`;
    } else if (kind === 8) {
      subject = "Arquivologia"; const folders = 2 + variant % 12; const docs = 8 + (variant * 5) % 50; correct = folders * docs;
      question = `${folders} caixas de arquivo têm ${docs} pastas cada. Quantas pastas devem constar no inventário?`;
      explanation = `${folders} × ${docs} = ${correct} pastas.`;
    } else {
      subject = "Gestão de Pessoas"; const staff = 4 + variant % 16; const hours = 2 + variant % 7; const workload = staff * hours; correct = workload;
      question = `${staff} servidores dedicam ${hours} horas a uma força-tarefa. Quantas horas-servidor foram empregadas?`;
      explanation = `${staff} × ${hours} = ${workload} horas-servidor.`;
    }
    const choices = shuffleOptions(correct, variant + kind);
    const contexts = ["no protocolo", "no almoxarifado", "na unidade de atendimento", "na equipe administrativa", "no arquivo setorial", "na rotina do órgão"];
    const context = contexts[Math.floor(i / 10) % contexts.length];
    questions.push({
      subject,
      question: `${question} (situação ${variant}, ${context})`,
      options: choices.options,
      answer: choices.answer,
      explanation,
      difficulty: "Básica",
      topic: subject,
      sourceKey: "practice"
    });
  }

  function nextQuestion(cursor, subjectFilter = "") {
    const normalizedSubject = typeof subjectFilter === "string"
      ? subjectFilter.trim().toLocaleUpperCase("pt-BR")
      : "";
    const pool = normalizedSubject
      ? questions.filter((item) => item.subject.toLocaleUpperCase("pt-BR") === normalizedSubject)
      : questions;
    if (pool.length === 0) throw new Error("Não há questões disponíveis para essa matéria.");

    const safeCursor = Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
    const index = (safeCursor * 7919 + 104729) % pool.length;
    const item = pool[index];
    return {
      ...item,
      id: `admin:${questions.indexOf(item)}`,
      correctIndex: item.answer,
      reference: references[item.sourceKey],
      nextCursor: safeCursor + 1,
      poolSize: pool.length
    };
  }

  window.pernambucoQuestionBank = { questions, nextQuestion, poolSize: questions.length };
})();
