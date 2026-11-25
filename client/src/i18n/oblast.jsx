import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { oblastById, oblastLabel, oblastList } from "../data/oblasts";
import { useI18n } from "./language.jsx";

const OblastContext = createContext(null);
const ids = new Set(oblastList.map((item) => item.id));

export function OblastProvider({ children }) {
  const { lang } = useI18n();
  const [id, setId] = useState(() => {
    const stored = localStorage.getItem("heritage-oblast");
    return ids.has(stored) ? stored : "gomel";
  });

  function setOblast(next) {
    const value = ids.has(next) ? next : "gomel";
    localStorage.setItem("heritage-oblast", value);
    setId(value);
  }

  const current = oblastById(id);

  useEffect(() => {
    document.title = `Heritage Hub — ${oblastLabel(current, lang)}`;
  }, [current, lang]);

  const value = useMemo(
    () => ({
      id,
      setOblast,
      current,
      name: oblastLabel(current, lang),
    }),
    [id, current, lang]
  );

  return <OblastContext.Provider value={value}>{children}</OblastContext.Provider>;
}

export function useOblast() {
  const value = useContext(OblastContext);
  if (!value) {
    throw new Error("Область открыта вне страницы");
  }
  return value;
}
