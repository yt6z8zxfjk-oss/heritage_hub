import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copy } from "./copy";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem("heritage-lang");
    return stored === "en" || stored === "be" ? stored : "ru";
  });

  useEffect(() => {
    localStorage.setItem("heritage-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key) => (copy[lang] && copy[lang][key]) || copy.ru[key] || key,
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("Язык открыт вне страницы");
  }
  return value;
}
