// Monte Carlo engine — implements simulation logic per spec §6

function normalRandom(mu, sigma) {
  let u1;
  do { u1 = Math.random(); } while (u1 === 0);
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random());
}

function gammaRandom(shape, scale) {
  if (shape < 1) return gammaRandom(1 + shape, scale) * Math.pow(Math.random(), 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const x = normalRandom(0, 1), v0 = 1 + c * x;
    if (v0 <= 0) continue;
    const v = v0 * v0 * v0, u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}

function quantile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  return sortedArr[Math.min(Math.floor(sortedArr.length * p), sortedArr.length - 1)];
}

function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function computeFloor(account, hwm, equityEOD, phaseCapital) {
  if (account.ddType === "static") return phaseCapital - account.ddValue;
  const raw = hwm - account.ddValue;
  switch (account.floorLock) {
    case "none":                 return raw;
    case "at_capital":           return Math.min(raw, phaseCapital);
    case "at_target_level":      return Math.min(raw, phaseCapital + account.target);
    case "at_capital_plus_100":
      if (equityEOD >= phaseCapital + account.ddValue + 100) return phaseCapital + 100;
      return raw;
    default:                     return Math.min(raw, phaseCapital);
  }
}

function simulateSinglePhase(account, strategy, phaseCapital) {
  let equity      = phaseCapital;
  let hwm         = phaseCapital;
  let floor       = phaseCapital - account.ddValue;
  let totalProfit = 0;
  let bestDay     = 0;
  let dias        = 0;
  let floorLocked = false;
  const TOPE      = 5000;

  while (dias < TOPE) {
    dias++;

    if (account.maxDays && dias > account.maxDays) return { result: "TIMEOUT", dias };

    const isWin = Math.random() < strategy.wr;
    let pnl = isWin
      ? normalRandom(strategy.muWin,  strategy.sigmaWin)
      : normalRandom(strategy.muLoss, strategy.sigmaLoss);
    if (Math.random() < strategy.tailProb) pnl *= strategy.tailMult;

    const maeScale = pnl > 0
      ? Math.max(strategy.sigmaWin  * strategy.maeWin,  1)
      : Math.max(strategy.sigmaLoss * strategy.maeLoss, 1);
    const mae = pnl > 0
      ? gammaRandom(2.0, maeScale)
      : Math.abs(pnl) + gammaRandom(1.5, maeScale);

    // MFE raises floor mid-day for intraday trailing
    if (account.ddType === "trailing_intraday" && pnl > 0 && !floorLocked) {
      const mfe = pnl + gammaRandom(1.5, Math.max(strategy.sigmaWin * 0.15, 1));
      const peakEquity = equity + mfe;
      if (peakEquity > hwm) {
        hwm = peakEquity;
        const newFloor = computeFloor(account, hwm, equity, phaseCapital);
        floor = Math.max(floor, newFloor);
      }
    }

    // Intraday MAE check against current floor (applies to all DD types)
    if (equity - mae <= floor) return { result: "DD", dias };

    // DLL
    if (account.dailyLoss && pnl <= -account.dailyLoss) {
      if (account.dailyLossIsFatal) return { result: "DLL", dias };
      pnl = -account.dailyLoss;
    }

    equity += pnl;

    if (equity <= floor) return { result: "DD", dias };

    if (account.ddType !== "static" && !floorLocked) {
      if (equity > hwm) hwm = equity;
      if (account.floorLock === "at_capital_plus_100" &&
          equity >= phaseCapital + account.ddValue + 100) {
        floorLocked = true;
        floor = phaseCapital + 100;
      } else {
        const newFloor = computeFloor(account, hwm, equity, phaseCapital);
        floor = Math.max(floor, newFloor);
      }
    }

    if (pnl > 0) {
      totalProfit += pnl;
      if (pnl > bestDay) bestDay = pnl;
    }

    let effectiveTarget = account.target;
    let consistencyOK   = true;

    if (account.consistency && account.consistencyType === "vs_target" && bestDay > 0) {
      effectiveTarget = Math.max(account.target, bestDay / account.consistency);
    } else if (account.consistency && account.consistencyType === "vs_total") {
      if (totalProfit > 0) {
        consistencyOK = bestDay <= account.consistency * totalProfit;
      }
    }

    const minDaysMet = dias >= (account.minDays || 0);
    const profitMade = equity - phaseCapital;

    if (profitMade >= effectiveTarget && minDaysMet && consistencyOK) {
      return { result: "PASS", dias };
    }
  }
  return { result: "DD", dias };
}

