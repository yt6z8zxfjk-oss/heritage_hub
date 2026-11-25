import { Link } from "react-router-dom";
import { useI18n } from "../i18n/language.jsx";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <section className="section container">
      <h1>{t("notFound")}</h1>
      <p className="section__lead">{t("notFoundLead")}</p>
      <Link className="btn btn-primary" to="/">
        {t("toHome")}
      </Link>
    </section>
  );
}
