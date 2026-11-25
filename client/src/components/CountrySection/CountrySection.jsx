import { useI18n } from "../../i18n/language.jsx";
import { DistrictMap } from "../DistrictMap/DistrictMap";
import "./CountrySection.css";

export function CountrySection({ onDistrict }) {
  const { t } = useI18n();
  return (
    <section className="section" id="country">
      <div className="container country">
        <div className="country__copy">
          <p className="section__eyebrow">{t("belarus")}</p>
          <h2 className="section__title">{t("countryTitle")}</h2>
          <p className="story section__lead">{t("countryLead")}</p>
        </div>
        <DistrictMap onDistrict={onDistrict} />
      </div>
    </section>
  );
}
