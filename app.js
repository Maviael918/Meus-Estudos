const buildings = [
  { id: "casa", name: "Casa", icon: "🏠", type: "Moradia", description: "Um lar para novas famílias.", cost: 35000, material: 15, effect: "homes", quizzes: [
    { subject: "MATEMÁTICA", question: "Uma casa recebe 8 moradores. Se construirmos 2 casas, quantas pessoas poderão morar nelas?", options: ["12 pessoas", "16 pessoas", "18 pessoas"], answer: 1, explain: "8 moradores × 2 casas = 16 pessoas." },
    { subject: "PORTUGUÊS", question: "Qual frase está escrita corretamente?", options: ["As famílias precisa de moradia.", "As famílias precisam de moradia.", "As família precisam de moradia."], answer: 1, explain: "O sujeito 'as famílias' está no plural: precisam." }
  ]},
  { id: "loja", name: "Mercadinho", icon: "🏪", type: "Comércio", description: "Produtos e serviços por perto.", cost: 50000, material: 20, effect: "services", quizzes: [
    { subject: "MATEMÁTICA", question: "O mercadinho faturou R$ 200 e gastou R$ 80. Quanto sobrou?", options: ["R$ 120", "R$ 180", "R$ 280"], answer: 0, explain: "R$ 200 − R$ 80 = R$ 120 de saldo." },
    { subject: "PORTUGUÊS", question: "Em um aviso, qual frase informa com clareza o horário de funcionamento?", options: ["Abrimos quando o sol aparece.", "Funcionamos das 8h às 18h.", "O mercado é bem legal."], answer: 1, explain: "A frase apresenta informação objetiva e precisa." }
  ]},
  { id: "escola", name: "Escola", icon: "🏫", type: "Educação", description: "Conhecimento para todos.", cost: 70000, material: 30, effect: "knowledge", quizzes: [
    { subject: "PORTUGUÊS", question: "A escola tem 3 turmas com 12 alunos em cada uma. Quantos alunos estudam lá?", options: ["15 alunos", "36 alunos", "32 alunos"], answer: 1, explain: "3 × 12 = 36 alunos." },
    { subject: "MATEMÁTICA", question: "A escola recebeu 40 livros e distribuiu 25. Quantos livros restaram?", options: ["15 livros", "25 livros", "65 livros"], answer: 0, explain: "40 − 25 = 15 livros." }
  ]},
  { id: "parque", name: "Parque", icon: "🌳", type: "Lazer", description: "Mais verde e diversão.", cost: 45000, material: 25, effect: "happiness", quizzes: [
    { subject: "MATEMÁTICA", question: "No parque há 4 canteiros com 6 flores em cada um. Quantas flores há ao todo?", options: ["10 flores", "24 flores", "46 flores"], answer: 1, explain: "4 × 6 = 24 flores." },
    { subject: "PORTUGUÊS", question: "Qual atitude ajuda a manter o parque limpo?", options: ["Deixar o lixo no gramado.", "Separar e descartar o lixo corretamente.", "Arrancar as plantas."], answer: 1, explain: "Descartar o lixo corretamente preserva os espaços públicos." }
  ]},
  { id: "fabrica", name: "Fábrica", icon: "🏭", type: "Indústria", description: "Empregos e produção local.", cost: 90000, material: 45, effect: "money", quizzes: [
    { subject: "MATEMÁTICA", question: "Uma fábrica produz 15 brinquedos por dia. Quantos produz em 4 dias?", options: ["19 brinquedos", "60 brinquedos", "45 brinquedos"], answer: 1, explain: "15 × 4 = 60 brinquedos." },
    { subject: "MATEMÁTICA", question: "Uma máquina custa R$ 500 e tem desconto de 10%. Qual é o preço com desconto?", options: ["R$ 450", "R$ 490", "R$ 550"], answer: 0, explain: "10% de R$ 500 é R$ 50; R$ 500 − R$ 50 = R$ 450." }
  ]}
];

function createStudySeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000);
}

const initialState = {
  economyVersion: 2,
  money: 250000, population: 24, materials: 120, happiness: 72, knowledge: 0,
  built: [{ id: "prefeitura", name: "Prefeitura", icon: "🏛️", type: "cityhall", cell: 7 }],
  day: 18, month: 3, completedMissions: 0, expanded: false,
  bank: { accountNumber: null, openedAt: null, loan: null, transactions: [] },
  study: { questionCursor: 0, seed: createStudySeed() }
};
const saveKey = "cidade-em-construcao-v1";
const buildingById = new Map(buildings.map((building) => [building.id, building]));
let state = loadGuestState();
let cloudUser = null;
let cloudReady = false;
let cloudSaveTimer;
let cloudWrite = Promise.resolve();
let selectedBuilding = null;
let selectedAnswer = null;
let activeQuiz = null;
let activeFinanceQuestion = null;
let pendingLoanOffer = null;
let authMode = "sign-in";
let installPrompt = null;
let toastTimer;

