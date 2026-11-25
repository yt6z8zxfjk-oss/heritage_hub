import { useI18n } from "../../i18n/language.jsx";
import "./LanguageSwitch.css";

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t("lang")}>
      <button type="button" className={lang === "ru" ? "is-on" : ""} onClick={() => setLang("ru")} aria-pressed={lang === "ru"}>
        RU
      </button>
      <button type="button" className={lang === "en" ? "is-on" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
        EN
      </button>
      <button type="button" className={lang === "be" ? "is-on" : ""} onClick={() => setLang("be")} aria-pressed={lang === "be"}>
        BE
      </button>
    </div>
  );
}
