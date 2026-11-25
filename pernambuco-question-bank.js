(function () {
  // Questões autorais para revisão do conteúdo previsto no edital CPU/PE.
  // Não são transcrições de questões oficiais da FCC.
  const source = {
    label: "Conteúdo programático do edital CPU/PE 2025 · FCC",
    url: "https://www.diariomunicipal.com.br/amupe/download/AC4A8AB6"
  };
  const questions = [
    { subject: "PORTUGUÊS", question: "Em um comunicado interno, a frase “Solicitamos que os setores enviem os relatórios até sexta-feira” expressa principalmente:", options: ["Uma solicitação formal e objetiva.", "Uma hipótese sem prazo definido.", "Uma ordem informal entre amigos.", "Uma opinião pessoal do remetente."], answer: 0, explanation: "A redação comunica uma solicitação de forma direta e registra um prazo." },
    { subject: "RACIOCÍNIO LÓGICO", question: "Um setor recebeu 240 processos e concluiu 35% deles. Quantos processos foram concluídos?", options: ["72", "84", "96", "105"], answer: 1, explanation: "35% de 240 = 0,35 × 240 = 84." },
    { subject: "INFORMÁTICA", question: "Ao receber um e-mail inesperado pedindo senha por meio de um link, qual é a conduta mais segura?", options: ["Abrir o link e testar a senha.", "Responder com os dados solicitados.", "Não clicar e confirmar o pedido por canal oficial.", "Encaminhar a mensagem a todos os colegas."], answer: 2, explanation: "Pedidos inesperados de credenciais podem ser phishing. Confirme pelo canal oficial e nunca compartilhe a senha." },
    { subject: "ADMINISTRAÇÃO PÚBLICA", question: "Na administração pública, o princípio da publicidade exige, como regra:", options: ["Divulgar atos públicos, respeitadas as hipóteses legais de sigilo.", "Manter todos os processos em segredo.", "Publicar apenas decisões favoráveis ao órgão.", "Substituir a legalidade pela divulgação."], answer: 0, explanation: "A publicidade dá transparência aos atos, com exceções de sigilo previstas em lei." },
    { subject: "GESTÃO DE PESSOAS", question: "Uma equipe recebe metas claras, retorno periódico e oportunidade de desenvolver competências. Essas práticas favorecem:", options: ["A gestão do desempenho e o desenvolvimento profissional.", "A eliminação da comunicação entre liderança e equipe.", "A substituição do planejamento por improviso.", "A avaliação baseada apenas em tempo de serviço."], answer: 0, explanation: "Metas, feedback e desenvolvimento são práticas centrais de gestão do desempenho." },
    { subject: "GESTÃO DE MATERIAIS", question: "Para evitar compras emergenciais e falta de materiais de expediente, o setor deve principalmente:", options: ["Acompanhar consumo, estoque mínimo e prazo de reposição.", "Comprar sempre o maior volume possível.", "Dispensar registros de entrada e saída.", "Solicitar reposição somente depois que o estoque zerar."], answer: 0, explanation: "Controle de consumo, estoque de segurança e tempo de reposição apoiam o planejamento de compras." },
    { subject: "ARQUIVOLOGIA", question: "Documentos consultados com frequência pelo setor que os produziu normalmente permanecem no arquivo:", options: ["Corrente.", "Intermediário.", "Permanente.", "Eliminado."], answer: 0, explanation: "O arquivo corrente reúne documentos em uso frequente pela unidade produtora." },
    { subject: "ÉTICA NO SERVIÇO PÚBLICO", question: "Ao perceber possível favorecimento em uma fila de atendimento, o agente deve:", options: ["Aplicar critérios impessoais e comunicar a situação pelos canais adequados.", "Atender primeiro conhecidos para agilizar o serviço.", "Ignorar os critérios publicados.", "Divulgar dados pessoais dos envolvidos."], answer: 0, explanation: "Impessoalidade, integridade e respeito aos procedimentos protegem a igualdade no atendimento." },
    { subject: "REDAÇÃO OFICIAL", question: "Em uma comunicação oficial, recomenda-se priorizar linguagem:", options: ["Clara, concisa, impessoal e conforme a norma-padrão.", "Cheia de expressões coloquiais e opiniões pessoais.", "Ambígua, para permitir várias interpretações.", "Excessivamente rebuscada, mesmo quando prejudica a compreensão."], answer: 0, explanation: "A comunicação oficial deve facilitar compreensão e padronizar a relação institucional." },
    { subject: "DIREITO ADMINISTRATIVO", question: "A finalidade do poder hierárquico na Administração é, entre outras, permitir:", options: ["A organização, coordenação e revisão de atividades dentro da estrutura administrativa.", "A criação de crimes por ordem interna.", "A dispensa geral de cumprimento da lei.", "A atuação de qualquer agente sem competência."], answer: 0, explanation: "A hierarquia organiza relações internas, distribuição de funções e controle administrativo." }
  ];
  questions.push(
    { subject: "Português", question: "Na redação oficial, clareza significa:", options: ["Facilitar a compreensão da mensagem.", "Usar termos vagos.", "Omitir o assunto.", "Empregar frases ambíguas."], answer: 0, explanation: "A comunicação oficial deve permitir entendimento rápido e correto." },
    { subject: "Português", question: "Assinale a frase com concordância correta:", options: ["Houveram atrasos.", "Houve atrasos.", "Houveram atraso.", "Haviam ocorrido um atraso."], answer: 1, explanation: "Haver com sentido de existir é impessoal e fica no singular." },
    { subject: "Português", question: "O conectivo “entretanto” expressa ideia de:", options: ["Oposição.", "Conclusão.", "Explicação.", "Adição."], answer: 0, explanation: "Entretanto é uma conjunção adversativa." },
    { subject: "Raciocínio Lógico", question: "Um setor reduz 300 processos pendentes em 20%. Quantos ainda ficam pendentes?", options: ["60", "220", "240", "280"], answer: 2, explanation: "20% de 300 são 60; restam 240." },
    { subject: "Raciocínio Lógico", question: "Se todo protocolo recebe número e o documento X é um protocolo, então:", options: ["X recebe número.", "X não pode ser localizado.", "Todo número é protocolo.", "Nenhum protocolo recebe número."], answer: 0, explanation: "A conclusão decorre diretamente das duas premissas." },
    { subject: "Informática", question: "Em uma planilha, a fórmula que soma células de A1 até A5 é:", options: ["=SOMA(A1:A5)", "=JUNTAR(A1-A5)", "=CONTAR(A1:A5)", "=MEDIA(A1;A5)"], answer: 0, explanation: "A função SOMA totaliza os valores do intervalo indicado." },
    { subject: "Informática", question: "A autenticação em dois fatores acrescenta:", options: ["Uma segunda verificação de identidade.", "Uma cópia pública da senha.", "A desativação do bloqueio de tela.", "A remoção de criptografia."], answer: 0, explanation: "Ela exige outro fator além da senha, aumentando a proteção da conta." },
    { subject: "Administração Pública", question: "O princípio da legalidade determina que o agente público deve:", options: ["Atuar conforme autorização e limites legais.", "Fazer tudo que não esteja expressamente proibido a particulares.", "Substituir a lei por preferência pessoal.", "Ignorar normas internas válidas."], answer: 0, explanation: "A atuação administrativa está vinculada à lei e às competências previstas." },
    { subject: "Administração Pública", question: "Transparência pública favorece:", options: ["Controle social e prestação de contas.", "Sigilo irrestrito de todo ato.", "Eliminação de registros.", "Atendimento discriminatório."], answer: 0, explanation: "Acesso à informação permite acompanhar a atuação estatal, ressalvados sigilos legais." },
    { subject: "Direito Administrativo", question: "A presunção de legitimidade dos atos administrativos é:", options: ["Relativa e admite prova em contrário.", "Absoluta em qualquer caso.", "Igual à impossibilidade de recurso.", "Uma autorização para descumprir a lei."], answer: 0, explanation: "A presunção é relativa; o interessado pode demonstrar eventual ilegalidade." },
    { subject: "Direito Administrativo", question: "A responsabilidade civil objetiva do Estado, em regra, exige dano e nexo causal, sem exigir:", options: ["Prova de culpa do agente perante a vítima.", "Dano.", "Conduta estatal.", "Nexo causal."], answer: 0, explanation: "O art. 37, §6º, da Constituição prevê responsabilidade objetiva, com direito de regresso em caso de dolo ou culpa." },
    { subject: "Gestão de Pessoas", question: "Uma comunicação assertiva é aquela que:", options: ["Expõe ideias com clareza e respeito.", "Impõe opiniões por intimidação.", "Evita qualquer informação objetiva.", "Usa ironia para resolver conflitos."], answer: 0, explanation: "Assertividade combina clareza, respeito e defesa adequada de posições." },
    { subject: "Gestão de Pessoas", question: "O trabalho em equipe é favorecido por:", options: ["Objetivos compartilhados e comunicação coordenada.", "Competição por informações essenciais.", "Papéis deliberadamente confusos.", "Ausência de confiança."], answer: 0, explanation: "Metas comuns e comunicação sustentam cooperação e coordenação." },
    { subject: "Gestão de Materiais", question: "O ponto de pedido considera principalmente:", options: ["Consumo durante o prazo de reposição e estoque de segurança.", "Somente a cor do material.", "Apenas o espaço livre no almoxarifado.", "O preço histórico sem consumo."], answer: 0, explanation: "O ressuprimento deve ocorrer antes que a demanda durante o prazo de entrega esgote o estoque." },
    { subject: "Gestão de Materiais", question: "Acuracidade de estoque compara:", options: ["Quantidade física com quantidade registrada.", "Preço de compra com salário.", "Consumo com férias.", "Fornecedor com usuário."], answer: 0, explanation: "A acuracidade mede a correspondência entre estoque físico e sistema." },
    { subject: "Arquivologia", question: "Documento de valor histórico, probatório ou informativo que deve ser preservado pode ter destinação:", options: ["Permanente.", "Descarte automático.", "Arquivo corrente apenas.", "Eliminação sem avaliação."], answer: 0, explanation: "Documentos de guarda permanente são preservados por seu valor secundário." },
    { subject: "Arquivologia", question: "A tramitação de um documento corresponde:", options: ["Ao curso do documento entre setores para providências.", "À destruição do documento.", "À digitalização obrigatória de todo acervo.", "À mudança de suporte sem registro."], answer: 0, explanation: "Tramitação é o percurso do documento dentro do órgão para cumprir sua finalidade." },
    { subject: "Ética", question: "Usar informação interna privilegiada para benefício próprio é:", options: ["Conduta incompatível com a ética pública.", "Prática recomendada de eficiência.", "Permitido se não houver testemunhas.", "Dever funcional."], answer: 0, explanation: "O agente deve proteger informações e não obter vantagem privada do cargo." },
    { subject: "Redação Oficial", question: "Um despacho administrativo deve ser preferencialmente:", options: ["Objetivo, claro e relacionado à providência solicitada.", "Pessoal e sem fundamentação.", "Ambíguo para evitar responsabilização.", "Repleto de abreviações informais."], answer: 0, explanation: "O despacho registra encaminhamento ou decisão de modo compreensível e pertinente." },
    { subject: "Atendimento", question: "A acessibilidade no atendimento busca:", options: ["Permitir que pessoas com diferentes necessidades usem o serviço com autonomia e segurança.", "Criar barreiras adicionais.", "Restringir informação a um único formato.", "Atender somente por canal digital."], answer: 0, explanation: "Acessibilidade remove barreiras e amplia o acesso equitativo aos serviços." },
    { subject: "Administração Geral", question: "A etapa de planejamento define:", options: ["Objetivos, prioridades e meios para alcançá-los.", "Somente resultados já obtidos.", "Apenas punições.", "A execução sem metas."], answer: 0, explanation: "Planejar antecipa objetivos, ações e recursos necessários." },
    { subject: "Administração Geral", question: "No ciclo PDCA, a etapa Act consiste em:", options: ["Agir para corrigir desvios e padronizar melhorias.", "Somente executar tarefas.", "Ignorar os resultados medidos.", "Definir o problema sem intervenção."], answer: 0, explanation: "Act consolida melhorias ou corrige o processo a partir da avaliação." },
    { subject: "Matemática", question: "Um orçamento de R$ 8.000 foi dividido igualmente entre 5 setores. Quanto cabe a cada um?", options: ["R$ 1.200", "R$ 1.500", "R$ 1.600", "R$ 2.000"], answer: 2, explanation: "8.000 dividido por 5 é 1.600." },
    { subject: "Matemática", question: "Uma equipe de 12 pessoas corresponde a 30% do quadro. Quantas pessoas há no quadro total?", options: ["36", "40", "42", "48"], answer: 1, explanation: "12 ÷ 0,30 = 40 pessoas." },
    { subject: "Atendimento", question: "Ao encaminhar uma demanda a outro setor, é importante:", options: ["Informar o motivo e orientar o usuário sobre o acompanhamento.", "Encerrar o registro sem indicar destino.", "Pedir que o usuário recomece sem necessidade.", "Compartilhar dados além do necessário."], answer: 0, explanation: "Encaminhamento claro evita perda da demanda e melhora a continuidade do atendimento." },
    { subject: "Gestão de Materiais", question: "A padronização de materiais pode ajudar a:", options: ["Reduzir variedade desnecessária e facilitar especificação e compra.", "Impedir comparação de fornecedores.", "Eliminar controle de qualidade.", "Aumentar itens sem uso."], answer: 0, explanation: "Padronizar reduz diversidade supérflua e facilita aquisição e controle." },
    { subject: "Direito Administrativo", question: "A finalidade de um ato administrativo deve ser:", options: ["Pública e prevista pelo ordenamento.", "Escolhida para beneficiar o agente.", "Sempre privada.", "Independente da competência."], answer: 0, explanation: "O ato deve atender à finalidade pública definida em lei." },
    { subject: "Informática", question: "Qual extensão costuma identificar um arquivo PDF?", options: [".pdf", ".xlsx", ".pptx", ".exe"], answer: 0, explanation: "PDF é formato de documento portátil, com extensão .pdf." },
    { subject: "Português", question: "Em um texto oficial, evitar redundâncias contribui para:", options: ["Concisão.", "Ambiguidade.", "Informalidade.", "Contradição."], answer: 0, explanation: "Concisão transmite a informação necessária sem repetições inúteis." },
    { subject: "Ética", question: "Tratar usuários com respeito, sem distinção pessoal, expressa:", options: ["Impessoalidade e urbanidade.", "Favorecimento.", "Sigilo absoluto de todo serviço.", "Autopromoção."], answer: 0, explanation: "O atendimento deve ser respeitoso e imparcial." }
  );

  // Gera um grande banco de exercícios inéditos por variação de números e cenários.
  // Cada rodada tem enunciado, resultado e explicação calculados para aqueles dados.
  const generatedCount = 3000 - questions.length;
  const shuffleOptions = (answer, seed) => {
    const offsets = [0, -2, 2, 5];
    const shift = seed % offsets.length;
    const options = offsets.map((_, i) => String(answer + offsets[(i + shift) % offsets.length]));
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
      explanation = `${staff} × ${hours} = ${correct} horas-servidor.`;
    }
    const choices = shuffleOptions(correct, variant + kind);
      // Include a distinct work context per generated item so different variants
      // cannot collapse into the same displayed prompt when number patterns align.
      const contexts = ["no protocolo", "no almoxarifado", "na unidade de atendimento", "na equipe administrativa", "no arquivo setorial", "na rotina do órgão"];
      const context = contexts[Math.floor(i / 10) % contexts.length];
      questions.push({ subject, question: `${question} (situação ${variant}, ${context})`, options: choices.options, answer: choices.answer, explanation });
  }

  function nextQuestion(cursor) {
    const index = Number.isSafeInteger(cursor) && cursor >= 0 ? (cursor * 7919 + 104729) % questions.length : 0;
    const item = questions[index];
    return { ...item, id: `cpu-pe:${index}`, correctIndex: item.answer, source, nextCursor: cursor + 1, poolSize: questions.length };
  }
  window.pernambucoQuestionBank = { questions, source, nextQuestion, poolSize: questions.length };
})();