const byId = (id) => document.getElementById(id);
function normalizeState(candidate) {
  if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.built)) return null;
  const built = [];
  const occupiedCells = new Set();
  for (const item of candidate.built) {
    if (!item || !Number.isInteger(item.cell) || item.cell < 0 || item.cell > 24 || occupiedCells.has(item.cell)) return null;
    let normalized;
    if (item.id === "prefeitura") {
      normalized = { id: "prefeitura", name: "Prefeitura", icon: "🏛️", type: "cityhall", cell: item.cell };
    } else {
      const catalogItem = buildingById.get(item.id);
      if (!catalogItem) return null;
      normalized = { id: catalogItem.id, name: catalogItem.name, icon: catalogItem.icon, type: "building", effect: catalogItem.effect, cell: item.cell };
    }
    occupiedCells.add(item.cell);
    built.push(normalized);
  }
  if (!built.some((item) => item.id === "prefeitura")) return null;
  const numericFields = ["money", "population", "materials", "happiness", "knowledge", "day", "month", "completedMissions"];
  const economyVersion = candidate.economyVersion || 1;
  if (economyVersion !== 1 && economyVersion !== 2) return null;
  for (const field of numericFields) {
    if (!Number.isSafeInteger(candidate[field]) || candidate[field] < 0) return null;
  }
  if (candidate.happiness > 100 || candidate.day < 1 || candidate.day > 30 || candidate.month < 1 || candidate.month > 12 || typeof candidate.expanded !== "boolean") return null;
  const bank = candidate.bank && typeof candidate.bank === "object" ? candidate.bank : {};
  const transactions = Array.isArray(bank.transactions) ? bank.transactions.slice(-30).filter((entry) => (
    entry && typeof entry.label === "string" && Number.isSafeInteger(entry.amountCents)
  )).map((entry) => ({
    label: entry.label.slice(0, 100),
    amountCents: entry.amountCents,
    date: typeof entry.date === "string" ? entry.date.slice(0, 24) : ""
  })) : [];
  const study = candidate.study && typeof candidate.study === "object" ? candidate.study : {};
  const normalizedMoney = economyVersion === 1 ? candidate.money * 100 : candidate.money;
  if (!Number.isSafeInteger(normalizedMoney)) return null;
  let loan = null;
  if (bank.loan && typeof bank.loan === "object") {
    const savedLoan = bank.loan;
    if (["simple", "compound"].includes(savedLoan.method)
      && [100, 150, 200].includes(savedLoan.monthlyRateBps)
      && [6, 12].includes(savedLoan.termMonths)
      && ["active", "overdue", "paid"].includes(savedLoan.status)
      && ["principalCents", "totalCents", "installmentCents", "remainingCents", "monthsRemaining", "missedPayments"].every((key) => Number.isSafeInteger(savedLoan[key]) && savedLoan[key] >= 0)) {
      loan = { ...savedLoan };
    }
  }
  const accountNumber = typeof bank.accountNumber === "string" && /^\d{4}-\d{4}$/.test(bank.accountNumber)
    ? bank.accountNumber : null;
  const questionCursor = Number.isSafeInteger(study.questionCursor) && study.questionCursor >= 0
    ? study.questionCursor : 0;
  const seed = Number.isInteger(study.seed) && study.seed >= 0
    ? study.seed >>> 0 : initialState.study.seed;
  return {
    ...initialState,
    ...Object.fromEntries(numericFields.map((field) => [field, field === "money" ? normalizedMoney : candidate[field]])),
    economyVersion: 2,
    expanded: candidate.expanded,
    built,
    bank: { accountNumber, openedAt: typeof bank.openedAt === "string" ? bank.openedAt : null, loan, transactions },
    study: { questionCursor, seed }
  };
}
function loadGuestState() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey));
    if (saved === null) return structuredClone(initialState);
    const normalized = normalizeState(saved);
    if (normalized) return normalized;
    console.warn("O progresso local não corresponde ao formato esperado; iniciando uma cidade nova.");
  } catch (error) {
    console.warn("Não foi possível carregar o progresso salvo; iniciando uma cidade nova.", error);
  }
  return structuredClone(initialState);
}
function queueCloudSave(ownerId, snapshot) {
  cloudWrite = cloudWrite.then(() => window.supabaseGame.saveCity(ownerId, "Vila das Flores", snapshot))
    .catch((error) => {
      console.error("Não foi possível sincronizar a cidade com o Supabase.", error);
      showToast("Falha ao sincronizar com o Supabase. Seu progresso online pode estar desatualizado.");
    });
  return cloudWrite;
}
function save() {
  if (cloudUser) {
    if (!cloudReady) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(() => {
      const snapshot = structuredClone(state);
      queueCloudSave(cloudUser.id, snapshot);
    }, 500);
    return;
  }
  try { localStorage.setItem(saveKey, JSON.stringify(state)); }
  catch (error) { console.error("Não foi possível salvar o progresso local.", error); showToast("Não foi possível salvar. Verifique o espaço disponível no navegador."); }
}
function formatNumber(number) { return new Intl.NumberFormat("pt-BR").format(number); }
function formatBRL(cents) { return window.financeQuestionBank.formatMoney(cents); }

