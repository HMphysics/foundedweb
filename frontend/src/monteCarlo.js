// Monte Carlo engine — implements simulation logic per spec §6 + v2 extensions
// (bootstrap mode, commissions, behavioral model, instrument-aware MAE, attempt curve)

// ─── Instrument MAE ratios (empirical) ─────────────────────────────────────
export const INSTRUMENT_MAE_RATIOS = {
  nq:      { winScale: 0.91, lossRatio: 2.1, label: "NQ futures" },
  es:      { winScale: 0.75, lossRatio: 1.8, label: "ES futures" },
  cl:      { winScale: 1.10, lossRatio: 2.4, label: "CL futures" },
  gc:      { winScale: 0.85, lossRatio: 2.0, label: "GC futures" },
  eurusd:  { winScale: 0.55, lossRatio: 1.5, label: "EUR/USD forex" },
  gbpusd:  { winScale: 0.60, lossRatio: 1.6, label: "GBP/USD forex" },
  custom:  { winScale: 0.80, lossRatio: 2.0, label: "Custom / Unknown" },
};

// ─── Primitives ────────────────────────────────────────────────────────────
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

// ─── Daily pnl/mae generator ───────────────────────────────────────────────
// Returns { pnl, mae } — accounts for Simple vs Bootstrap, commissions, MAE mode.
function genDay(strategy, sizeFactor) {
  let pnl;
  let bootMae;
  if (strategy.mode === "bootstrap" && strategy.bootstrapData && strategy.bootstrapData.length > 0) {
    const idx = Math.floor(Math.random() * strategy.bootstrapData.length);
    const d = strategy.bootstrapData[idx];
    pnl = d.pnl;
    if (d.mae !== undefined && d.mae !== null) bootMae = d.mae;
  } else {
    const isWin = Math.random() < strategy.wr;
    pnl = isWin
      ? normalRandom(strategy.muWin,  strategy.sigmaWin)
      : normalRandom(strategy.muLoss, strategy.sigmaLoss);
    if (Math.random() < strategy.tailProb) pnl *= strategy.tailMult;
  }
  pnl *= sizeFactor;

  // MAE resolution
  let mae;
  if (bootMae !== undefined) {
    mae = bootMae * sizeFactor;
  } else if (strategy.maeMode === "manual") {
    const baseMae = pnl > 0 ? (strategy.maeWinMean ?? 0) : (strategy.maeLossMean ?? 0);
    const stdMae  = pnl > 0 ? (strategy.maeWinStd  ?? 0) : (strategy.maeLossStd  ?? 0);
    mae = Math.max(0, normalRandom(baseMae, stdMae));
    if (pnl < 0) mae = Math.max(mae, Math.abs(pnl));
  } else {
    // ESTIMATE (default) — instrument ratios, else legacy maeWin/maeLoss scaling
    const inst = INSTRUMENT_MAE_RATIOS[strategy.instrument] || INSTRUMENT_MAE_RATIOS.custom;
    const winScale  = inst.winScale;
    const lossRatio = inst.lossRatio;
    const sigW = Math.max(strategy.sigmaWin  * winScale, 1);
    const sigL = Math.max(strategy.sigmaLoss * 0.3, 1);
    mae = pnl > 0
      ? gammaRandom(2.0, sigW)
      : Math.abs(pnl) * lossRatio + gammaRandom(1.5, sigL);
  }

  // Subtract commissions (applied to net pnl, not MAE)
  const comm = strategy.dailyCommission || 0;
  pnl -= comm * sizeFactor;

  return { pnl, mae };
}

