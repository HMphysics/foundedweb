// Prop firm database — verified snapshot (Apr 2026 per spec)
// Identifiers kept in English; they are used internally by the simulator.

export const FIRM_DATABASE = [
  // ══════════════════════ FUTURES ══════════════════════
  {
    id: "apex_eod",
    name: "Apex Trader Funding",
    subtitle: "EOD Trailing (4.0)",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "Floor updates only at 4:59 PM ET. DLL non-fatal (pauses day). 30-day eval expiry, no resets.",
    plans: [
      { planId:"apex_eod_25k",  label:"25K EOD",  capital:25000,  target:1500,  ddType:"trailing_eod", ddValue:1500, floorLock:"at_target_level", dailyLoss:750,  dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:167, activationFee:99, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_eod_50k",  label:"50K EOD",  capital:50000,  target:3000,  ddType:"trailing_eod", ddValue:2500, floorLock:"at_target_level", dailyLoss:1000, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:187, activationFee:99, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_eod_100k", label:"100K EOD", capital:100000, target:6000,  ddType:"trailing_eod", ddValue:3000, floorLock:"at_target_level", dailyLoss:1500, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:207, activationFee:99, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_eod_150k", label:"150K EOD", capital:150000, target:9000,  ddType:"trailing_eod", ddValue:5000, floorLock:"at_target_level", dailyLoss:2000, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:207, activationFee:99, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_eod_200k", label:"200K EOD", capital:200000, target:12000, ddType:"trailing_eod", ddValue:6500, floorLock:"at_target_level", dailyLoss:2500, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:227, activationFee:99, feeType:"one_time", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "apex_intraday",
    name: "Apex Trader Funding",
    subtitle: "Intraday Trailing (4.0)",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "Floor moves with unrealized equity peaks. No DLL. 30-day eval expiry.",
    plans: [
      { planId:"apex_id_25k",  label:"25K Intraday",  capital:25000,  target:1500,  ddType:"trailing_intraday", ddValue:1500, floorLock:"at_target_level", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:157, activationFee:79, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_id_50k",  label:"50K Intraday",  capital:50000,  target:3000,  ddType:"trailing_intraday", ddValue:2500, floorLock:"at_target_level", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:177, activationFee:79, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_id_100k", label:"100K Intraday", capital:100000, target:6000,  ddType:"trailing_intraday", ddValue:3000, floorLock:"at_target_level", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:197, activationFee:79, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_id_150k", label:"150K Intraday", capital:150000, target:9000,  ddType:"trailing_intraday", ddValue:5000, floorLock:"at_target_level", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:197, activationFee:79, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"apex_id_200k", label:"200K Intraday", capital:200000, target:12000, ddType:"trailing_intraday", ddValue:6500, floorLock:"at_target_level", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:30, fee:217, activationFee:79, feeType:"one_time", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "topstep",
    name: "Topstep",
    subtitle: "Trading Combine®",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing, NO lock during eval. DLL es configurable por el trader en TopstepX, NO impuesto por la firma. 50% consistency (vs_target). Fee mensual + $149 activation al pasar.",
    plans: [
      { planId:"topstep_50k",  label:"50K Combine",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"none", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_target", minDays:0, maxDays:null, fee:49,  activationFee:149, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"topstep_100k", label:"100K Combine", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"none", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_target", minDays:0, maxDays:null, fee:99,  activationFee:149, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"topstep_150k", label:"150K Combine", capital:150000, target:9000, ddType:"trailing_eod", ddValue:4500, floorLock:"none", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_target", minDays:0, maxDays:null, fee:149, activationFee:149, feeType:"monthly", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "tradeify_growth",
    name: "Tradeify",
    subtitle: "Growth Plan",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. Floor se bloquea permanentemente en capital+100 cuando EOD ≥ capital+ddValue+100. Sin DLL, sin consistency. Fee único.",
    plans: [
      { planId:"tradeify_g_25k",  label:"25K Growth",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:null, fee:99,  activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"tradeify_g_50k",  label:"50K Growth",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:null, fee:150, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"tradeify_g_100k", label:"100K Growth", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:null, fee:250, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"tradeify_g_150k", label:"150K Growth", capital:150000, target:9000, ddType:"trailing_eod", ddValue:4500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:null, fee:350, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "tradeify_select",
    name: "Tradeify",
    subtitle: "Select Plan",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. Mínimo 3 días. Sin DLL. Split 90/10.",
    plans: [
      { planId:"tradeify_s_25k",  label:"25K Select",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:109, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"tradeify_s_50k",  label:"50K Select",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:169, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"tradeify_s_100k", label:"100K Select", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:269, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "mffu_core",
    name: "My Funded Futures",
    subtitle: "Core Plan",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. Consistency 40% (vs_total). Cero fees tras pasar. Split 80/20.",
    plans: [
      { planId:"mffu_c_50k",  label:"50K Core",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:77,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"mffu_c_100k", label:"100K Core", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:147, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"mffu_c_150k", label:"150K Core", capital:150000, target:9000, ddType:"trailing_eod", ddValue:5000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:197, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "mffu_rapid",
    name: "My Funded Futures",
    subtitle: "Rapid Plan",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "Intraday trailing — el plan más estricto de MFFU. Sin consistency. Split 90/10.",
    plans: [
      { planId:"mffu_r_50k",  label:"50K Rapid",  capital:50000,  target:3000, ddType:"trailing_intraday", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:127, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
      { planId:"mffu_r_100k", label:"100K Rapid", capital:100000, target:6000, ddType:"trailing_intraday", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:197, activationFee:0, feeType:"one_time", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "fundednext_rapid_fut",
    name: "FundedNext",
    subtitle: "Rapid — Futures",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. Sin DLL, sin consistency. Floor bloquea en capital+100. Permite overnight.",
    plans: [
      { planId:"fn_rf_25k",  label:"25K Rapid",  capital:25000,  target:1500,  ddType:"trailing_eod", ddValue:1250, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:99,     activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_rf_50k",  label:"50K Rapid",  capital:50000,  target:3000,  ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:199.99, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_rf_100k", label:"100K Rapid", capital:100000, target:6000,  ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:349,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_rf_200k", label:"200K Rapid", capital:200000, target:12000, ddType:"trailing_eod", ddValue:5000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:599,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "fundednext_legacy_fut",
    name: "FundedNext",
    subtitle: "Legacy — Futures",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. Consistency 40% (vs_total). Mínimo 5 días. Split 80%.",
    plans: [
      { planId:"fn_lf_25k",  label:"25K Legacy",  capital:25000,  target:1500,  ddType:"trailing_eod", ddValue:1250, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:5, maxDays:null, fee:74.99,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_lf_50k",  label:"50K Legacy",  capital:50000,  target:3000,  ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:5, maxDays:null, fee:149.99, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_lf_100k", label:"100K Legacy", capital:100000, target:6000,  ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:5, maxDays:null, fee:249,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_lf_200k", label:"200K Legacy", capital:200000, target:12000, ddType:"trailing_eod", ddValue:5000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:5, maxDays:null, fee:449,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "fundednext_bolt_fut",
    name: "FundedNext",
    subtitle: "Bolt — Futures",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. DLL no-fatal (pausa el día). Consistency 40% (vs_total). La entrada más barata.",
    plans: [
      { planId:"fn_bf_25k",  label:"25K Bolt",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1250, floorLock:"at_capital_plus_100", dailyLoss:500,  dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:49.99, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_bf_50k",  label:"50K Bolt",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:1000, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:99.99, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"fn_bf_100k", label:"100K Bolt", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:2000, dailyLossIsFatal:false, consistency:0.40, consistencyType:"vs_total", minDays:0, maxDays:null, fee:179,   activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "tpt",
    name: "TakeProfitTrader",
    subtitle: "Test Account",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. Sin DLL (retirado Oct 2025). Consistency 50% (vs_total). Mínimo 5 días. Fee mensual.",
    plans: [
      { planId:"tpt_25k",  label:"25K Test",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1500, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:5, maxDays:null, fee:150, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
      { planId:"tpt_50k",  label:"50K Test",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:5, maxDays:null, fee:170, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
      { planId:"tpt_100k", label:"100K Test", capital:100000, target:6000, ddType:"trailing_eod", ddValue:6000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:5, maxDays:null, fee:225, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
      { planId:"tpt_150k", label:"150K Test", capital:150000, target:9000, ddType:"trailing_eod", ddValue:9000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:5, maxDays:null, fee:375, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "tradeday",
    name: "TradeDay",
    subtitle: "EOD Trailing",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. Sin DLL. Consistency 30% (vs_total) durante eval. Mensual. Overnight permitido.",
    plans: [
      { planId:"td_50k",  label:"50K",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:150, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"td_100k", label:"100K", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:200, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"td_150k", label:"150K", capital:150000, target:9000, ddType:"trailing_eod", ddValue:4500, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:250, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "earn2trade",
    name: "Earn2Trade",
    subtitle: "Gauntlet Mini",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. DLL no-fatal (pausa el día). Consistency 30% (vs_total). Resets gratis incluidos. Mensual.",
    plans: [
      { planId:"e2t_25k",  label:"25K Gauntlet",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1500, floorLock:"at_capital", dailyLoss:700,  dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:150, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
      { planId:"e2t_50k",  label:"50K Gauntlet",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2000, floorLock:"at_capital", dailyLoss:1100, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:175, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
      { planId:"e2t_100k", label:"100K Gauntlet", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital", dailyLoss:2000, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:0, maxDays:null, fee:350, activationFee:0, feeType:"monthly", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "leeloo",
    name: "Leeloo Trading",
    subtitle: "Performance Account",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. Sin DLL. Mínimo 10 días. Consistency 30% (vs_total). Mensual. Overnight permitido.",
    plans: [
      { planId:"leeloo_25k",  label:"25K",  capital:25000,  target:1500, ddType:"trailing_eod", ddValue:1500, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:10, maxDays:null, fee:110, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"leeloo_50k",  label:"50K",  capital:50000,  target:3000, ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:10, maxDays:null, fee:150, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"leeloo_100k", label:"100K", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3500, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:10, maxDays:null, fee:225, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
      { planId:"leeloo_150k", label:"150K", capital:150000, target:9000, ddType:"trailing_eod", ddValue:5000, floorLock:"at_capital", dailyLoss:null, dailyLossIsFatal:false, consistency:0.30, consistencyType:"vs_total", minDays:10, maxDays:null, fee:295, activationFee:0, feeType:"monthly", profitSplit:0.90, phases:1 },
    ],
  },
  {
    id: "phidias_fundamental",
    name: "Phidias",
    subtitle: "Fundamental (Intraday)",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: false,
    notes: "EOD trailing. Sin DLL, sin consistency durante eval. Mínimo 3 días. Posiciones cierran a las 3:59 PM ET.",
    plans: [
      { planId:"phidias_f_50k",  label:"50K Fundamental",  capital:50000,  target:4000, ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:116,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"phidias_f_100k", label:"100K Fundamental", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:144.60, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "phidias_swing",
    name: "Phidias",
    subtitle: "Swing (Overnight)",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "EOD trailing. Posiciones overnight + fin de semana permitidas. Sin DLL, sin consistency durante eval.",
    plans: [
      { planId:"phidias_s_50k",  label:"50K Swing",  capital:50000,  target:4000, ddType:"trailing_eod", ddValue:2500, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:116,    activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
      { planId:"phidias_s_100k", label:"100K Swing", capital:100000, target:6000, ddType:"trailing_eod", ddValue:3000, floorLock:"at_capital_plus_100", dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:3, maxDays:null, fee:144.60, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },
  {
    id: "phidias_static",
    name: "Phidias",
    subtitle: "Static 25K",
    badge: "FUTURES", badgeColor: "#4D9FFF", market: "futures",
    allowsOvernight: true,
    notes: "Drawdown estático — el floor nunca se mueve. DD de $500. Sin consistency, sin DLL. Camino más rápido a live. $55 único.",
    plans: [
      { planId:"phidias_static_25k", label:"25K Static", capital:25000, target:1500, ddType:"static", ddValue:500, floorLock:null, dailyLoss:null, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:1, maxDays:null, fee:55, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:1 },
    ],
  },

  // ══════════════════════ FOREX / MULTI-ASSET ══════════════════════
  {
    id: "ftmo",
    name: "FTMO",
    subtitle: "Standard Challenge",
    badge: "FOREX", badgeColor: "#BB86FC", market: "forex",
    allowsOvernight: true,
    notes: "2 fases. Drawdown estático. DLL 5% FATAL. Fase 1: target 10%, máx 30 días. Fase 2: target 5%, máx 60 días. Mín 4 días cada fase.",
    plans: [
      { planId:"ftmo_10k",  label:"10K",  capital:10000,  target:1000,  ddType:"static", ddValue:1000,  floorLock:null, dailyLoss:500,   dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:4, maxDays:30, fee:155,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:500,   minDays:4, maxDays:60 } },
      { planId:"ftmo_25k",  label:"25K",  capital:25000,  target:2500,  ddType:"static", ddValue:2500,  floorLock:null, dailyLoss:1250,  dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:4, maxDays:30, fee:250,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:1250,  minDays:4, maxDays:60 } },
      { planId:"ftmo_50k",  label:"50K",  capital:50000,  target:5000,  ddType:"static", ddValue:5000,  floorLock:null, dailyLoss:2500,  dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:4, maxDays:30, fee:345,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:2500,  minDays:4, maxDays:60 } },
      { planId:"ftmo_100k", label:"100K", capital:100000, target:10000, ddType:"static", ddValue:10000, floorLock:null, dailyLoss:5000,  dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:4, maxDays:30, fee:540,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:5000,  minDays:4, maxDays:60 } },
      { planId:"ftmo_200k", label:"200K", capital:200000, target:20000, ddType:"static", ddValue:20000, floorLock:null, dailyLoss:10000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:4, maxDays:30, fee:1080, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:10000, minDays:4, maxDays:60 } },
    ],
  },
  {
    id: "fundednext_stellar",
    name: "FundedNext",
    subtitle: "Stellar — Forex/CFD",
    badge: "FOREX", badgeColor: "#BB86FC", market: "forex",
    allowsOvernight: true,
    notes: "2 fases. DD estático. DLL 5% fatal. Fase 1: target 10%. Fase 2: target 5%. Sin consistency.",
    plans: [
      { planId:"fn_s_15k",  label:"15K Stellar",  capital:15000,  target:1500,  ddType:"static", ddValue:900,  floorLock:null, dailyLoss:750,  dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:30, fee:99,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:750,  minDays:5, maxDays:60 } },
      { planId:"fn_s_25k",  label:"25K Stellar",  capital:25000,  target:2500,  ddType:"static", ddValue:1500, floorLock:null, dailyLoss:1250, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:30, fee:149, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:1250, minDays:5, maxDays:60 } },
      { planId:"fn_s_50k",  label:"50K Stellar",  capital:50000,  target:5000,  ddType:"static", ddValue:3000, floorLock:null, dailyLoss:2500, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:30, fee:245, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:2500, minDays:5, maxDays:60 } },
      { planId:"fn_s_100k", label:"100K Stellar", capital:100000, target:10000, ddType:"static", ddValue:6000, floorLock:null, dailyLoss:5000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:30, fee:449, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:5000, minDays:5, maxDays:60 } },
    ],
  },
  {
    id: "the5ers",
    name: "The 5%ers",
    subtitle: "Hyper Growth",
    badge: "FOREX", badgeColor: "#BB86FC", market: "forex",
    allowsOvernight: true,
    notes: "2 fases. DD estático. Consistency 50% (vs_total). Sin min/max días. DLL no-fatal.",
    plans: [
      { planId:"5ers_10k",  label:"10K Hyper",  capital:10000, target:600,  ddType:"static", ddValue:400,  floorLock:null, dailyLoss:400,  dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:0, maxDays:null, fee:99,  activationFee:0, feeType:"one_time", profitSplit:0.50, phases:2, phase2:{ target:300,  minDays:0, maxDays:null } },
      { planId:"5ers_20k",  label:"20K Hyper",  capital:20000, target:1200, ddType:"static", ddValue:800,  floorLock:null, dailyLoss:800,  dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:0, maxDays:null, fee:179, activationFee:0, feeType:"one_time", profitSplit:0.50, phases:2, phase2:{ target:600,  minDays:0, maxDays:null } },
      { planId:"5ers_40k",  label:"40K Hyper",  capital:40000, target:2400, ddType:"static", ddValue:1600, floorLock:null, dailyLoss:1600, dailyLossIsFatal:false, consistency:0.50, consistencyType:"vs_total", minDays:0, maxDays:null, fee:299, activationFee:0, feeType:"one_time", profitSplit:0.50, phases:2, phase2:{ target:1200, minDays:0, maxDays:null } },
      { planId:"5ers_100k", label:"100K High Stake", capital:100000, target:10000, ddType:"static", ddValue:5000, floorLock:null, dailyLoss:5000, dailyLossIsFatal:false, consistency:null, consistencyType:null, minDays:0, maxDays:null, fee:995, activationFee:0, feeType:"one_time", profitSplit:0.60, phases:1 },
    ],
  },
  {
    id: "fundingpips",
    name: "FundingPips",
    subtitle: "Standard Challenge",
    badge: "FOREX", badgeColor: "#BB86FC", market: "forex",
    allowsOvernight: true,
    notes: "2 fases. DD estático. DLL 4% fatal. Fase 1: target 10%, máx 45 días. Fase 2: target 5%, máx 60 días.",
    plans: [
      { planId:"fp_10k",  label:"10K",  capital:10000,  target:1000,  ddType:"static", ddValue:600,   floorLock:null, dailyLoss:400,  dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:45, fee:64,  activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:500,   minDays:5, maxDays:60 } },
      { planId:"fp_25k",  label:"25K",  capital:25000,  target:2500,  ddType:"static", ddValue:1500,  floorLock:null, dailyLoss:1000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:45, fee:148, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:1250,  minDays:5, maxDays:60 } },
      { planId:"fp_50k",  label:"50K",  capital:50000,  target:5000,  ddType:"static", ddValue:3000,  floorLock:null, dailyLoss:2000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:45, fee:265, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:2500,  minDays:5, maxDays:60 } },
      { planId:"fp_100k", label:"100K", capital:100000, target:10000, ddType:"static", ddValue:6000,  floorLock:null, dailyLoss:4000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:45, fee:498, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:5000,  minDays:5, maxDays:60 } },
      { planId:"fp_200k", label:"200K", capital:200000, target:20000, ddType:"static", ddValue:12000, floorLock:null, dailyLoss:8000, dailyLossIsFatal:true, consistency:null, consistencyType:null, minDays:5, maxDays:45, fee:948, activationFee:0, feeType:"one_time", profitSplit:0.80, phases:2, phase2:{ target:10000, minDays:5, maxDays:60 } },
    ],
  },

  // ══════════════════════ CUSTOM ══════════════════════
  {
    id: "custom",
    name: "Custom",
    subtitle: "Configure todo",
    badge: "CUSTOM", badgeColor: "#FFB300", market: "custom",
    allowsOvernight: null,
    notes: "Todos los parámetros desbloqueados y editables.",
    plans: [
      {
        planId: "custom_plan", label: "Custom Account",
        capital: 50000, target: 3000,
        ddType: "trailing_eod", ddValue: 2500, floorLock: "at_capital",
        dailyLoss: null, dailyLossIsFatal: false,
        consistency: null, consistencyType: null,
        minDays: 0, maxDays: null,
        fee: 167, activationFee: 0, feeType: "one_time",
        profitSplit: 0.90, phases: 1,
      },
    ],
  },
];

export const STRATEGY_DEFAULTS = {
  // Mode
  mode:      "simple",        // "simple" | "bootstrap"
  bootstrapData: [],
  bootstrapStats: null,

  // Simple mode (gaussian)
  wr:        0.37,
  muWin:     438,
  sigmaWin:  242,
  muLoss:   -194,
  sigmaLoss:  28,
  tailProb:  0.0315,
  tailMult:  1.18,

  // MAE
  maeMode:   "estimate",      // "estimate" | "manual" | "auto"
  instrument: "nq",
  maeWin:    0.24,            // legacy scale factor (used by ESTIMATE fallback)
  maeLoss:   0.40,
  maeWinMean:  null,
  maeWinStd:   null,
  maeLossMean: null,
  maeLossStd:  null,

  // Costs & commissions
  commissionMode:    "none",  // "none" | "estimate" | "fixed"
  commissionPerRT:   4.0,
  tradesPerDay:      5,
  contractsPerTrade: 2,
  dailyCommission:   0,

  // Behavioral
  postTargetMode:         "conservative",  // "conservative" | "aggressive"
  postTargetSizeReduction: 0.30,
  minDaysType:            "total",          // "total" | "winning"
  winDayThreshold:        50,
  maxDaysType:            "trading",        // "trading" | "calendar"

  nSims: 10000,
};