function renderMap() {
  const map = byId("city-map");
  map.replaceChildren();
  const occupancy = new Map(state.built.map((building) => [building.cell, building]));
  const total = state.expanded ? 25 : 20;
  for (let cell = 0; cell < total; cell++) {
    const building = occupancy.get(cell);
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `city-tile ${building ? (building.type === "cityhall" ? "cityhall" : "") : cell >= 15 && !state.expanded ? "locked" : "available"}`;
    if (building) {
      tile.setAttribute("aria-label", building.name);
      tile.innerHTML = `<span class="tile-icon">${building.icon}</span><span class="tile-name">${building.name}</span>`;
    } else if (cell >= 15 && !state.expanded) {
      tile.setAttribute("aria-label", "Área bloqueada — desbloqueie com um desafio");
      tile.textContent = "🔒";
      tile.addEventListener("click", startExpansionQuiz);
    } else {
      tile.setAttribute("aria-label", `Terreno disponível ${cell + 1}; clique para construir`);
      tile.innerHTML = '<span class="tile-icon">＋</span><span class="tile-name">Construir</span>';
      tile.addEventListener("click", () => {
        byId("construir").scrollIntoView({ behavior: "smooth", block: "center" });
        showToast("Escolha uma construção abaixo para ocupar este terreno.");
      });
    }
    map.append(tile);
  }
}

function renderBuildings() {
  const list = byId("build-list");
  list.replaceChildren();
  buildings.forEach((building) => {
    const card = document.createElement("article");
    card.className = "build-card";
    const canAfford = state.money >= building.cost && state.materials >= building.material;
    card.innerHTML = `<div class="build-card-head"><span class="build-icon">${building.icon}</span><span class="build-type">${building.type}</span></div><h3>${building.name}</h3><p>${building.description}</p><div class="build-meta"><span class="cost"><b>${formatBRL(building.cost)}</b> · ${building.material} mat.</span><button class="build-action" ${canAfford ? "" : "disabled"}>Construir</button></div>`;
    card.querySelector("button").addEventListener("click", () => startQuiz(building));
    list.append(card);
  });
}

function recordTransaction(label, amountCents) {
  if (!state.bank.accountNumber) return;
  state.bank.transactions.unshift({
    label,
    amountCents,
    date: `Dia ${state.day} · Mês ${state.month}`
  });
  state.bank.transactions = state.bank.transactions.slice(0, 30);
}

function renderBank() {
  const accountOpen = Boolean(state.bank.accountNumber);
  byId("bank-account-closed").classList.toggle("hidden", accountOpen);
  byId("bank-account-open").classList.toggle("hidden", !accountOpen);
  byId("bank-feedback").textContent = "";
  byId("bank-account-closed").querySelector("button").disabled = accountOpen;

  if (accountOpen) {
    byId("bank-account-number").textContent = state.bank.accountNumber;
    byId("bank-balance").textContent = formatBRL(state.money);
    const loan = state.bank.loan;
    const hasActiveLoan = loan && ["active", "overdue"].includes(loan.status);
    byId("loan-form").classList.toggle("hidden", hasActiveLoan);
    byId("loan-summary").classList.toggle("hidden", !hasActiveLoan && (!loan || loan.status !== "paid"));
    if (hasActiveLoan) {
      const methodName = loan.method === "simple" ? "Juros simples" : "Juros compostos";
      const status = loan.status === "overdue" ? "Parcela pendente — o banco tentará novamente no próximo mês." : "Em dia";
      byId("loan-summary").innerHTML = `<div class="loan-summary-heading"><span>📄 Empréstimo ativo</span><strong>${status}</strong></div><div class="loan-summary-grid"><span>Modalidade<strong>${methodName} · ${(loan.monthlyRateBps / 100).toLocaleString("pt-BR")}% a.m.</strong></span><span>Saldo a pagar<strong>${formatBRL(loan.remainingCents)}</strong></span><span>Parcelas restantes<strong>${loan.monthsRemaining} de ${loan.termMonths}</strong></span><span>Parcela mensal<strong>${formatBRL(loan.installmentCents)}</strong></span></div>`;
    } else if (loan?.status === "paid") {
      byId("loan-summary").innerHTML = '<div class="loan-summary-heading"><span>✅ Empréstimo quitado</span><strong>Você pode solicitar outro.</strong></div>';
    }
    updateLoanPreview();
  }

  const transactions = byId("transaction-list");
  transactions.replaceChildren();
  byId("bank-empty-transactions").classList.toggle("hidden", state.bank.transactions.length > 0);
  state.bank.transactions.slice(0, 8).forEach((entry) => {
    const row = document.createElement("li");
    const description = document.createElement("span");
    const label = document.createElement("span");
    const date = document.createElement("small");
    const amount = document.createElement("strong");
    label.textContent = entry.label;
    date.textContent = entry.date;
    description.append(label, date);
    amount.textContent = `${entry.amountCents > 0 ? "+" : entry.amountCents < 0 ? "−" : ""}${formatBRL(Math.abs(entry.amountCents))}`;
    amount.className = entry.amountCents >= 0 ? "transaction-positive" : "transaction-negative";
    row.append(description, amount);
    transactions.append(row);
  });
  const remaining = Math.max(0, window.financeQuestionBank.poolSize - state.study.questionCursor);
  byId("library-counter").textContent = `${formatNumber(remaining)} restantes`;
}

