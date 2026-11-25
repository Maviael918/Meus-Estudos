const buildings = [
  { id: "casa", name: "Casa", icon: "🏠", type: "Moradia", description: "Um lar para novas famílias.", cost: 35000, material: 15, effect: "homes" },
  { id: "loja", name: "Mercadinho", icon: "🏪", type: "Comércio", description: "Produtos e serviços por perto.", cost: 50000, material: 20, effect: "services" },
  { id: "escola", name: "Escola", icon: "🏫", type: "Educação", description: "Conhecimento para todos.", cost: 70000, material: 30, effect: "knowledge" },
  { id: "parque", name: "Parque", icon: "🌳", type: "Lazer", description: "Mais verde e diversão.", cost: 45000, material: 25, effect: "happiness" },
  { id: "fabrica", name: "Fábrica", icon: "🏭", type: "Indústria", description: "Empregos e produção local.", cost: 90000, material: 45, effect: "money" }
];

function createStudySeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000);
}

function loadSoundPreference() {
  try {
    return localStorage.getItem("cidade-em-construcao-audio-v1") !== "false";
  } catch (error) {
    console.warn("Não foi possível ler a preferência de áudio.", error);
    return true;
  }
}

const initialState = {
  economyVersion: 2,
  money: 250000, population: 24, materials: 120, happiness: 72, knowledge: 0,
  built: [{ id: "prefeitura", name: "Prefeitura", icon: "🏛️", type: "cityhall", cell: 7 }],
  day: 18, month: 3, completedMissions: 0, expanded: false,
  bank: { accountNumber: null, openedAt: null, loan: null, transactions: [] },
  payroll: { employeeCount: 3, weeklySalaryCents: 50000, teacherCount: 0, teacherWeeklySalaryCents: 80000, daysUntilPayment: 7, paymentsMade: 0 },
  education: { consecutiveMistakes: 0 },
  disasters: { daysUntilEvent: 7 + Math.floor(Math.random() * 8), eventsTriggered: 0 },
  study: { challengeCursor: 0, financeCursor: 0, seed: createStudySeed() }
};
const saveKey = "cidade-em-construcao-v1";
const buildingById = new Map(buildings.map((building) => [building.id, building]));
let state = loadGuestState();
let cloudUser = null;
let cloudReady = false;
let clockSyncing = false;
let clockSyncError = false;
let serverTimeAtSync = null;
let monotonicTimeAtSync = 0;
let cloudSaveFailed = false;
let cloudMoneyBase = null;
let cloudMaterialsBase = null;
let cloudPendingSave = null;
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
let audioContext = null;
let audioSupportWarningShown = false;
let soundEnabled = loadSoundPreference();

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
    if (!Number.isSafeInteger(candidate[field])) return null;
    if (field === "money" ? economyVersion === 1 && candidate[field] < 0 : candidate[field] < 0) return null;
  }
  if (candidate.happiness > 100 || candidate.day < 1 || candidate.day > 31 || candidate.month < 1 || candidate.month > 12 || typeof candidate.expanded !== "boolean") return null;
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
  const challengeCursor = Number.isSafeInteger(study.challengeCursor) && study.challengeCursor >= 0
    ? study.challengeCursor : 0;
  const financeCursorValue = study.financeCursor ?? study.questionCursor;
  const financeCursor = Number.isSafeInteger(financeCursorValue) && financeCursorValue >= 0
    ? financeCursorValue : 0;
  const seed = Number.isInteger(study.seed) && study.seed >= 0
    ? study.seed >>> 0 : initialState.study.seed;
  const savedPayroll = candidate.payroll && typeof candidate.payroll === "object" ? candidate.payroll : {};
  const payroll = {
    employeeCount: Number.isSafeInteger(savedPayroll.employeeCount) && savedPayroll.employeeCount >= 0
      ? savedPayroll.employeeCount : initialState.payroll.employeeCount,
    weeklySalaryCents: Number.isSafeInteger(savedPayroll.weeklySalaryCents) && savedPayroll.weeklySalaryCents >= 0
      ? savedPayroll.weeklySalaryCents : initialState.payroll.weeklySalaryCents,
    teacherCount: Number.isSafeInteger(savedPayroll.teacherCount) && savedPayroll.teacherCount >= 0
      ? savedPayroll.teacherCount : 0,
    teacherWeeklySalaryCents: Number.isSafeInteger(savedPayroll.teacherWeeklySalaryCents) && savedPayroll.teacherWeeklySalaryCents >= 0
      ? savedPayroll.teacherWeeklySalaryCents : initialState.payroll.teacherWeeklySalaryCents,
    daysUntilPayment: Number.isSafeInteger(savedPayroll.daysUntilPayment) && savedPayroll.daysUntilPayment >= 1 && savedPayroll.daysUntilPayment <= 7
      ? savedPayroll.daysUntilPayment : initialState.payroll.daysUntilPayment,
    paymentsMade: Number.isSafeInteger(savedPayroll.paymentsMade) && savedPayroll.paymentsMade >= 0
      ? savedPayroll.paymentsMade : initialState.payroll.paymentsMade
  };
  const savedEducation = candidate.education && typeof candidate.education === "object" ? candidate.education : {};
  const education = {
    consecutiveMistakes: Number.isSafeInteger(savedEducation.consecutiveMistakes) && savedEducation.consecutiveMistakes >= 0
      ? savedEducation.consecutiveMistakes : 0
  };
  const savedDisasters = candidate.disasters && typeof candidate.disasters === "object" ? candidate.disasters : {};
  const disasters = {
    daysUntilEvent: Number.isSafeInteger(savedDisasters.daysUntilEvent) && savedDisasters.daysUntilEvent >= 1 && savedDisasters.daysUntilEvent <= 14
      ? savedDisasters.daysUntilEvent : initialState.disasters.daysUntilEvent,
    eventsTriggered: Number.isSafeInteger(savedDisasters.eventsTriggered) && savedDisasters.eventsTriggered >= 0
      ? savedDisasters.eventsTriggered : 0
  };
  return {
    ...initialState,
    ...Object.fromEntries(numericFields.map((field) => [field, field === "money" ? normalizedMoney : candidate[field]])),
    economyVersion: 2,
    expanded: candidate.expanded,
    built,
    bank: { accountNumber, openedAt: typeof bank.openedAt === "string" ? bank.openedAt : null, loan, transactions },
    payroll,
    education,
    disasters,
    study: { challengeCursor, financeCursor, seed }
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
function queueCloudSave() {
  cloudWrite = cloudWrite.then(async () => {
    try {
      if (!cloudPendingSave) {
        cloudPendingSave = {
          operationId: createSaveOperationId(),
          snapshot: structuredClone(state),
          baseMoney: cloudMoneyBase,
          baseMaterials: cloudMaterialsBase
        };
      }
      const request = cloudPendingSave;
      const snapshot = request.snapshot;
      const saved = await window.supabaseGame.saveCity(
        "Vila das Flores",
        snapshot,
        request.baseMoney,
        request.baseMaterials,
        request.operationId
      );
      if (!Number.isSafeInteger(saved?.game_state?.money)
        || !Number.isSafeInteger(saved?.game_state?.materials)) {
        throw new Error("O Supabase retornou saldos inválidos ao salvar.");
      }
      const outstandingMoney = state.money - snapshot.money;
      const outstandingMaterials = state.materials - snapshot.materials;
      cloudMoneyBase = saved.game_state.money;
      cloudMaterialsBase = saved.game_state.materials;
      state.money = cloudMoneyBase + outstandingMoney;
      state.materials = Math.max(0, cloudMaterialsBase + outstandingMaterials);
      cloudPendingSave = null;
      updateEconomyDisplays();
      byId("materials-value").textContent = formatNumber(state.materials);
      cloudSaveFailed = false;
    } catch (error) {
      const firstFailure = !cloudSaveFailed;
      cloudSaveFailed = true;
      clockSyncError = true;
      if (firstFailure) {
        console.error("Não foi possível sincronizar a cidade com o Supabase.", error);
        showToast("Falha ao sincronizar com o Supabase. Seu progresso online pode estar desatualizado.");
      }
      updateServerClockDisplay();
    }
  });
  return cloudWrite;
}
function createSaveOperationId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
function save() {
  if (cloudUser) {
    if (!cloudReady) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(() => {
      cloudSaveTimer = undefined;
      queueCloudSave();
    }, 500);
    return;
  }
  try { localStorage.setItem(saveKey, JSON.stringify(state)); }
  catch (error) { console.error("Não foi possível salvar o progresso local.", error); showToast("Não foi possível salvar. Verifique o espaço disponível no navegador."); }
}
function formatNumber(number) { return new Intl.NumberFormat("pt-BR").format(number); }
function formatBRL(cents) { return window.financeQuestionBank.formatMoney(cents); }
function requireLiveCity() {
  if (cloudUser && cloudReady && !clockSyncing) return true;
  if (!cloudUser) {
    showToast("Entre na sua conta para jogar com o calendário oficial de Brasília.");
    showAuthModal();
  } else {
    showToast("Aguarde a sincronização do calendário com o Supabase.");
  }
  return false;
}

function updateServerClockDisplay() {
  const date = byId("server-date");
  const time = byId("server-time");
  if (!date || !time) return;
  if (!cloudUser || serverTimeAtSync === null) {
    date.textContent = cloudUser ? "Conectando ao calendário oficial" : "Entre na sua conta para iniciar";
    time.textContent = "Relógio oficial do Supabase · Brasília";
    byId("clock-status").textContent = cloudUser ? "Reconecte ao Supabase" : "Faça login para jogar";
    byId("clock-login-button").textContent = cloudUser ? "Reconectar calendário" : "Entrar para jogar";
    byId("clock-login-button").classList.toggle("hidden", cloudReady && !clockSyncError);
    return;
  }

  const now = new Date(serverTimeAtSync + (performance.now() - monotonicTimeAtSync));
  date.textContent = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);
  time.textContent = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now) + " · Horário de Brasília";
  byId("clock-status").textContent = clockSyncing
    ? "Sincronizando…"
    : clockSyncError ? "Sem conexão com o calendário" : "Relógio Supabase";
  byId("clock-login-button").textContent = "Tentar sincronizar";
  byId("clock-login-button").classList.toggle("hidden", cloudReady && !clockSyncError);
}

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
      tile.disabled = !cloudReady;
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
    card.innerHTML = `<div class="build-card-head"><span class="build-icon">${building.icon}</span><span class="build-type">${building.type}</span></div><h3>${building.name}</h3><p>${building.description}</p><div class="build-meta"><span class="cost"><b>${formatBRL(building.cost)}</b> · ${building.material} mat.</span><button class="build-action" ${canAfford && cloudReady ? "" : "disabled"}>Construir</button></div>`;
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
  byId("bank-account-closed").querySelector("button").disabled = accountOpen || !cloudReady;

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
  updateLibraryCounter();
}

