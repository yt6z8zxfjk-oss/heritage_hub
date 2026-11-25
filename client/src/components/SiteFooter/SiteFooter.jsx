import { useI18n } from "../../i18n/language.jsx";
import "./SiteFooter.css";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="footer" id="contacts">
      <svg className="footer__river" viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 16c90-12 150 10 240 0s160-14 250 2 150 12 240-2 170-16 250 0 140 10 220 0"
          fill="none"
          stroke="#7ea36a"
          strokeWidth="1.5"
        />
      </svg>
      <div className="container footer__bar">
        <p>{t("footer")}</p>
      </div>
    </footer>
  );
}