// ─── Single phase simulation ───────────────────────────────────────────────
function simulateSinglePhase(account, strategy, phaseCapital, behavioral) {
  let equity      = phaseCapital;
  let hwm         = phaseCapital;
  let floor       = phaseCapital - account.ddValue;
  let totalProfit = 0;
  let bestDay     = 0;
  let dias        = 0;
  let winningDays = 0;
  let calendarDays = 0;
  let floorLocked = false;
  let sizeFactor  = 1.0;
  const TOPE      = 5000;

  const b = behavioral || {};
  const postConservative  = b.postTargetMode === "conservative";
  const reductionFactor   = b.postTargetSizeReduction ?? 0.30;
  const minDaysType       = b.minDaysType || "total";
  const winDayThreshold   = b.winDayThreshold ?? 50;
  const maxDaysType       = b.maxDaysType || "trading";

  while (dias < TOPE) {
    dias++;
    if (maxDaysType === "calendar") {
      calendarDays = Math.ceil(dias * 1.4);
    }

    const activeMaxDays = maxDaysType === "calendar" ? calendarDays : dias;
    if (account.maxDays && activeMaxDays > account.maxDays) return { result: "TIMEOUT", dias };

    const { pnl: pnlRaw, mae } = genDay(strategy, sizeFactor);
    let pnl = pnlRaw;

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

    // Intraday MAE check
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
    if (pnl >= winDayThreshold) winningDays++;

    let effectiveTarget = account.target;
    let consistencyOK   = true;
    if (account.consistency && account.consistencyType === "vs_target" && bestDay > 0) {
      effectiveTarget = Math.max(account.target, bestDay / account.consistency);
    } else if (account.consistency && account.consistencyType === "vs_total") {
      if (totalProfit > 0) consistencyOK = bestDay <= account.consistency * totalProfit;
    }

    const minDaysMet = minDaysType === "winning"
      ? winningDays >= (account.minDays || 0)
      : dias >= (account.minDays || 0);

    const profitMade = equity - phaseCapital;
    const targetReached = profitMade >= effectiveTarget;

    if (targetReached && minDaysMet && consistencyOK) {
      return { result: "PASS", dias };
    }
    if (targetReached && !consistencyOK && postConservative) {
      // Reduce size to dilute best-day ratio without taking excessive risk
      sizeFactor = reductionFactor;
    } else if (!targetReached && sizeFactor < 1.0 && postConservative) {
      // If we've drifted back below target (shouldn't normally happen since we only reduced after target hit),
      // resume normal size
      sizeFactor = 1.0;
    }
  }
  return { result: "DD", dias };
}

