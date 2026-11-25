import { useI18n } from "../../i18n/language.jsx";
import { Reveal } from "../Reveal/Reveal";
import "./RouteGuide.css";

export function RouteGuide() {
  const { t } = useI18n();
  const steps = [
    { title: t("guide1"), text: t("guide1text") },
    { title: t("guide2"), text: t("guide2text") },
    { title: t("guide3"), text: t("guide3text") },
  ];
  return (
    <section className="section ornament-field ornament-field--to-left" id="routes">
      <div className="container">
        <Reveal>
          <p className="section__eyebrow">{t("routesEyebrow")}</p>
          <h2 className="section__title">{t("guideTitle")}</h2>
        </Reveal>
        <div className="route-guide">
          {steps.map((step, index) => (
            <Reveal key={step.title}>
              <article>
                <span>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