function simulateAttempt(account, strategy) {
  const r1 = simulateSinglePhase(account, strategy, account.capital);
  if (r1.result !== "PASS") {
    return { result: r1.result, dias: r1.dias, passedPhase1: false };
  }
  if (!account.phases || account.phases === 1) {
    return { result: "PASS", dias: r1.dias, passedPhase1: true };
  }
  const phase2Account = {
    ...account,
    target:  account.phase2.target,
    minDays: account.phase2.minDays ?? 0,
    maxDays: account.phase2.maxDays ?? null,
  };
  const r2 = simulateSinglePhase(phase2Account, strategy, account.capital);
  return {
    result:  r2.result,
    dias:    r1.dias + r2.dias,
    passedPhase1: true,
    phase1Days: r1.dias,
    phase2Days: r2.dias,
  };
}

function makeHistogram(data, bins = 28) {
  if (!data.length) return [];
  const sorted = [...data].sort((a, b) => a - b);
  const p95v = quantile(sorted, 0.95);
  if (p95v === 0) return [];
  const clipped = data.filter(d => d <= p95v);
  const bSz = Math.max(1, Math.ceil(p95v / bins));
  const map = new Map();
  clipped.forEach(d => {
    const b = Math.floor(d / bSz) * bSz;
    map.set(b, (map.get(b) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => a[0] - b[0])
    .map(([day, cnt]) => ({ day, pct: +((cnt / clipped.length) * 100).toFixed(2) }));
}

export function runMonteCarlo(account, strategy, nSims) {
  const N = Math.min(nSims, 25000);
  const diasPass = [], diasFail = [];
  let nPass = 0, nDD = 0, nTimeout = 0, nDLL = 0;

  function baseFeeForAttempt(dias) {
    if (!account.feeType || account.feeType === "one_time") return account.fee;
    return account.fee * Math.ceil(Math.max(dias, 1) / 21);
  }

  let totalCost = 0;

  for (let i = 0; i < N; i++) {
    const r = simulateAttempt(account, strategy);
    const base = baseFeeForAttempt(r.dias);
    const activation = r.result === "PASS" ? (account.activationFee || 0) : 0;
    totalCost += base + activation;

    if      (r.result === "PASS")    { nPass++;    diasPass.push(r.dias); }
    else if (r.result === "TIMEOUT") { nTimeout++; diasFail.push(r.dias); }
    else if (r.result === "DLL")     { nDLL++;     diasFail.push(r.dias); }
    else                             { nDD++;      diasFail.push(r.dias); }
  }

  const pPass    = nPass / N;
  const pDD      = nDD / N;
  const pTimeout = nTimeout / N;
  const pDLL     = nDLL / N;

  const sortedPass = [...diasPass].sort((a, b) => a - b);
  const sortedFail = [...diasFail].sort((a, b) => a - b);
  const avgCost    = totalCost / N;

  const finalTarget = account.phases === 2 ? account.phase2.target : account.target;
  const payout = finalTarget * account.profitSplit;

  const ev = pPass * payout - avgCost;
  const ruinaMin = payout > 0 ? avgCost / payout : 0;

  const pSafe = Math.max(pPass, 1e-9);
  const logFail = Math.log(1 - pSafe);
  const n95 = logFail < 0 ? Math.ceil(Math.log(0.05) / logFail) : Infinity;
  const n99 = logFail < 0 ? Math.ceil(Math.log(0.01) / logFail) : Infinity;
  const medIntentos = logFail < 0 ? Math.max(1, Math.ceil(Math.log(0.5) / logFail)) : Infinity;

  const passEssentiallyZero = pPass < 0.0001;

  const br95 = isFinite(n95) ? Math.round(n95 * avgCost) : Infinity;
  const br99 = isFinite(n99) ? Math.round(n99 * avgCost) : Infinity;

  return {
    pPass, pDD, pTimeout, pDLL, ruinaMin,
    meanPass: mean(diasPass), medianPass: quantile(sortedPass, 0.5), p90Pass: quantile(sortedPass, 0.9),
    meanFail: mean(diasFail), medianFail: quantile(sortedFail, 0.5),
    ev, avgCost, payout, finalTarget,
    n95, n99, br95, br99, medIntentos,
    passEssentiallyZero,
    histPass: makeHistogram(diasPass),
    histFail: makeHistogram(diasFail),
    nPass, nDD, nTimeout, nDLL,
    nSims: N,
  };
}
