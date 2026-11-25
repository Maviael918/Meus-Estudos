(function () {
  const methods = ["simple", "compound"];
  const focuses = ["total", "interest", "installment"];
  const principals = Array.from({ length: 991 }, (_, index) => (500 + index * 50) * 100);
  const monthlyRates = Array.from({ length: 46 }, (_, index) => 50 + index * 10);
  const periods = [2, 3, 4, 6, 8, 10, 12, 18, 24, 36];
  const dimensions = [methods, focuses, principals, monthlyRates, periods];
  const poolSize = dimensions.reduce((size, values) => size * values.length, 1);
  const focusLabels = {
    total: "o valor total ao final",
    interest: "o valor pago somente em juros",
    installment: "o valor aproximado de cada parcela igual"
  };

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

  function permutation(values, coordinate, seed, dimension) {
    const length = values.length;
    const dimensionHash = hash(seed, dimension);
    let multiplier = (dimensionHash % length) || 1;
    while (gcd(multiplier, length) !== 1) multiplier = (multiplier + 1) % length || 1;
    const offset = hash(dimensionHash, dimension + 11) % length;
    return values[(coordinate * multiplier + offset) % length];
  }

  function formatMoney(cents) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(cents / 100);
  }

  function calculateTotal(principalCents, monthlyRateBps, months, method) {
    const monthlyRate = monthlyRateBps / 10000;
    const total = method === "simple"
      ? principalCents * (1 + monthlyRate * months)
      : principalCents * (1 + monthlyRate) ** months;
    return Math.round(total);
  }

  function calculateLoan(principalCents, monthlyRateBps, months, method) {
    if (!Number.isSafeInteger(principalCents) || principalCents < 1
      || !Number.isSafeInteger(monthlyRateBps) || monthlyRateBps < 1
      || !Number.isSafeInteger(months) || months < 1
      || !methods.includes(method)) {
      throw new Error("Os dados do empréstimo são inválidos.");
    }
    const totalCents = calculateTotal(principalCents, monthlyRateBps, months, method);
    return {
      principalCents,
      interestCents: totalCents - principalCents,
      totalCents,
      installmentCents: Math.round(totalCents / months)
    };
  }

  function buildOptions(correctCents, alternateCents, seed, cursor) {
    const offsets = [0.12, -0.15, 0.2, -0.25, 0.35, -0.4];
    const wrongAnswers = [alternateCents, correctCents - 500, correctCents + 700];
    for (const offset of offsets) wrongAnswers.push(Math.round(correctCents * (1 + offset)));
    const uniqueWrongAnswers = [...new Set(wrongAnswers)]
      .filter((value) => Number.isSafeInteger(value) && value >= 1 && value !== correctCents)
      .slice(0, 3);
    while (uniqueWrongAnswers.length < 3) {
      const value = correctCents + (uniqueWrongAnswers.length + 1) * 1003;
      if (!uniqueWrongAnswers.includes(value) && value !== correctCents) uniqueWrongAnswers.push(value);
    }

    const correctPosition = hash(seed, cursor + 31) % 4;
    const options = uniqueWrongAnswers;
    options.splice(correctPosition, 0, correctCents);
    return { options, correctIndex: correctPosition };
  }

  function nextQuestion(cursor, seed, preferredMethod) {
    if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor >= poolSize) {
      throw new Error("Todos os desafios exclusivos desta biblioteca já foram utilizados.");
    }
    if (!Number.isInteger(seed) || seed < 0) {
      throw new Error("A biblioteca de desafios precisa de uma semente válida.");
    }

    let remainder = cursor;
    const coordinates = dimensions.map((values) => {
      const coordinate = remainder % values.length;
      remainder = Math.floor(remainder / values.length);
      return coordinate;
    });
    const [method, focus, principalCents, monthlyRateBps, months] = dimensions
      .map((values, dimension) => permutation(values, coordinates[dimension], seed, dimension));

    if (preferredMethod && method !== preferredMethod) {
      for (let nextCursor = cursor + 1; nextCursor < poolSize; nextCursor++) {
        const nextCoordinates = [];
        let nextRemainder = nextCursor;
        dimensions.forEach((values) => {
          nextCoordinates.push(nextRemainder % values.length);
          nextRemainder = Math.floor(nextRemainder / values.length);
        });
        const nextMethod = permutation(methods, nextCoordinates[0], seed, 0);
        if (nextMethod === preferredMethod) return nextQuestion(nextCursor, seed, preferredMethod);
      }
      throw new Error("Não há mais desafios exclusivos para este tipo de juros.");
    }

    const totalCents = calculateTotal(principalCents, monthlyRateBps, months, method);
    const interestCents = totalCents - principalCents;
    const valuesByFocus = {
      total: {
        correct: totalCents,
        alternate: calculateTotal(principalCents, monthlyRateBps, months, method === "simple" ? "compound" : "simple")
      },
      interest: {
        correct: interestCents,
        alternate: principalCents * monthlyRateBps * months / 10000
      },
      installment: {
        correct: Math.round(totalCents / months),
        alternate: Math.round(principalCents / months)
      }
    };
    const values = valuesByFocus[focus];
    const { options, correctIndex } = buildOptions(values.correct, values.alternate, seed, cursor);
    const methodLabel = method === "simple" ? "juros simples" : "juros compostos";
    const rateLabel = (monthlyRateBps / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    const id = `${method}:${focus}:${principalCents}:${monthlyRateBps}:${months}`;

    return {
      id,
      method,
      focus,
      principalCents,
      monthlyRateBps,
      months,
      correctIndex,
      poolSize,
      nextCursor: cursor + 1,
      subject: "MATEMÁTICA FINANCEIRA",
      question: `Uma prefeitura aplica ${formatMoney(principalCents)} em um empréstimo com ${methodLabel} de ${rateLabel}% ao mês durante ${months} meses. Qual é ${focusLabels[focus]}?`,
      options: options.map(formatMoney),
      explanation: method === "simple"
        ? `Juros simples: J = C × i × t. O juro é ${formatMoney(interestCents)} e o total é ${formatMoney(totalCents)}.`
        : `Juros compostos: M = C × (1 + i)ᵗ. O juro é ${formatMoney(interestCents)} e o total é ${formatMoney(totalCents)}.`
    };
  }

  window.financeQuestionBank = {
    poolSize,
    formatMoney,
    nextQuestion,
    calculateLoan
  };
})();
