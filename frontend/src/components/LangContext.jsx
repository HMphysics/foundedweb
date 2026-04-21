// Language context + hook. Single source of truth for active language + t().
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { makeT, detectBrowserLang } from "../i18n";

export const LangCtx = createContext({
  lang: "en",
  t: makeT("en"),
  setLang: () => {},
});

export const useT = () => useContext(LangCtx);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(detectBrowserLang());
  const t = useMemo(() => makeT(lang), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, t, setLang }}>{children}</LangCtx.Provider>;
}
