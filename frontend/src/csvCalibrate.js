// CSV calibration — convert historical P&L rows into STRATEGY params.
// Accepts one number per row (day P&L) or a multi-column CSV (user picks column).

function parseNum(s) {
  if (s === null || s === undefined) return NaN;
  const t = String(s).replace(/[$,\s]/g, "").replace(/"/g, "").trim();
  if (!t) return NaN;
  const n = parseFloat(t);
  return isFinite(n) ? n : NaN;
}

export function parseCsv(text) {
  // Returns { rows: string[][], sep }
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) return { rows: [], sep: "," };
  const firstLine = cleaned.split("\n", 1)[0];
  const seps = [",", "\t", ";", "|"];
  let sep = ",", best = 0;
  seps.forEach(s => {
    const c = firstLine.split(s).length;
    if (c > best) { best = c; sep = s; }
  });
  const rows = cleaned.split("\n").map(l => l.split(sep).map(c => c.trim()));
  return { rows, sep };
}

export function detectColumns(rows) {
  if (!rows.length) return [];
  const nCols = Math.max(...rows.map(r => r.length));
  const cols = [];
  for (let i = 0; i < nCols; i++) {
    const values = rows.map(r => parseNum(r[i])).filter(v => !isNaN(v));
    const firstIsHeader = isNaN(parseNum(rows[0][i]));
    cols.push({
      index: i,
      header: firstIsHeader ? rows[0][i] : `col_${i + 1}`,
      numericCount: values.length,
      sampleMean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      hasNegatives: values.some(v => v < 0),
    });
  }
  return cols;
}

export function extractColumn(rows, colIdx, skipHeader) {
  const start = skipHeader ? 1 : 0;
  const out = [];
  for (let i = start; i < rows.length; i++) {
    const v = parseNum(rows[i]?.[colIdx]);
    if (!isNaN(v)) out.push(v);
  }
  return out;
}

function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function std(a)  {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

export function calibrateStrategy(values) {
  // values: array of day P&L (positive wins, negative losses, 0 skipped)
  const nonZero = values.filter(v => v !== 0);
  if (nonZero.length < 5) {
    return { error: "Need at least 5 non-zero P&L samples." };
  }
  const wins   = nonZero.filter(v => v > 0);
  const losses = nonZero.filter(v => v < 0);

  if (!wins.length)   return { error: "No winning days found." };
  if (!losses.length) return { error: "No losing days found." };

  const wr        = wins.length / nonZero.length;
  const muWin     = mean(wins);
  const sigmaWin  = std(wins) || muWin * 0.3;
  const muLoss    = mean(losses);
  const sigmaLoss = std(losses) || Math.abs(muLoss) * 0.3;

  // Tail detection: P&L magnitudes beyond mean + 2.5σ (of own sign)
  let tailCount = 0, tailRatioSum = 0;
  wins.forEach(v => {
    if (v > muWin + 2.5 * sigmaWin) {
      tailCount++;
      tailRatioSum += v / Math.max(muWin, 1);
    }
  });
  losses.forEach(v => {
    if (v < muLoss - 2.5 * sigmaLoss) {
      tailCount++;
      tailRatioSum += Math.abs(v) / Math.max(Math.abs(muLoss), 1);
    }
  });
  const tailProb = Math.max(0, Math.min(0.1, tailCount / nonZero.length));
  const tailMult = tailCount ? Math.max(1.05, Math.min(3, tailRatioSum / tailCount)) : 1.15;

  return {
    stats: {
      nSamples:   nonZero.length,
      nWins:      wins.length,
      nLosses:    losses.length,
      totalPnl:   nonZero.reduce((a, b) => a + b, 0),
      avgDay:     mean(nonZero),
    },
    strategy: {
      wr:        +wr.toFixed(4),
      muWin:     +muWin.toFixed(2),
      sigmaWin:  +sigmaWin.toFixed(2),
      muLoss:    +muLoss.toFixed(2),
      sigmaLoss: +sigmaLoss.toFixed(2),
      tailProb:  +tailProb.toFixed(4),
      tailMult:  +tailMult.toFixed(3),
    },
  };
}