function updateLibraryCounter() {
  const remaining = Math.max(0, window.studyQuestionBank.poolSize - state.study.challengeCursor);
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
  updateServerClockDisplay();
  byId("practice-interest").disabled = !cloudReady;
  byId("open-bank-account").disabled = !cloudReady || Boolean(state.bank.accountNumber);
  byId("loan-amount").disabled = !cloudReady;
  byId("loan-method").disabled = !cloudReady;
  byId("loan-term").disabled = !cloudReady;
  byId("request-loan").disabled = !cloudReady;
  byId("money-value").textContent = formatBRL(state.money);
  updatePayrollDisplay();
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

function updatePayrollDisplay() {
  const total = state.payroll.employeeCount * state.payroll.weeklySalaryCents
    + state.payroll.teacherCount * state.payroll.teacherWeeklySalaryCents;
  byId("payroll-employee-count").textContent = formatNumber(state.payroll.employeeCount);
  byId("payroll-weekly-wage").textContent = formatBRL(state.payroll.weeklySalaryCents);
  byId("payroll-teacher-count").textContent = formatNumber(state.payroll.teacherCount);
  byId("payroll-weekly-total").textContent = formatBRL(total);
  byId("payroll-next-payment").textContent = state.payroll.daysUntilPayment === 1
    ? "Amanhã"
    : `Em ${state.payroll.daysUntilPayment} dias`;
  byId("next-disaster-counter").textContent = cloudReady
    ? `Possível em ${state.disasters.daysUntilEvent} dias`
    : "Aguardando login";
}

function updateEconomyDisplays() {
  byId("money-value").textContent = formatBRL(state.money);
  if (state.bank.accountNumber) {
    byId("bank-balance").textContent = formatBRL(state.money);
    renderBank();
  }
  renderBuildings();
}

function playAlertSound(type) {
  if (!soundEnabled) return;
  const AudioContextType = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextType) {
    if (!audioSupportWarningShown) console.warn("Este navegador não oferece suporte a sons do jogo.");
    audioSupportWarningShown = true;
    return;
  }

  const patterns = {
    correct: [{ frequency: 660, delay: 0 }, { frequency: 880, delay: 0.12 }],
    wrong: [{ frequency: 220, delay: 0 }, { frequency: 165, delay: 0.15 }],
    disaster: [{ frequency: 330, delay: 0 }, { frequency: 247, delay: 0.18 }, { frequency: 196, delay: 0.36 }],
    teacher: [{ frequency: 523, delay: 0 }, { frequency: 659, delay: 0.14 }, { frequency: 784, delay: 0.28 }]
  };

  try {
    audioContext ||= new AudioContextType();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch((error) => console.warn("Não foi possível iniciar o áudio do jogo.", error));
    }
    const now = audioContext.currentTime;
    for (const note of patterns[type]) {
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      const start = now + note.delay;
      oscillator.type = type === "wrong" || type === "disaster" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(note.frequency, start);
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.13);
    }
  } catch (error) {
    console.warn("Não foi possível reproduzir o alerta sonoro.", error);
  }
}

