import { useState, useMemo, useCallback, useRef, lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import "./App.css";
import { FIRM_DATABASE, STRATEGY_DEFAULTS, resolveFundedRules } from "./firmDatabase";
import { runMonteCarlo } from "./monteCarlo";
import { C } from "./lib/colors";
import { isPlanModified } from "./lib/format";
import { downloadJSON, exportPNG as exportPNGHelper } from "./lib/export";
import { LangProvider, useT } from "./components/LangContext";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { UserPlanProvider } from "./components/UserPlanContext";
import CsvModal from "./components/CsvModal";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ChamberTab from "./components/chamber/ChamberTab";
import StrategyTab from "./components/strategy/StrategyTab";
import Terms from "./components/legal/Terms";
import Privacy from "./components/legal/Privacy";
import Cookies from "./components/legal/Cookies";
import Landing from "./components/landing/Landing";

// Lazy-loaded heavy tabs
const OracleTab = lazy(() => import("./components/oracle/OracleTab"));
const Glossary = lazy(() => import("./components/Glossary"));

// Archive noir loading fallback
const LoadingFallback = ({ message }) => (
  <div className="lazy-fallback" data-testid="lazy-fallback">
    <span className="lazy-fallback-text">{message}</span>
  </div>
);

// Root provides the language and auth context
function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <UserPlanProvider>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/app" element={<AppRoute />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
            </Routes>
          </UserPlanProvider>
        </AuthProvider>
      </LangProvider>
      <Analytics />
    </BrowserRouter>
  );
}

// Logged-in users entering "/" are sent to the app; everyone else sees the landing.
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <Landing />;
}

// "/app" requires auth. If not logged in we send them back to the landing where
// the AuthModal can be triggered from any CTA.
function AppRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <AppInner />;
}

