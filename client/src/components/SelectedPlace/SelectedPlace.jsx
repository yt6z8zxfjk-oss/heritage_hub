import { useI18n } from "../../i18n/language.jsx";
import { placeName } from "../../i18n/copy";
import { localAttraction } from "../../i18n/localize";
import { starText } from "../CoverImage/CoverImage";
import "./SelectedPlace.css";

export function SelectedPlace({ item, onOpen, onAdd }) {
  const { lang, t } = useI18n();
  const view = item ? localAttraction(item, lang) : null;
  if (!item) {
    return (
      <div className="selected-place">
        <h3>{t("placeOnMap")}</h3>
        <p>{t("placeHint")}</p>
      </div>
    );
  }

  return (
    <div className="selected-place">
      <p className="selected-place__place">{placeName(item.place, lang)}</p>
      <h3>{view.title}</h3>
      {typeof item.rating === "number" ? (
        <p className="stars" aria-label={`${t("rating")} ${item.rating} ${t("of5")}`}>
          {starText(item.rating)} {item.rating}
        </p>
      ) : null}
      <p>
        <strong>{t("hours")}</strong> {view.workHours}
      </p>
      <p>{view.address}</p>
      <p className="selected-place__hint">{t("tapAgain")}</p>
      <div className="selected-place__actions">
        <button type="button" className="btn btn-primary btn-small" onClick={onOpen}>
          {t("openObject")}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onAdd}>
          {t("addRoute")}
        </button>
      </div>
    </div>
  );
}