function startQuiz(building) {
  if (!requireLiveCity()) return;
  if (state.money < building.cost || state.materials < building.material) {
    showToast("Recursos insuficientes para esta construção.");
    return;
  }
  try {
    const question = window.studyQuestionBank.nextQuestion(state.study.challengeCursor, state.study.seed);
    state.study.challengeCursor = question.nextCursor;
    updateLibraryCounter();
    selectedBuilding = building;
    activeQuiz = { ...question, answer: question.correctIndex, explain: question.explanation };
    showCityQuiz(question, building.icon, `Desafio: ${building.name}`, `Resolva o desafio de ${question.subject.toLowerCase()} para construir ${building.name.toLowerCase()} na cidade.`, "building");
  } catch (error) {
    console.error("Não foi possível gerar outro desafio de estudos.", error);
    showToast(error.message || "Não foi possível gerar um desafio de estudos.");
  }
}

function showCityQuiz(question, icon, title, intro, type) {
  selectedAnswer = null;
  activeQuiz.type = type;
  activeQuiz.hintUsed = false;
  byId("quiz-teacher-hint-button").disabled = false;
  byId("quiz-teacher-hint-button").textContent = "💡 Pedir dica à professora";
  byId("quiz-teacher-hint").classList.add("hidden");
  updateTeacherSupport();
  byId("quiz-subject").textContent = question.subject;
  byId("quiz-building-icon").textContent = icon;
  byId("quiz-title").textContent = title;
  byId("quiz-intro").textContent = intro;
  byId("quiz-question").textContent = question.question;
  byId("quiz-feedback").textContent = "";
  byId("quiz-feedback").className = "quiz-feedback";
  byId("quiz-submit").disabled = true;
  const options = byId("quiz-options");
  options.replaceChildren();
  question.options.forEach((option, index) => {
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
  save();
}

function startExpansionQuiz() {
  if (!requireLiveCity()) return;
  if (state.expanded) return;
  try {
    const question = window.studyQuestionBank.nextQuestion(state.study.challengeCursor, state.study.seed);
    state.study.challengeCursor = question.nextCursor;
    updateLibraryCounter();
    selectedBuilding = null;
    activeQuiz = { ...question, answer: question.correctIndex, explain: question.explanation };
    showCityQuiz(question, "🗺️", "Desbloquear nova região", `Mostre o que aprendeu em ${question.subject.toLowerCase()} para expandir sua cidade.`, "expansion");
  } catch (error) {
    console.error("Não foi possível gerar outro desafio de estudos.", error);
    showToast(error.message || "Não foi possível gerar um desafio de estudos.");
  }
}

function closeQuiz() {
  byId("quiz-modal").classList.add("hidden");
  byId("quiz-modal").setAttribute("aria-hidden", "true");
  byId("quiz-teacher-offer").classList.add("hidden");
  byId("quiz-teacher-hint-button").classList.add("hidden");
  byId("quiz-teacher-hint").classList.add("hidden");
}

function showFinanceQuestion(purpose, preferredMethod, loanOffer = null) {
  if (!requireLiveCity()) return;
  try {
    const isLoan = purpose === "loan";
    const question = isLoan
      ? window.financeQuestionBank.nextQuestion(state.study.financeCursor, state.study.seed, preferredMethod)
      : window.studyQuestionBank.nextQuestion(state.study.challengeCursor, state.study.seed);
    if (isLoan) state.study.financeCursor = question.nextCursor;
    else {
      state.study.challengeCursor = question.nextCursor;
      updateLibraryCounter();
    }
    activeFinanceQuestion = { question, purpose, loanOffer };
    byId("finance-teacher-hint-button").disabled = false;
    byId("finance-teacher-hint-button").textContent = "💡 Pedir dica à professora";
    byId("finance-teacher-hint").classList.add("hidden");
    updateTeacherSupport();
    selectedAnswer = null;
    byId("finance-subject").textContent = question.subject;
    byId("finance-sequence").textContent = isLoan
      ? `JUROS · DESAFIO ${formatNumber(question.nextCursor)} DE ${formatNumber(question.poolSize)}`
      : `ASSUNTOS VARIADOS · ${formatNumber(question.nextCursor)} DE ${formatNumber(question.poolSize)}`;
    byId("finance-title").textContent = isLoan ? "Desafio para liberar crédito" : "Desafio de estudos";
    byId("finance-icon").textContent = isLoan
      ? (question.method === "simple" ? "🧮" : "📈")
      : "📚";
    byId("finance-intro").textContent = purpose === "loan"
      ? `Você pediu ${formatBRL(loanOffer.amountCents)} com ${loanOffer.method === "simple" ? "juros simples" : "juros compostos"}. Resolva o desafio desse tipo de juros para liberar o crédito.`
      : "Os desafios alternam entre Matemática, Português, Ciências, Geografia, História, Meio Ambiente e Cidadania.";
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
  if (!requireLiveCity()) return;
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
  if (!requireLiveCity()) return;
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
  byId("finance-teacher-offer").classList.add("hidden");
  byId("finance-teacher-hint-button").classList.add("hidden");
  byId("finance-teacher-hint").classList.add("hidden");
  activeFinanceQuestion = null;
  pendingLoanOffer = null;
}

function updateTeacherSupport() {
  const employed = state.payroll.teacherCount > 0;
  for (const prefix of ["quiz", "finance"]) {
    byId(`${prefix}-teacher-offer`).classList.toggle("hidden", employed || state.education.consecutiveMistakes < 5);
    byId(`${prefix}-teacher-hint-button`).classList.toggle("hidden", !employed);
  }
}

function registerWrongAnswer(modal, feedback) {
  state.money -= 30000;
  state.education.consecutiveMistakes++;
  recordTransaction("Penalidade por resposta incorreta", -30000);
  playAlertSound("wrong");
  feedback.textContent = `Resposta incorreta: foram descontados R$ 300,00. Erros seguidos: ${state.education.consecutiveMistakes}. Tente novamente.`;
  feedback.className = "quiz-feedback";
  selectedAnswer = null;
  byId(`${modal}-submit`).disabled = true;
  updateEconomyDisplays();
  updateTeacherSupport();
  if (state.education.consecutiveMistakes === 5 && state.payroll.teacherCount === 0) {
    window.setTimeout(() => playAlertSound("teacher"), 350);
  }
  save();
}

function hireTeacher(modal) {
  if (!requireLiveCity()) return;
  if (state.payroll.teacherCount > 0 || state.education.consecutiveMistakes < 5) return;
  state.payroll.teacherCount = 1;
  state.education.consecutiveMistakes = 0;
  byId(`${modal}-teacher-offer`).classList.add("hidden");
  byId(`${modal}-teacher-hint-button`).classList.remove("hidden");
  recordTransaction("Contratação de professora — salário semanal", 0);
  updatePayrollDisplay();
  save();
  showToast("Professora contratada! Ela recebe R$ 800,00 por semana e pode dar uma dica em cada desafio.");
}

function declineTeacher(modal) {
  if (!requireLiveCity()) return;
  state.education.consecutiveMistakes = 0;
  byId(`${modal}-teacher-offer`).classList.add("hidden");
  save();
}

function requestTeacherHint(modal) {
  if (!requireLiveCity()) return;
  const question = modal === "quiz" ? activeQuiz : activeFinanceQuestion?.question;
  if (!question || state.payroll.teacherCount === 0) return;
  const used = modal === "quiz" ? activeQuiz.hintUsed : activeFinanceQuestion.hintUsed;
  if (used) return;

  const hints = {
    "MATEMÁTICA": "Separe os números importantes do enunciado e escolha a operação que relaciona esses dados.",
    "PORTUGUÊS": "Leia a frase em voz alta e observe a concordância, a pontuação e o sentido das palavras.",
    "CIÊNCIAS": "Pense no conceito científico ligado ao fenômeno ou ser vivo citado.",
    "GEOGRAFIA": "Observe as características do lugar, a orientação e a relação entre as pessoas e o espaço.",
    "HISTÓRIA": "Repare nas datas, na ordem dos acontecimentos e no contexto da época.",
    "MEIO AMBIENTE": "Considere como cada alternativa afeta os recursos naturais e os seres vivos.",
    "CIDADANIA": "Pense no bem comum, nos direitos das pessoas e nos serviços da comunidade.",
    "MATEMÁTICA FINANCEIRA": "Identifique o capital, a taxa e o prazo. Em juros compostos, a taxa incide sobre o montante acumulado."
  };
  const subject = question.subject;
  const hintId = `${modal}-teacher-hint`;
  const button = byId(`${modal}-teacher-hint-button`);
  byId(hintId).textContent = hints[subject] || "Releia o enunciado, identifique o que está sendo perguntado e elimine as alternativas que não combinam.";
  byId(hintId).classList.remove("hidden");
  button.disabled = true;
  button.textContent = "Dica usada neste desafio";
  if (modal === "quiz") activeQuiz.hintUsed = true;
  else activeFinanceQuestion.hintUsed = true;
}

function submitFinanceAnswer() {
  if (!requireLiveCity()) return;
  if (!activeFinanceQuestion || selectedAnswer === null) return;
  const { question, purpose, loanOffer } = activeFinanceQuestion;
  const feedback = byId("finance-feedback");
  if (selectedAnswer !== question.correctIndex) {
    registerWrongAnswer("finance", feedback);
    return;
  }

  state.education.consecutiveMistakes = 0;
  playAlertSound("correct");
  updateTeacherSupport();
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
      contractId: globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
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
    recordTransaction(`Aprendizado: ${question.subject.toLowerCase()}`, 0);
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

function submitAnswer() {
  if (!requireLiveCity()) return;
  if (selectedAnswer === null || !activeQuiz || (!selectedBuilding && activeQuiz.type !== "expansion")) return;
  const feedback = byId("quiz-feedback");
  if (selectedAnswer !== activeQuiz.answer) {
    registerWrongAnswer("quiz", feedback);
    return;
  }
  state.education.consecutiveMistakes = 0;
  playAlertSound("correct");
  updateTeacherSupport();
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

function updateSoundToggle() {
  const button = byId("sound-toggle");
  button.classList.toggle("sound-off", !soundEnabled);
  button.textContent = soundEnabled ? "♫" : "🔇";
  button.title = soundEnabled ? "Desativar sons" : "Ativar sons";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(soundEnabled));
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
  byId("auth-title").textContent = signingUp ? "Crie sua conta de prefeito(a)" : "Entre para iniciar o calendário";
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
  cloudSaveFailed = false;
  clockSyncError = false;
  cloudMoneyBase = null;
  cloudMaterialsBase = null;
  cloudPendingSave = null;
  serverTimeAtSync = null;
  setAccountButton();
  const city = await window.supabaseGame.loadCity(user.id);
  if (city) {
    if (city.state_version !== 1) throw new Error("O formato do progresso precisa ser atualizado antes de carregar.");
    const loadedState = normalizeState(city.game_state);
    if (!loadedState) throw new Error("O progresso salvo tem um formato inválido. Nenhuma alteração foi gravada.");
    state = loadedState;
  }

  cloudMoneyBase = state.money;
  cloudMaterialsBase = state.materials;
  const saved = await window.supabaseGame.saveCity(
    "Vila das Flores",
    structuredClone(state),
    cloudMoneyBase,
    cloudMaterialsBase,
    createSaveOperationId()
  );
  cloudMoneyBase = saved.game_state.money;
  cloudMaterialsBase = saved.game_state.materials;
  const clock = await window.supabaseGame.syncCityClock();
  const syncedState = normalizeState(clock.game_state);
  if (!syncedState) throw new Error("O Supabase retornou um estado de cidade inválido.");
  state = syncedState;
  cloudMoneyBase = state.money;
  cloudMaterialsBase = state.materials;
  serverTimeAtSync = new Date(clock.server_now).getTime();
  monotonicTimeAtSync = performance.now();
  clockSyncError = false;
  cloudReady = true;
  render();
  closeAuthModal();
  showToast(city ? "Cidade carregada da sua conta Supabase." : "Conta conectada! Sua nova cidade está salva no Supabase.");
  announceClockCatchUp(clock);
}

function announceClockCatchUp(clock) {
  const processedDays = Number.isSafeInteger(clock.processed_days) ? clock.processed_days : 0;
  const events = Array.isArray(clock.events) ? clock.events : [];
  if (events.some((event) => event.type === "disaster")) playAlertSound("disaster");
  if (processedDays > 0) {
    const summary = events.map((event) => event.message).join(" ");
    showToast(`Calendário atualizado: ${processedDays} dia(s) processado(s). ${summary}`);
  }
}

async function synchronizeServerClock() {
  if (!cloudUser || !cloudReady || clockSyncing) return;
  clockSyncing = true;
  updateServerClockDisplay();
  try {
    const hadPendingSave = cloudSaveTimer !== undefined;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = undefined;
    if (hadPendingSave) await queueCloudSave();
    if (cloudSaveFailed && !hadPendingSave) await queueCloudSave();
    await cloudWrite;
    if (cloudSaveFailed) throw new Error("O progresso pendente não foi salvo; calendário não aplicado para evitar perda de dados.");

    const clock = await window.supabaseGame.syncCityClock();
    const syncedState = normalizeState(clock.game_state);
    if (!syncedState) throw new Error("O Supabase retornou um estado de cidade inválido.");
    state = syncedState;
    cloudMoneyBase = state.money;
    cloudMaterialsBase = state.materials;
    serverTimeAtSync = new Date(clock.server_now).getTime();
    monotonicTimeAtSync = performance.now();
    clockSyncError = false;
    cloudReady = true;
    render();
    announceClockCatchUp(clock);
  } catch (error) {
    const firstFailure = !clockSyncError;
    const saveFailed = cloudSaveFailed;
    if (firstFailure) console.error("Não foi possível sincronizar o calendário com o Supabase.", error);
    clockSyncError = true;
    if (firstFailure && !saveFailed) {
      showToast("Não foi possível atualizar o calendário. Ele será sincronizado quando a conexão voltar.");
    }
  } finally {
    clockSyncing = false;
    updateServerClockDisplay();
  }
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
    if (clockSyncing) {
      showToast("Aguarde a sincronização do calendário antes de sair.");
      return;
    }
    window.clearTimeout(cloudSaveTimer);
    if (cloudReady) await queueCloudSave();
    await cloudWrite;
    if (cloudSaveFailed) throw new Error("O progresso não foi sincronizado; entre novamente em contato com o servidor antes de sair.");
    await window.supabaseGame.signOut();
    cloudUser = null;
    cloudReady = false;
    cloudSaveFailed = false;
    cloudMoneyBase = null;
    cloudMaterialsBase = null;
    cloudPendingSave = null;
    clockSyncError = false;
    serverTimeAtSync = null;
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
byId("quiz-hire-teacher").addEventListener("click", () => hireTeacher("quiz"));
byId("quiz-decline-teacher").addEventListener("click", () => declineTeacher("quiz"));
byId("quiz-teacher-hint-button").addEventListener("click", () => requestTeacherHint("quiz"));
byId("quiz-modal").addEventListener("click", (event) => { if (event.target === byId("quiz-modal")) closeQuiz(); });
byId("open-bank-account").addEventListener("click", openBankAccount);
byId("loan-form").addEventListener("submit", requestLoan);
["loan-amount", "loan-method", "loan-term"].forEach((id) => {
  byId(id).addEventListener("change", updateLoanPreview);
});
byId("practice-interest").addEventListener("click", () => showFinanceQuestion("practice", null));
byId("close-finance").addEventListener("click", closeFinanceQuestion);
byId("finance-submit").addEventListener("click", submitFinanceAnswer);
byId("finance-hire-teacher").addEventListener("click", () => hireTeacher("finance"));
byId("finance-decline-teacher").addEventListener("click", () => declineTeacher("finance"));
byId("finance-teacher-hint-button").addEventListener("click", () => requestTeacherHint("finance"));
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
byId("clock-login-button").addEventListener("click", () => {
  if (!cloudUser) {
    showAuthModal();
    return;
  }
  if (!cloudReady) {
    activateUser(cloudUser).catch((error) => {
      console.error("Não foi possível reconectar a cidade.", error);
      showToast("Não foi possível reconectar ao Supabase. Tente novamente.");
    });
    return;
  }
  synchronizeServerClock();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") synchronizeServerClock();
});
window.addEventListener("focus", synchronizeServerClock);
window.setInterval(updateServerClockDisplay, 1000);
window.setInterval(synchronizeServerClock, 60_000);
byId("map-toggle").addEventListener("click", () => showToast("Visão geral da sua cidade."));
byId("show-all").addEventListener("click", () => showToast("Mais construções serão desbloqueadas conforme sua cidade cresce."));
byId("learn-more").addEventListener("click", () => {
  const tips = ["Uma casa nova pode abrigar até 8 moradores. Planeje bem para sua cidade crescer!", "Escolas geram conhecimento: ele abre portas para novas áreas e oportunidades.", "Parques deixam a cidade mais feliz. Uma população contente ajuda o comércio local!"];
  const index = Math.floor(Math.random() * tips.length);
  byId("advisor-tip").textContent = tips[index];
});
byId("sound-toggle").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem("cidade-em-construcao-audio-v1", String(soundEnabled));
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de áudio.", error);
  }
  updateSoundToggle();
  if (soundEnabled) playAlertSound("correct");
  showToast(soundEnabled ? "Sons ativados." : "Sons desativados.");
});
render();
setAccountButton();
updateSoundToggle();
updateInstallButton();
registerServiceWorker();
initializeSupabase();
