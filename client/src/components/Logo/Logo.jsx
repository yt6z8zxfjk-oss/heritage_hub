import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import "./Logo.css";

export function Logo() {
  const { t } = useI18n();
  const { id, name } = useOblast();
  return (
    <Link to="/" className="logo" aria-label={t("home")}>
      <img className="logo__mark" src={`/flags/${id}.svg`} alt="" />
      <span className="logo__words">
        <span className="logo__title">
          <span className="logo__title-wide">Спадчына</span>
          <span className="logo__title-peak">Роднага Краю</span>
        </span>
        <small>{name}</small>
      </span>
    </Link>
  );
}