function AppInner() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("chamber"); // chamber | strategy | oracle | gloss
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [selectedFirmId, setSelectedFirmId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDraft, setPlanDraft] = useState(null);
  const [customUnlocked, setCustomUnlocked] = useState(false);
  const [strategy, setStrategy] = useState(STRATEGY_DEFAULTS);
  const [nSims, setNSims] = useState(STRATEGY_DEFAULTS.nSims);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAccountEditor, setShowAccountEditor] = useState(false);
  const [compareSlots, setCompareSlots] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [stripeBanner, setStripeBanner] = useState(null); // { type: 'success' | 'cancel', message: string }

  const resultsRef = useRef(null);
  const compareRef = useRef(null);

  // ─── Stripe redirect handling ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get('stripe');
    
    if (stripeStatus === 'success') {
      setStripeBanner({ type: 'success', message: t('stripe_success_title') });
      window.history.replaceState({}, '', window.location.pathname);
      // Delay refresh to allow webhook to process
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (stripeStatus === 'cancel') {
      setStripeBanner({ type: 'cancel', message: t('stripe_cancel_title') });
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setStripeBanner(null), 3000);
    }
  }, [t]);

  // ─── Derivations ───
  const selectedFirm = useMemo(
    () => FIRM_DATABASE.find(f => f.id === selectedFirmId) || null,
    [selectedFirmId]
  );
  const presetPlan = useMemo(() => {
    if (!selectedFirm || !selectedPlanId) return null;
    return selectedFirm.plans.find(p => p.planId === selectedPlanId) || null;
  }, [selectedFirm, selectedPlanId]);
  const isModified = useMemo(() => isPlanModified(planDraft, presetPlan), [planDraft, presetPlan]);
  const regularFirms = useMemo(() => FIRM_DATABASE.filter(f => f.market !== "custom"), []);
  const customFirm = useMemo(() => FIRM_DATABASE.find(f => f.id === "custom"), []);
  const filteredRegular = useMemo(() => {
    if (marketFilter === "ALL") return regularFirms;
    if (marketFilter === "CUSTOM") return [];
    const map = { FUTURES: "futures", FOREX: "forex" };
    return regularFirms.filter(f => f.market === map[marketFilter]);
  }, [marketFilter, regularFirms]);
  const isCustomMode = selectedFirmId === "custom";

  // ─── Selection handlers ───
  const selectFirm = useCallback((id) => {
    setSelectedFirmId(id);
    setSelectedPlanId(null);
    setPlanDraft(null);
    setResults(null);
    setShowAccountEditor(false);
    setCustomUnlocked(id === "custom");
    if (id === "custom") {
      const firm = FIRM_DATABASE.find(f => f.id === "custom");
      if (firm?.plans?.[0]) {
        const plan = firm.plans[0];
        setSelectedPlanId(plan.planId);
        setPlanDraft({ ...plan, phase2: plan.phase2 ? { ...plan.phase2 } : undefined });
        setShowAccountEditor(true);
      }
    }
  }, []);

  const selectPlan = useCallback((plan) => {
    setSelectedPlanId(plan.planId);
    setPlanDraft({ ...plan, phase2: plan.phase2 ? { ...plan.phase2 } : undefined });
    setResults(null);
  }, []);

  const updateDraft = (patch) => {
    setPlanDraft(prev => {
      const next = { ...prev, ...patch };
      if (next.ddType === "static") next.floorLock = null;
      else if (!next.floorLock) next.floorLock = "at_capital";
      if (next.dailyLoss === null || next.dailyLoss === undefined) next.dailyLossIsFatal = false;
      if (!next.consistency) next.consistencyType = null;
      else if (!next.consistencyType) next.consistencyType = "vs_total";
      if (next.phases === 2 && !next.phase2) next.phase2 = { target: next.target, minDays: 0, maxDays: null };
      return next;
    });
  };
  const updatePhase2 = (patch) =>
    setPlanDraft(prev => ({ ...prev, phase2: { ...(prev.phase2 || {}), ...patch } }));

  // ─── Simulation handlers ───
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRun = () => {
    if (!planDraft) return;
    setLoading(true);
    setResults(null);
    setActiveTab("oracle");
    setTimeout(() => {
      try {
        const fundedRules = strategy.postPassEnabled
          ? resolveFundedRules(planDraft, selectedFirm?.id, strategy.fundedOverride || {})
          : null;
        setResults(runMonteCarlo(planDraft, strategy, nSims, fundedRules));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 30);
  };

  const addToCompare = () => {
    if (!planDraft || !selectedFirm || compareSlots.length >= 4) return;
    setCompareSlots(s => [...s, {
      id: Date.now() + Math.random(),
      firmId: selectedFirm.id,
      firmName: selectedFirm.name,
      planLabel: planDraft.label + (isModified ? " · mod" : ""),
      plan: { ...planDraft, phase2: planDraft.phase2 ? { ...planDraft.phase2 } : undefined },
      results: null,
    }]);
  };
  const removeFromCompare = (id) => setCompareSlots(s => s.filter(x => x.id !== id));
  const clearCompare = () => setCompareSlots([]);
  const runAllCompare = () => {
    if (compareSlots.length < 2) return;
    setCompareLoading(true);
    setTimeout(() => {
      try {
        setCompareSlots(compareSlots.map(slot => {
          const fr = strategy.postPassEnabled
            ? resolveFundedRules(slot.plan, slot.firmId, strategy.fundedOverride || {})
            : null;
          return { ...slot, results: runMonteCarlo(slot.plan, strategy, nSims, fr) };
        }));
      } catch (e) { console.error(e); }
      finally { setCompareLoading(false); }
    }, 30);
  };

  const applyCalibration = (strategyPatch) => {
    setStrategy(prev => ({ ...prev, ...strategyPatch }));
    setShowCsvModal(false);
  };

  // ─── Export handlers ───
  const exportJSON = () => {
    if (!results) return;
    downloadJSON(`propforge-${selectedFirm?.id}-${planDraft?.planId}-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(),
      firm: { id: selectedFirm?.id, name: selectedFirm?.name, subtitle: selectedFirm?.subtitle },
      plan: planDraft, strategy, nSims, results,
    });
  };
  const exportPNG = (ref, name) => exportPNGHelper(ref, `${name}-${Date.now()}`, C.ink);
  const exportCompareJSON = () => {
    if (!compareSlots.length) return;
    downloadJSON(`propforge-compare-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(), strategy, nSims,
      slots: compareSlots.map(s => ({ firmId: s.firmId, firmName: s.firmName,
        planLabel: s.planLabel, plan: s.plan, results: s.results })),
    });
  };

  return (
    <div style={{ minHeight: "100vh", color: C.linen }} data-testid="app-root">
      <Header />

      <div className="pf-tabs-wrap">
        <div className="pf-tabs" role="tablist" data-testid="pf-tabs">
          {[
            { id: "chamber",  num: "01", label: t("tab_01") },
            { id: "strategy", num: "02", label: t("tab_02") },
            { id: "oracle",   num: "03", label: t("tab_03") },
            { id: "gloss",    num: "04", label: t("tab_04") },
          ].map(tab => (
            <button key={tab.id}
                    className={`pf-tab ${activeTab === tab.id ? "active" : ""}`}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => handleTabClick(tab.id)}>
              <span className="num">{tab.num}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {stripeBanner && (
        <div className={`stripe-banner stripe-banner--${stripeBanner.type}`} data-testid="stripe-banner">
          {stripeBanner.message}
        </div>
      )}

      {activeTab === "chamber" && (
        <ChamberTab
          marketFilter={marketFilter} setMarketFilter={setMarketFilter}
          welcomeOpen={welcomeOpen} setWelcomeOpen={setWelcomeOpen}
          filteredRegular={filteredRegular} customFirm={customFirm}
          selectedFirm={selectedFirm} selectedFirmId={selectedFirmId} selectFirm={selectFirm}
          selectedPlanId={selectedPlanId} selectPlan={selectPlan}
          isCustomMode={isCustomMode} planDraft={planDraft} isModified={isModified}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "strategy" && (
        <StrategyTab
          planDraft={planDraft} strategy={strategy} setStrategy={setStrategy}
          selectedFirm={selectedFirm} isCustomMode={isCustomMode} isModified={isModified}
          showAccountEditor={showAccountEditor} setShowAccountEditor={setShowAccountEditor}
          customUnlocked={customUnlocked} setCustomUnlocked={setCustomUnlocked}
          presetPlan={presetPlan} selectPlan={selectPlan}
          updateDraft={updateDraft} updatePhase2={updatePhase2}
          nSims={nSims} setNSims={setNSims} loading={loading} handleRun={handleRun}
          compareSlots={compareSlots} addToCompare={addToCompare}
          removeFromCompare={removeFromCompare} clearCompare={clearCompare}
          runAllCompare={runAllCompare} compareLoading={compareLoading}
          setShowCsvModal={setShowCsvModal}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "oracle" && (
        <Suspense fallback={<LoadingFallback message="loading results..." />}>
          <OracleTab
            results={results} loading={loading}
            planDraft={planDraft} selectedFirm={selectedFirm} isModified={isModified}
            resultsRef={resultsRef} compareRef={compareRef} compareSlots={compareSlots}
            exportJSON={exportJSON} exportPNG={exportPNG} exportCompareJSON={exportCompareJSON}
            setActiveTab={setActiveTab}
          />
        </Suspense>
      )}

      {activeTab === "gloss" && (
        <div className="pf-tab-body fg-fadein" data-testid="pane-gloss">
          <div className="pf-tab-head">
            <div className="pf-tab-watermark">04</div>
            <div className="pf-tab-kicker">04 · gloss</div>
            <h2 className="pf-tab-title">{t("tab_04_title")}</h2>
            <div className="pf-tab-hint">{t("tab_04_hint")}</div>
          </div>
          <Suspense fallback={<LoadingFallback message="opening the archive..." />}>
            <Glossary />
          </Suspense>
        </div>
      )}

      <Footer />
      {showCsvModal && <CsvModal onClose={() => setShowCsvModal(false)} onApply={applyCalibration} />}
    </div>
  );
}

export default App;