function simulateAttempt(account, strategy, behavioral) {
  const r1 = simulateSinglePhase(account, strategy, account.capital, behavioral);
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
  const r2 = simulateSinglePhase(phase2Account, strategy, account.capital, behavioral);
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

// ─── Funded phase simulation ───────────────────────────────────────────────
// Returns: { days, breach, payouts: [{day, gross, net}], payoutCount, totalGross, totalNet, finalEquity }
function simulateFundedPhase(plan, strategy, fundedRules, horizonDays, sizeFactorFunded) {
  const capital = plan.capital;
  const ddType  = fundedRules.ddType;
  const ddValue = fundedRules.ddValue;
  const dailyLoss = fundedRules.dailyLoss;
  const dailyLossIsFatal = fundedRules.dailyLossIsFatal;
  const floorLockType = fundedRules.floorLock;
  const split = plan.profitSplit;

  let equity = capital;
  let hwm    = capital;
  let floor  = capital - ddValue;
  let floorLocked = false;
  let daysSinceLastPayout = 0;
  let dayIdx = 0;
  let bestDaySincePayout = 0;
  let profitSincePayout = 0;
  const payouts = [];

  // Synthetic "account" shape for floor recomputation helpers
  const acct = { ddType, ddValue, floorLock: floorLockType, target: 0 };

  while (dayIdx < horizonDays) {
    dayIdx++;
    daysSinceLastPayout++;

    const { pnl: pnlRaw, mae } = genDay(strategy, sizeFactorFunded);
    let pnl = pnlRaw;

    // Intraday trailing: MFE raises floor mid-day
    if (ddType === "trailing_intraday" && pnl > 0 && !floorLocked) {
      const mfe = pnl + gammaRandom(1.5, Math.max(strategy.sigmaWin * 0.15, 1));
      const peakEquity = equity + mfe;
      if (peakEquity > hwm) {
        hwm = peakEquity;
        const nf = computeFloor(acct, hwm, equity, capital);
        floor = Math.max(floor, nf);
      }
    }

    // Intraday MAE breach
    if (equity - mae <= floor) {
      return { days: dayIdx, breach: "DD", payouts, payoutCount: payouts.length,
               totalGross: sum(payouts.map(p => p.gross)),
               totalNet:   sum(payouts.map(p => p.net)),
               finalEquity: equity };
    }

    // Daily loss
    if (dailyLoss && pnl <= -dailyLoss) {
      if (dailyLossIsFatal) {
        return { days: dayIdx, breach: "DLL", payouts, payoutCount: payouts.length,
                 totalGross: sum(payouts.map(p => p.gross)),
                 totalNet:   sum(payouts.map(p => p.net)),
                 finalEquity: equity };
      }
      pnl = -dailyLoss;
    }

    equity += pnl;
    if (equity <= floor) {
      return { days: dayIdx, breach: "DD", payouts, payoutCount: payouts.length,
               totalGross: sum(payouts.map(p => p.gross)),
               totalNet:   sum(payouts.map(p => p.net)),
               finalEquity: equity };
    }

    if (ddType !== "static" && !floorLocked) {
      if (equity > hwm) hwm = equity;
      if (floorLockType === "at_capital_plus_100" && equity >= capital + ddValue + 100) {
        floorLocked = true;
        floor = capital + 100;
      } else {
        const nf = computeFloor(acct, hwm, equity, capital);
        floor = Math.max(floor, nf);
      }
    }

    if (pnl > 0) {
      profitSincePayout += pnl;
      if (pnl > bestDaySincePayout) bestDaySincePayout = pnl;
    }

    // ─── Payout eligibility check ───
    const minDaysMet = payouts.length === 0
      ? daysSinceLastPayout >= (fundedRules.firstPayoutMinDays || 0)
      : daysSinceLastPayout >= (fundedRules.payoutFrequency   || 0);

    if (!minDaysMet) continue;

    const profitAboveBase   = equity - capital;
    const profitAboveBuffer = profitAboveBase - (fundedRules.payoutBuffer || 0);
    if (profitAboveBuffer < (fundedRules.payoutMinAmount || 0)) continue;

    // Payout consistency (if configured)
    if (fundedRules.payoutConsistency && fundedRules.payoutConsistencyType === "vs_total") {
      if (profitSincePayout > 0 &&
          bestDaySincePayout > fundedRules.payoutConsistency * profitSincePayout) {
        continue; // cannot withdraw yet — consistency blocks
      }
    }

    // Compute payout amount
    let gross = profitAboveBuffer * (fundedRules.payoutMaxPct ?? 1.0);
    if (fundedRules.payoutMaxCap && gross > fundedRules.payoutMaxCap) gross = fundedRules.payoutMaxCap;
    if (gross < (fundedRules.payoutMinAmount || 0)) continue;

    const net = gross * split;
    payouts.push({ day: dayIdx, gross, net });

    // Post-payout balance / floor behavior
    if (fundedRules.resetOnPayout) {
      equity -= gross;
      if (fundedRules.resetFloorOnPayout !== false) {
        hwm = capital;
        floor = capital - ddValue;
        floorLocked = false;
      }
    } else {
      equity -= gross;
      // Most non-resetting firms keep trailing floor tied to hwm; do not lower hwm
    }
    daysSinceLastPayout = 0;
    bestDaySincePayout  = 0;
    profitSincePayout   = 0;
  }

  return { days: dayIdx, breach: null, payouts, payoutCount: payouts.length,
           totalGross: sum(payouts.map(p => p.gross)),
           totalNet:   sum(payouts.map(p => p.net)),
           finalEquity: equity };
}
function sum(a) { return a.reduce((x, y) => x + y, 0); }

export function runMonteCarlo(account, strategy, nSims, fundedRules) {
  const N = Math.min(nSims, 25000);
  const diasPass = [], diasFail = [];
  let nPass = 0, nDD = 0, nTimeout = 0, nDLL = 0;

  // Post-PASS aggregators
  const postPassEnabled = !!strategy.postPassEnabled && !!fundedRules;
  const horizonMonths   = Math.max(1, Math.min(24, strategy.postPassHorizonMonths || 6));
  const horizonDays     = Math.round(horizonMonths * 21);
  const postSizeFactor  = strategy.postPassSizeMode === "reduced"
    ? Math.max(0.01, Math.min(1, strategy.postPassSizeFactor ?? 0.5))
    : 1.0;
  const ppNetAll = [];
  const ppGrossAll = [];
  const ppPayoutsAll = [];
  const ppDaysSurvived = [];
  const ppFirstPayoutDay = [];
  const ppBreachCount = { DD: 0, DLL: 0, None: 0 };
  const ppSurvive3m = []; const ppSurvive6m = []; const ppSurvive12m = [];
  const ppPayoutsByMonth = Array.from({ length: horizonMonths }, () => 0); // mean net payout per month
  let   ppRuns = 0;

  // Derive daily commission from mode + params
  const resolved = { ...strategy };
  if (strategy.commissionMode === "estimate") {
    resolved.dailyCommission =
      (strategy.commissionPerRT || 0) *
      (strategy.tradesPerDay || 0) *
      (strategy.contractsPerTrade || 1);
  } else if (strategy.commissionMode === "fixed") {
    resolved.dailyCommission = strategy.dailyCommission || 0;
  } else {
    resolved.dailyCommission = 0;
  }

  const behavioral = {
    postTargetMode:         strategy.postTargetMode || "conservative",
    postTargetSizeReduction: strategy.postTargetSizeReduction ?? 0.30,
    minDaysType:            strategy.minDaysType || "total",
    winDayThreshold:        strategy.winDayThreshold ?? 50,
    maxDaysType:            strategy.maxDaysType || "trading",
  };

  function baseFeeForAttempt(dias) {
    if (!account.feeType || account.feeType === "one_time") return account.fee;
    return account.fee * Math.ceil(Math.max(dias, 1) / 21);
  }

  let totalCost = 0;

  for (let i = 0; i < N; i++) {
    const r = simulateAttempt(account, resolved, behavioral);
    const base = baseFeeForAttempt(r.dias);
    const activation = r.result === "PASS" ? (account.activationFee || 0) : 0;
    totalCost += base + activation;

    if      (r.result === "PASS")    { nPass++;    diasPass.push(r.dias); }
    else if (r.result === "TIMEOUT") { nTimeout++; diasFail.push(r.dias); }
    else if (r.result === "DLL")     { nDLL++;     diasFail.push(r.dias); }
    else                             { nDD++;      diasFail.push(r.dias); }

    // ── Post-PASS funded cycle ──
    if (postPassEnabled && r.result === "PASS") {
      const fr = simulateFundedPhase(account, resolved, fundedRules, horizonDays, postSizeFactor);
      ppRuns++;
      ppNetAll.push(fr.totalNet);
      ppGrossAll.push(fr.totalGross);
      ppPayoutsAll.push(fr.payoutCount);
      ppDaysSurvived.push(fr.days);
      ppFirstPayoutDay.push(fr.payouts.length ? fr.payouts[0].day : null);
      if (fr.breach === "DD")       ppBreachCount.DD++;
      else if (fr.breach === "DLL") ppBreachCount.DLL++;
      else                          ppBreachCount.None++;

      ppSurvive3m.push(fr.days >= Math.min(horizonDays,  63) && !fr.breach ? 1 : (fr.days >=  63 ? 1 : 0));
      ppSurvive6m.push(fr.days >= Math.min(horizonDays, 126) && !fr.breach ? 1 : (fr.days >= 126 ? 1 : 0));
      ppSurvive12m.push(fr.days >= Math.min(horizonDays,252) && !fr.breach ? 1 : (fr.days >= 252 ? 1 : 0));

      for (const p of fr.payouts) {
        const m = Math.min(horizonMonths - 1, Math.floor((p.day - 1) / 21));
        if (m >= 0 && m < horizonMonths) ppPayoutsByMonth[m] += p.net;
      }
    }
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

  // Attempt curve: probability of at least one pass vs number of attempts
  const attemptCurve = [];
  if (isFinite(logFail) && logFail < 0) {
    const milestones = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50];
    for (const k of milestones) {
      const pAtLeastOne = 1 - Math.pow(1 - pPass, k);
      attemptCurve.push({
        attempts: k,
        pAtLeastOne: +(pAtLeastOne * 100).toFixed(2),
        bankroll: Math.round(k * avgCost),
      });
    }
  }

  // Commission impact breakdown
  const avgDays = diasPass.length ? mean(diasPass) : mean([...diasPass, ...diasFail]);
  const commissionImpact = {
    daily:    resolved.dailyCommission || 0,
    perAttempt: (resolved.dailyCommission || 0) * avgDays,
    avgDays,
  };

  // ─── Post-PASS (funded) aggregates ───
  let postPass = null;
  if (postPassEnabled && ppRuns > 0) {
    const sortedNet = [...ppNetAll].sort((a, b) => a - b);
    const sortedGross = [...ppGrossAll].sort((a, b) => a - b);
    const sortedFirst = ppFirstPayoutDay.filter(d => d !== null).sort((a, b) => a - b);
    const sortedPayouts = [...ppPayoutsAll].sort((a, b) => a - b);

    // Conditional: among PASSers
    const pSurvive3m  = ppSurvive3m.length  ? mean(ppSurvive3m)  : 0;
    const pSurvive6m  = ppSurvive6m.length  ? mean(ppSurvive6m)  : 0;
    const pSurvive12m = ppSurvive12m.length ? mean(ppSurvive12m) : 0;

    const meanNet     = mean(ppNetAll);
    const meanGross   = mean(ppGrossAll);
    const meanPayouts = mean(ppPayoutsAll);
    const medianNet   = quantile(sortedNet, 0.5);
    const p10Net      = quantile(sortedNet, 0.10);
    const p90Net      = quantile(sortedNet, 0.90);
    const meanFirstPayoutDay = sortedFirst.length ? mean(sortedFirst) : null;
    const medFirstPayoutDay  = sortedFirst.length ? quantile(sortedFirst, 0.5) : null;

    // Net histogram (for distribution panel)
    const histNet = makeNetHistogram(ppNetAll);
    const payoutHistogram = makePayoutCountHistogram(ppPayoutsAll);

    // Unconditional expected take-home (weighted by P(PASS) so we can factor cost/ROI end-to-end)
    const evLifetime = pPass * meanNet - avgCost;

    // Breach breakdown (normalize to ppRuns)
    const breachPct = {
      DD:   ppBreachCount.DD   / ppRuns,
      DLL:  ppBreachCount.DLL  / ppRuns,
      None: ppBreachCount.None / ppRuns,
    };

    // Mean net payout per month (averaged across PASS runs)
    const payoutsByMonth = ppPayoutsByMonth.map((total, i) => ({
      month: i + 1,
      meanNet: +(total / ppRuns).toFixed(2),
    }));

    postPass = {
      ppRuns,
      horizonDays, horizonMonths,
      sizeFactor: postSizeFactor,
      pSurvive3m, pSurvive6m, pSurvive12m,
      meanNet, medianNet, p10Net, p90Net,
      meanGross,
      meanPayouts,
      medianPayouts: quantile(sortedPayouts, 0.5),
      meanFirstPayoutDay, medFirstPayoutDay,
      evLifetime,
      breachPct,
      histNet,
      payoutHistogram,
      payoutsByMonth,
      meanDaysSurvived: mean(ppDaysSurvived),
    };
  }

  return {
    pPass, pDD, pTimeout, pDLL, ruinaMin,
    meanPass: mean(diasPass), medianPass: quantile(sortedPass, 0.5), p90Pass: quantile(sortedPass, 0.9),
    meanFail: mean(diasFail), medianFail: quantile(sortedFail, 0.5),
    ev, avgCost, payout, finalTarget,
    n95, n99, br95, br99, medIntentos,
    passEssentiallyZero,
    histPass: makeHistogram(diasPass),
    histFail: makeHistogram(diasFail),
    attemptCurve,
    commissionImpact,
    postPass,
    mode: strategy.mode || "simple",
    nPass, nDD, nTimeout, nDLL,
    nSims: N,
  };
}

// Net-payout histogram (clipped at 95th percentile)
function makeNetHistogram(data, bins = 24) {
  if (!data.length) return [];
  const sorted = [...data].sort((a, b) => a - b);
  const p95v = quantile(sorted, 0.95);
  const p05v = quantile(sorted, 0.05);
  if (p95v === p05v) return [];
  const range = p95v - p05v;
  const bSz = Math.max(1, Math.ceil(range / bins));
  const clipped = data.filter(d => d >= p05v && d <= p95v);
  const map = new Map();
  clipped.forEach(d => {
    const b = Math.floor(d / bSz) * bSz;
    map.set(b, (map.get(b) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => a[0] - b[0])
    .map(([bucket, cnt]) => ({ bucket, pct: +((cnt / clipped.length) * 100).toFixed(2) }));
}

function makePayoutCountHistogram(data) {
  if (!data.length) return [];
  const map = new Map();
  data.forEach(v => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].sort((a, b) => a[0] - b[0])
    .map(([count, freq]) => ({ count, pct: +((freq / data.length) * 100).toFixed(2) }));
}

// ─── Bootstrap data parser ─────────────────────────────────────────────────
// Accepts textarea content; returns { data: [{pnl, mae?, mfe?}], stats: {...}, errors: [] }
export function parseBootstrapData(raw) {
  if (!raw || typeof raw !== "string") return { data: [], stats: null, errors: ["Empty input"] };
  const lines = raw.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { data: [], stats: null, errors: ["No lines found"] };

  // Detect delimiter by scanning first 3 lines
  const sample = lines.slice(0, 3).join("\n");
  const delim = /\t/.test(sample) ? "\t" : /[,;]/.test(sample) ? (/;/.test(sample) ? ";" : ",") : null;

  let headers = null;
  let dataLines = lines;
  if (delim) {
    const first = lines[0].split(delim).map(s => s.trim());
    const nonNumericCount = first.filter(s => isNaN(parseFloat(s))).length;
    if (nonNumericCount >= Math.ceil(first.length / 2)) {
      headers = first.map(h => h.toLowerCase());
      dataLines = lines.slice(1);
    }
  }

  // Column detection
  const pnlAliases = ["pnl", "p&l", "pl", "profit", "net", "daily_pnl", "dailypnl"];
  const maeAliases = ["mae", "adverse", "max_adverse", "drawdown_intra", "maxdd"];
  const mfeAliases = ["mfe", "favorable", "max_favorable"];
  let pnlIdx = 0, maeIdx = -1, mfeIdx = -1;
  if (headers) {
    const idxOf = (aliases) =>
      headers.findIndex(h => aliases.some(a => h === a || h.includes(a)));
    const found = idxOf(pnlAliases);
    pnlIdx = found >= 0 ? found : 0;
    maeIdx = idxOf(maeAliases);
    mfeIdx = idxOf(mfeAliases);
  }

  const data = [];
  const errors = [];
  for (const line of dataLines) {
    const parts = delim ? line.split(delim).map(s => s.trim()) : [line];
    const pnl = parseFloat(parts[pnlIdx]);
    if (!isFinite(pnl)) continue;
    const row = { pnl };
    if (maeIdx >= 0 && parts[maeIdx] !== undefined) {
      const v = parseFloat(parts[maeIdx]);
      if (isFinite(v)) row.mae = Math.abs(v);
    }
    if (mfeIdx >= 0 && parts[mfeIdx] !== undefined) {
      const v = parseFloat(parts[mfeIdx]);
      if (isFinite(v)) row.mfe = v;
    }
    data.push(row);
  }

  if (data.length < 30) errors.push("Minimum 30 samples recommended; got " + data.length);
  if (data.length < 100 && data.length >= 30) errors.push("For reliable bootstrap use >=100 samples; got " + data.length);

  // Compute summary stats
  const wins = data.filter(d => d.pnl > 0);
  const losses = data.filter(d => d.pnl < 0);
  const total = data.reduce((a, d) => a + d.pnl, 0);
  const meanWin = wins.length ? wins.reduce((a, d) => a + d.pnl, 0) / wins.length : 0;
  const meanLoss = losses.length ? losses.reduce((a, d) => a + d.pnl, 0) / losses.length : 0;
  const best = data.reduce((a, d) => d.pnl > a ? d.pnl : a, -Infinity);
  const worst = data.reduce((a, d) => d.pnl < a ? d.pnl : a, Infinity);
  const hasMae = data.some(d => d.mae !== undefined);

  // Simple autocorrelation (lag-1) of pnl sequence
  let autocorr = 0;
  if (data.length > 5) {
    const xs = data.map(d => d.pnl);
    const mu = total / data.length;
    let num = 0, den = 0;
    for (let i = 0; i < xs.length - 1; i++) num += (xs[i] - mu) * (xs[i + 1] - mu);
    for (let i = 0; i < xs.length;     i++) den += (xs[i] - mu) * (xs[i] - mu);
    autocorr = den > 0 ? num / den : 0;
  }

  return {
    data,
    errors,
    stats: {
      total: data.length,
      wins: wins.length,
      losses: losses.length,
      wr: data.length ? wins.length / data.length : 0,
      meanWin, meanLoss,
      totalPnl: total,
      best, worst,
      hasMae,
      autocorrelation: +autocorr.toFixed(3),
    },
  };
}