function updateLoanPreview() {
  const amount = Number(byId("loan-amount").value);
  const term = Number(byId("loan-term").value);
  const method = byId("loan-method").value;
  const rateBps = method === "simple" ? 200 : 150;
  const calculation = window.financeQuestionBank.calculateLoan(amount, rateBps, term, method);
  const methodLabel = method === "simple" ? "simples" : "compostos";
  byId("loan-preview").innerHTML = `Taxa fixa: <strong>${(rateBps / 100).toLocaleString("pt-BR")}% ao mês</strong><br>Total previsto: <strong>${formatBRL(calculation.totalCents)}</strong> · ${term} parcelas de aproximadamente <strong>${formatBRL(calculation.installmentCents)}</strong><br><span>Cálculo pelo regime de juros ${methodLabel}.</span>`;
}

function render() {
  byId("money-value").textContent = formatBRL(state.money);
  byId("population-value").textContent = formatNumber(state.population);
  byId("materials-value").textContent = formatNumber(state.materials);
  byId("happiness-value").innerHTML = `${state.happiness}<small>%</small>`;
  byId("homes-count").textContent = state.built.filter((item) => item.effect === "homes").length;
  byId("services-count").textContent = state.built.filter((item) => item.effect === "services").length;
  byId("knowledge-count").textContent = `${state.knowledge} pts`;
  const homes = state.built.filter((item) => item.effect === "homes").length;
  const mission = state.completedMissions % 3;
  const progress = mission === 0 ? Math.min(homes, 2) : mission === 1 ? Math.min(state.built.filter((item) => item.effect === "services").length, 1) : Math.min(state.knowledge, 10);
  const targets = [{ title: "Um lar para todos", description: "Construa 2 casas para receber novas famílias na cidade.", target: 2, reward: "+R$ 300,00" },
    { title: "Comércio de bairro", description: "Construa um mercadinho para atender os moradores.", target: 1, reward: "+R$ 250,00" },
    { title: "Aprender para crescer", description: "Construa uma escola e leve conhecimento à cidade.", target: 10, reward: "+R$ 400,00" }];
  const goal = targets[mission];
  byId("mission-count").textContent = `${mission + 1} de 3`;
  byId("mission-title").textContent = goal.title;
  byId("mission-description").textContent = goal.description;
  byId("mission-progress-text").textContent = `${progress} / ${goal.target}`;
  byId("mission-progress").style.width = `${Math.min(100, progress / goal.target * 100)}%`;
  if (progress >= goal.target) {
    state.completedMissions++;
    const rewardCents = [30000, 25000, 40000][mission];
    state.money += rewardCents;
    recordTransaction(`Recompensa: ${goal.title}`, rewardCents);
    showToast(`Missão concluída! Recompensa: ${goal.reward}`);
    save();
    return render();
  }
  byId("city-level").innerHTML = state.expanded ? "Nível 2 <b>•</b> Cidade" : "Nível 1 <b>•</b> Vila";
  renderMap();
  renderBuildings();
  renderBank();
  save();
}

function startQuiz(building) {
  if (state.money < building.cost || state.materials < building.material) {
    showToast("Recursos insuficientes para esta construção.");
    return;
  }
  selectedBuilding = building;
  const quiz = building.quizzes[Math.floor(Math.random() * building.quizzes.length)];
  activeQuiz = quiz;
  selectedAnswer = null;
  byId("quiz-subject").textContent = quiz.subject;
  byId("quiz-building-icon").textContent = building.icon;
  byId("quiz-title").textContent = `Desafio: ${building.name}`;
  byId("quiz-intro").textContent = `Resolva o desafio para construir ${building.name.toLowerCase()} na cidade.`;
  byId("quiz-question").textContent = quiz.question;
  byId("quiz-feedback").textContent = "";
  byId("quiz-feedback").className = "quiz-feedback";
  byId("quiz-submit").disabled = true;
  const options = byId("quiz-options");
  options.replaceChildren();
  quiz.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    button.addEventListener("click", () => {
      selectedAnswer = index;
      options.querySelectorAll(".quiz-option").forEach((item, i) => item.classList.toggle("selected", i === index));
      byId("quiz-submit").disabled = false;
      byId("quiz-feedback").textContent = "";
    });
    options.append(button);
  });
  byId("quiz-modal").classList.remove("hidden");
  byId("quiz-modal").setAttribute("aria-hidden", "false");
}

