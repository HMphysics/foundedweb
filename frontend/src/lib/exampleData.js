// exampleData.js — deterministic example P&L history used by the
// "load example" button in the bootstrap input. Generates a realistic-looking
// daily backtest series (NQ-style intraday, ~37% WR, ~2:1 RR) so first-time
// users can preview the simulator without uploading their own data.
//
// Determinism: a small seeded PRNG (mulberry32) is used so the example never
// changes between renders or environments.

const DEFAULT_N = 200;
const DEFAULT_SEED = 0x70726F66; // "prof"

// --- Seeded PRNG -------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller transform — standard normal from two uniforms.
function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate `n` synthetic daily P&L records with MAE/MFE for an NQ-style
 * intraday strategy. Returns an array of objects:
 *   { date: "YYYY-MM-DD", pnl, mae, mfe }
 * The series targets ~37% win rate and a positive expectancy (~+$50/day).
 */
export function generateExamplePnLs(n = DEFAULT_N, seed = DEFAULT_SEED) {
  const rand = mulberry32(seed);

  // Distribution params (loosely calibrated to a $50k NQ challenge backtest).
  const winRate    = 0.37;
  const muWin      = 438;
  const sigmaWin   = 242;
  const muLoss     = -194;
  const sigmaLoss  = 28;
  const tailProb   = 0.0315;
  const tailMult   = 1.18;

  // Calendar: start on a fixed Monday so dates are reproducible.
  const start = new Date(Date.UTC(2024, 0, 2)); // 2024-01-02 (Tue)
  const out = [];
  let cursor = new Date(start);

  for (let i = 0; i < n; i++) {
    // Skip weekends.
    while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const isWin = rand() < winRate;
    let pnl;
    if (isWin) {
      pnl = muWin + sigmaWin * gaussian(rand);
      if (rand() < tailProb) pnl *= tailMult;        // occasional spike up
      pnl = Math.max(pnl, 5);                        // never zero/negative on a "win"
    } else {
      pnl = muLoss + sigmaLoss * gaussian(rand);
      if (rand() < tailProb / 2) pnl *= tailMult;    // rare extra-bad day
      pnl = Math.min(pnl, -5);
    }
    pnl = Math.round(pnl);

    // MAE: how deep the day went into the red before closing.
    // Wins: small drawdown (~$0–150). Losses: deeper (close to |pnl|, sometimes more).
    let mae;
    if (isWin) {
      mae = -Math.round(Math.abs(gaussian(rand)) * 70 + 20);
    } else {
      mae = Math.round(pnl * (1.0 + Math.abs(gaussian(rand)) * 0.25));
      if (mae > pnl) mae = pnl;                      // mae cannot be shallower than close
    }

    // MFE: best unrealized excursion during the day.
    let mfe;
    if (isWin) {
      mfe = Math.round(pnl * (1.0 + Math.abs(gaussian(rand)) * 0.30));
      if (mfe < pnl) mfe = pnl;
    } else {
      mfe = Math.round(Math.abs(gaussian(rand)) * 90 + 15);
    }

    const yyyy = cursor.getUTCFullYear();
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getUTCDate()).padStart(2, "0");
    out.push({ date: `${yyyy}-${mm}-${dd}`, pnl, mae, mfe });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Convert the example records into a CSV string ready to drop into the
 * bootstrap textarea. Uses the columns the parser already understands:
 *   date,pnl,mae,mfe
 */
export function exampleAsCSV(n = DEFAULT_N, seed = DEFAULT_SEED) {
  const rows = generateExamplePnLs(n, seed);
  const header = "date,pnl,mae,mfe";
  const body = rows.map(r => `${r.date},${r.pnl},${r.mae},${r.mfe}`).join("\n");
  return `${header}\n${body}`;
}
