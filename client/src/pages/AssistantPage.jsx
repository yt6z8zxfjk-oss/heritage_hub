import { useI18n } from "../i18n/language.jsx";
import { AiMark } from "../components/AiMark/AiMark";
import { RouteAssistant } from "../components/RouteAssistant/RouteAssistant";
import "./AssistantPage.css";

export function AssistantPage() {
  const { t } = useI18n();
  return (
    <section className="assistant-page">
      <header className="assistant-page__head">
        <span className="assistant-page__mark">
          <AiMark />
        </span>
        <h1>{t("chatTitle")}</h1>
        <p>{t("chatLead")}</p>
      </header>
      <RouteAssistant />
    </section>
  );
}