function startExpansionQuiz() {
  if (state.expanded) return;
  selectedBuilding = null;
  selectedAnswer = null;
  activeQuiz = {
    type: "expansion",
    subject: "MATEMÁTICA",
    question: "A nova região terá 5 terrenos. Se 2 serão usados para moradias, quantos terrenos sobram para outros projetos?",
    options: ["2 terrenos", "3 terrenos", "7 terrenos"],
    answer: 1,
    explain: "5 − 2 = 3 terrenos disponíveis para outros projetos."
  };
  byId("quiz-subject").textContent = activeQuiz.subject;
  byId("quiz-building-icon").textContent = "🗺️";
  byId("quiz-title").textContent = "Desbloquear nova região";
  byId("quiz-intro").textContent = "Mostre que sua cidade está pronta para crescer.";
  byId("quiz-question").textContent = activeQuiz.question;
  byId("quiz-feedback").textContent = "";
  byId("quiz-feedback").className = "quiz-feedback";
  byId("quiz-submit").disabled = true;
  const options = byId("quiz-options");
  options.replaceChildren();
  activeQuiz.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    button.addEventListener("click", () => {
      selectedAnswer = index;
      options.querySelectorAll(".quiz-option").forEach((item, i) => item.classList.toggle("selected", i === index));
      byId("quiz-submit").disabled = false;
      byId("quiz-feedback").textContent = "";
    });
    options.append(button);
  });
  byId("quiz-modal").classList.remove("hidden");
  byId("quiz-modal").setAttribute("aria-hidden", "false");
}

function closeQuiz() {
  byId("quiz-modal").classList.add("hidden");
  byId("quiz-modal").setAttribute("aria-hidden", "true");
}

function showFinanceQuestion(purpose, preferredMethod, loanOffer = null) {
  try {
    const question = window.financeQuestionBank.nextQuestion(
      state.study.questionCursor,
      state.study.seed,
      preferredMethod
    );
    state.study.questionCursor = question.nextCursor;
    activeFinanceQuestion = { question, purpose, loanOffer };
    selectedAnswer = null;
    byId("finance-subject").textContent = question.subject;
    byId("finance-sequence").textContent = `DESAFIO ${formatNumber(question.nextCursor)} DE ${formatNumber(question.poolSize)}`;
    byId("finance-title").textContent = purpose === "loan" ? "Desafio para liberar crédito" : "Desafio do Banco Central";
    byId("finance-icon").textContent = question.method === "simple" ? "🧮" : "📈";
    byId("finance-intro").textContent = purpose === "loan"
      ? `Você pediu ${formatBRL(loanOffer.amountCents)} com ${loanOffer.method === "simple" ? "juros simples" : "juros compostos"}. Resolva o desafio desse tipo de juros para liberar o crédito.`
      : "Resolva o cálculo. A próxima questão terá outros valores e não será repetida nesta cidade.";
    byId("finance-question").textContent = question.question;
    byId("finance-feedback").textContent = "";
    byId("finance-feedback").className = "quiz-feedback";
    byId("finance-submit").disabled = true;
    const options = byId("finance-options");
    options.replaceChildren();
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      button.addEventListener("click", () => {
        selectedAnswer = index;
        options.querySelectorAll(".quiz-option").forEach((item, optionIndex) => {
          item.classList.toggle("selected", optionIndex === index);
        });
        byId("finance-submit").disabled = false;
        byId("finance-feedback").textContent = "";
      });
      options.append(button);
    });
    byId("finance-modal").classList.remove("hidden");
    byId("finance-modal").setAttribute("aria-hidden", "false");
    save();
  } catch (error) {
    console.error("Não foi possível gerar outro desafio financeiro.", error);
    showToast(error.message || "Não foi possível gerar um desafio financeiro.");
  }
}

function openBankAccount() {
  if (state.bank.accountNumber) return;
  const randomDigits = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(randomDigits);
  else {
    randomDigits[0] = Math.floor(Math.random() * 10000);
    randomDigits[1] = Math.floor(Math.random() * 10000);
  }
  const branch = String(randomDigits[0] % 10000).padStart(4, "0");
  const account = String(randomDigits[1] % 10000).padStart(4, "0");
  state.bank.accountNumber = `${branch}-${account}`;
  state.bank.openedAt = new Date().toISOString();
  recordTransaction("Saldo inicial da prefeitura", state.money);
  render();
  showToast("Conta municipal aberta. O saldo é compartilhado com o orçamento da cidade.");
  byId("banco").scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestLoan(event) {
  event.preventDefault();
  if (!state.bank.accountNumber) {
    showToast("Abra a conta municipal antes de solicitar um empréstimo.");
    return;
  }
  if (state.bank.loan && ["active", "overdue"].includes(state.bank.loan.status)) {
    showToast("Quite ou regularize o empréstimo atual antes de solicitar outro.");
    return;
  }
  const amountCents = Number(byId("loan-amount").value);
  const method = byId("loan-method").value;
  const termMonths = Number(byId("loan-term").value);
  if (![100000, 500000, 1000000].includes(amountCents)
    || !["simple", "compound"].includes(method)
    || ![6, 12].includes(termMonths)) {
    showToast("As condições selecionadas para o empréstimo são inválidas.");
    return;
  }
  const monthlyRateBps = method === "simple" ? 200 : 150;
  pendingLoanOffer = { amountCents, method, monthlyRateBps, termMonths };
  showFinanceQuestion("loan", method, pendingLoanOffer);
}

function closeFinanceQuestion() {
  byId("finance-modal").classList.add("hidden");
  byId("finance-modal").setAttribute("aria-hidden", "true");
  activeFinanceQuestion = null;
  pendingLoanOffer = null;
}

function submitFinanceAnswer() {
  if (!activeFinanceQuestion || selectedAnswer === null) return;
  const { question, purpose, loanOffer } = activeFinanceQuestion;
  const feedback = byId("finance-feedback");
  if (selectedAnswer !== question.correctIndex) {
    feedback.textContent = "Essa alternativa não confere. Revise a taxa e o prazo e tente novamente.";
    feedback.className = "quiz-feedback";
    return;
  }

  state.knowledge += 2;
  feedback.textContent = `Correto! ${question.explanation}`;
  feedback.className = "quiz-feedback correct";
  byId("finance-submit").disabled = true;

  if (purpose === "loan" && loanOffer) {
    if (state.bank.loan && ["active", "overdue"].includes(state.bank.loan.status)) {
      feedback.textContent = "O empréstimo atual foi iniciado enquanto você respondia. Conclua a parcela antes de solicitar outro.";
      feedback.className = "quiz-feedback";
      return;
    }
    const calculation = window.financeQuestionBank.calculateLoan(
      loanOffer.amountCents,
      loanOffer.monthlyRateBps,
      loanOffer.termMonths,
      loanOffer.method
    );
    state.bank.loan = {
      ...loanOffer,
      principalCents: loanOffer.amountCents,
      totalCents: calculation.totalCents,
      installmentCents: calculation.installmentCents,
      remainingCents: calculation.totalCents,
      monthsRemaining: loanOffer.termMonths,
      missedPayments: 0,
      status: "active"
    };
    state.money += loanOffer.amountCents;
    recordTransaction("Empréstimo liberado pelo Banco Central da Cidade", loanOffer.amountCents);
  } else {
    recordTransaction("Aprendizado: desafio de matemática financeira", 0);
  }

  save();
  window.setTimeout(() => {
    const wasLoan = purpose === "loan";
    closeFinanceQuestion();
    render();
    showToast(wasLoan
      ? `Desafio correto! ${formatBRL(loanOffer.amountCents)} foram adicionados à conta.`
      : "Desafio correto! Você ganhou 2 pontos de conhecimento.");
  }, 850);
}

function chargeMonthlyLoanInstallment() {
  const loan = state.bank.loan;
  if (!loan || !["active", "overdue"].includes(loan.status)) return;
  const amountDue = loan.monthsRemaining === 1
    ? loan.remainingCents
    : Math.min(loan.installmentCents, loan.remainingCents);
  if (state.money < amountDue) {
    loan.status = "overdue";
    loan.missedPayments++;
    recordTransaction("Parcela não paga — saldo insuficiente", 0);
    showToast(`Parcela de ${formatBRL(amountDue)} pendente. Deposite recursos antes do próximo mês.`);
    return;
  }
  state.money -= amountDue;
  loan.remainingCents -= amountDue;
  loan.monthsRemaining--;
  loan.status = loan.monthsRemaining === 0 ? "paid" : "active";
  recordTransaction("Parcela do empréstimo", -amountDue);
  if (loan.status === "paid") showToast("Empréstimo quitado! A conta da cidade está livre para novos projetos.");
  else showToast(`Parcela de ${formatBRL(amountDue)} paga. Restam ${loan.monthsRemaining} parcelas.`);
}

function submitAnswer() {
  if (selectedAnswer === null || !activeQuiz || (!selectedBuilding && activeQuiz.type !== "expansion")) return;
  const feedback = byId("quiz-feedback");
  if (selectedAnswer !== activeQuiz.answer) {
    feedback.textContent = "Ainda não! Pense com calma e tente outra resposta.";
    feedback.className = "quiz-feedback";
    return;
  }
  if (activeQuiz.type === "expansion") {
    state.expanded = true;
    byId("quiz-feedback").textContent = `Correto! ${activeQuiz.explain}`;
    byId("quiz-feedback").className = "quiz-feedback correct";
    byId("quiz-submit").disabled = true;
    window.setTimeout(() => {
      closeQuiz();
      showToast("Nova região desbloqueada! Agora você tem mais terrenos para construir.");
      render();
    }, 850);
    return;
  }
  if (state.money < selectedBuilding.cost || state.materials < selectedBuilding.material) {
    closeQuiz();
    showToast("Os recursos mudaram e não são mais suficientes.");
    render();
    return;
  }
  const occupied = new Set(state.built.map((item) => item.cell));
  let cell = -1;
  const limit = state.expanded ? 25 : 15;
  for (let i = 0; i < limit; i++) if (!occupied.has(i)) { cell = i; break; }
  if (cell === -1) {
    feedback.textContent = "Não há terrenos livres. Desbloqueie uma nova área primeiro.";
    feedback.className = "quiz-feedback";
    return;
  }
  state.money -= selectedBuilding.cost;
  state.materials -= selectedBuilding.material;
  const item = { id: selectedBuilding.id, name: selectedBuilding.name, icon: selectedBuilding.icon, type: "building", effect: selectedBuilding.effect, cell };
  state.built.push(item);
  recordTransaction(`Construção: ${selectedBuilding.name}`, -selectedBuilding.cost);
  if (item.effect === "homes") state.population += 8;
  if (item.effect === "happiness") state.happiness = Math.min(100, state.happiness + 8);
  if (item.effect === "knowledge") state.knowledge += 10;
  if (item.effect === "money") {
    state.money += 10000;
    recordTransaction("Produção da fábrica", 10000);
  }
  feedback.textContent = `Correto! ${activeQuiz.explain}`;
  feedback.className = "quiz-feedback correct";
  byId("quiz-submit").disabled = true;
  window.setTimeout(() => {
    closeQuiz();
    showToast(`${selectedBuilding.name} construído! Sua cidade está crescendo.`);
    render();
  }, 850);
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function setAccountButton() {
  byId("account-label").textContent = cloudUser ? "Sair" : "Entrar";
  byId("account-button").setAttribute("aria-label", cloudUser ? "Sair da conta" : "Entrar ou criar conta");
}

function showAuthModal() {
  byId("auth-feedback").textContent = "";
  byId("auth-feedback").className = "auth-feedback";
  byId("auth-modal").classList.remove("hidden");
  byId("auth-modal").setAttribute("aria-hidden", "false");
  byId("auth-email").focus();
}

function closeAuthModal() {
  byId("auth-modal").classList.add("hidden");
  byId("auth-modal").setAttribute("aria-hidden", "true");
}

function closeInstallModal() {
  byId("install-modal").classList.add("hidden");
  byId("install-modal").setAttribute("aria-hidden", "true");
}

function isInstalledAsWebApp() {
  return navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function updateInstallButton() {
  const button = byId("install-button");
  if (isInstalledAsWebApp()) {
    button.classList.add("installed");
    button.setAttribute("aria-label", "Jogo instalado neste dispositivo");
    byId("install-label").textContent = "Instalado";
    return;
  }
  button.classList.remove("installed");
  button.setAttribute("aria-label", "Instalar jogo no dispositivo");
  byId("install-label").textContent = "Instalar";
}

async function showInstallOptions() {
  if (isInstalledAsWebApp()) {
    showToast("O jogo já está instalado neste dispositivo.");
    return;
  }
  if (installPrompt) {
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    installPrompt = null;
    updateInstallButton();
    if (result.outcome === "accepted") showToast("Instalação iniciada.");
    return;
  }
  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
  if (isAppleMobile && isSafari) {
    byId("install-instructions").textContent = "No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. Se aparecer, deixe “Abrir como App Web” ativado e toque em Adicionar.";
  } else if (isAppleMobile) {
    byId("install-instructions").textContent = "Para instalar no iPhone ou iPad, abra este endereço no Safari. Toque em Compartilhar → “Adicionar à Tela de Início” e depois em Adicionar.";
  } else {
    byId("install-instructions").textContent = "Use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”. O nome e a opção podem variar conforme o navegador.";
  }
  byId("install-modal").classList.remove("hidden");
  byId("install-modal").setAttribute("aria-hidden", "false");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const isSecureOrigin = window.location.protocol === "https:"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";
  if (!isSecureOrigin) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.warn("Não foi possível registrar o suporte offline.", error);
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === "sign-up";
  byId("auth-title").textContent = signingUp ? "Crie sua conta de prefeito(a)" : "Entre para salvar sua cidade";
  byId("auth-submit").textContent = signingUp ? "Criar conta" : "Entrar";
  byId("auth-mode-toggle").textContent = signingUp ? "Já tem conta? Entrar" : "Ainda não tem conta? Criar conta";
  byId("auth-password").autocomplete = signingUp ? "new-password" : "current-password";
  byId("auth-feedback").textContent = "";
  byId("auth-feedback").className = "auth-feedback";
}

async function activateUser(user) {
  window.clearTimeout(cloudSaveTimer);
  await cloudWrite;
  cloudUser = user;
  cloudReady = false;
  setAccountButton();
  const city = await window.supabaseGame.loadCity(user.id);
  if (city) {
    if (city.state_version !== 1) throw new Error("O formato do progresso precisa ser atualizado antes de carregar.");
    const loadedState = normalizeState(city.game_state);
    if (!loadedState) throw new Error("O progresso salvo tem um formato inválido. Nenhuma alteração foi gravada.");
    state = loadedState;
  }
  cloudReady = true;
  render();
  closeAuthModal();
  showToast(city ? "Cidade carregada da sua conta Supabase." : "Conta conectada! Sua nova cidade está salva no Supabase.");
}

async function initializeSupabase() {
  try {
    const client = await window.supabaseGame.getClient();
    if (!client) return;
    const session = await window.supabaseGame.getSession();
    if (session) await activateUser(session.user);
  } catch (error) {
    console.error("Não foi possível iniciar a conexão com o Supabase.", error);
    showToast("Não foi possível conectar ao Supabase. Confira a configuração e tente novamente.");
  }
}

async function handleAccountClick() {
  if (!cloudUser) {
    showAuthModal();
    if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
      byId("auth-feedback").textContent = "Configure a URL e a chave pública em supabase-config.js para ativar as contas.";
    }
    return;
  }
  try {
    window.clearTimeout(cloudSaveTimer);
    if (cloudReady) await queueCloudSave(cloudUser.id, structuredClone(state));
    await cloudWrite;
    await window.supabaseGame.signOut();
    cloudUser = null;
    cloudReady = false;
    state = loadGuestState();
    setAccountButton();
    render();
    showToast("Você saiu da conta. O progresso de visitante continua salvo neste navegador.");
  } catch (error) {
    console.error("Não foi possível sair da conta Supabase.", error);
    showToast("Não foi possível sair da conta. Tente novamente.");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const feedback = byId("auth-feedback");
  const submit = byId("auth-submit");
  const email = byId("auth-email").value.trim();
  const password = byId("auth-password").value;
  submit.disabled = true;
  feedback.textContent = "";
  feedback.className = "auth-feedback";
  try {
    const client = await window.supabaseGame.getClient();
    if (!client) throw new Error("Configure a URL e a chave pública do Supabase em supabase-config.js.");
    if (authMode === "sign-up") {
      const result = await window.supabaseGame.signUp(email, password);
      if (result.session) {
        await activateUser(result.user);
      } else {
        feedback.textContent = "Conta criada. Confirme seu e-mail e depois entre para carregar sua cidade.";
        feedback.className = "auth-feedback success";
        setAuthMode("sign-in");
        feedback.textContent = "Conta criada. Confirme seu e-mail e depois entre para carregar sua cidade.";
        feedback.className = "auth-feedback success";
      }
    } else {
      const user = await window.supabaseGame.signIn(email, password);
      await activateUser(user);
    }
  } catch (error) {
    console.error("Falha na autenticação ou no carregamento da cidade.", error);
    feedback.textContent = error.message || "Não foi possível autenticar. Verifique os dados e tente novamente.";
    feedback.className = "auth-feedback";
  } finally {
    submit.disabled = false;
  }
}

byId("close-quiz").addEventListener("click", closeQuiz);
byId("quiz-submit").addEventListener("click", submitAnswer);
byId("quiz-modal").addEventListener("click", (event) => { if (event.target === byId("quiz-modal")) closeQuiz(); });
byId("open-bank-account").addEventListener("click", openBankAccount);
byId("loan-form").addEventListener("submit", requestLoan);
["loan-amount", "loan-method", "loan-term"].forEach((id) => {
  byId(id).addEventListener("change", updateLoanPreview);
});
byId("practice-interest").addEventListener("click", () => showFinanceQuestion("practice", null));
byId("close-finance").addEventListener("click", closeFinanceQuestion);
byId("finance-submit").addEventListener("click", submitFinanceAnswer);
byId("finance-modal").addEventListener("click", (event) => {
  if (event.target === byId("finance-modal")) closeFinanceQuestion();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeQuiz();
  closeFinanceQuestion();
  closeAuthModal();
  closeInstallModal();
});
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item === link));
  });
});
byId("account-button").addEventListener("click", handleAccountClick);
byId("close-auth").addEventListener("click", closeAuthModal);
byId("auth-modal").addEventListener("click", (event) => { if (event.target === byId("auth-modal")) closeAuthModal(); });
byId("auth-mode-toggle").addEventListener("click", () => setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in"));
byId("auth-form").addEventListener("submit", handleAuthSubmit);
byId("install-button").addEventListener("click", showInstallOptions);
byId("close-install").addEventListener("click", closeInstallModal);
byId("confirm-install").addEventListener("click", closeInstallModal);
byId("install-modal").addEventListener("click", (event) => { if (event.target === byId("install-modal")) closeInstallModal(); });
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  updateInstallButton();
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  updateInstallButton();
  showToast("Cidade em Construção foi instalada neste dispositivo.");
});
window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateInstallButton);
byId("next-turn").addEventListener("click", () => {
  state.day++;
  let newMonth = false;
  if (state.day > 30) { state.day = 1; state.month++; newMonth = true; }
  if (state.month > 12) state.month = 1;
  state.money += 12000;
  state.materials += 10;
  recordTransaction("Repasse diário da prefeitura", 12000);
  if (newMonth) chargeMonthlyLoanInstallment();
  byId("next-turn").innerHTML = "<span>✓</span> Dia avançado";
  window.setTimeout(() => { byId("next-turn").innerHTML = "<span>⏵</span> Avançar dia"; }, 1200);
  if (!newMonth || !state.bank.loan || state.bank.loan.status === "paid") {
    showToast(`Novo dia! A cidade recebeu ${formatBRL(12000)} e 10 materiais.`);
  }
  render();
});
byId("map-toggle").addEventListener("click", () => showToast("Visão geral da sua cidade."));
byId("show-all").addEventListener("click", () => showToast("Mais construções serão desbloqueadas conforme sua cidade cresce."));
byId("learn-more").addEventListener("click", () => {
  const tips = ["Uma casa nova pode abrigar até 8 moradores. Planeje bem para sua cidade crescer!", "Escolas geram conhecimento: ele abre portas para novas áreas e oportunidades.", "Parques deixam a cidade mais feliz. Uma população contente ajuda o comércio local!"];
  const index = Math.floor(Math.random() * tips.length);
  byId("advisor-tip").textContent = tips[index];
});
byId("sound-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.classList.toggle("sound-off");
  button.title = button.classList.contains("sound-off") ? "Sons desativados" : "Ativar ou desativar sons";
  showToast(button.classList.contains("sound-off") ? "Sons desativados." : "Sons ativados.");
});
render();
setAccountButton();
updateInstallButton();
registerServiceWorker();
initializeSupabase();
