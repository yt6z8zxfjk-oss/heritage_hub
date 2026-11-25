import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { placeName } from "../../i18n/copy";
import { localAttraction } from "../../i18n/localize";
import { CoverImage, starText } from "../CoverImage/CoverImage";
import "./AttractionCard.css";

export function AttractionCard({ item }) {
  const { lang, t } = useI18n();
  const view = localAttraction(item, lang);
  const photo = view.photos[0];
  return (
    <article className="place-card">
      <Link to={`/object/${item.id}`} className="place-card__media">
        <CoverImage src={photo?.url} alt={photo?.alt || view.title} />
      </Link>
      <div className="place-card__body">
        <p className="place-card__place">
          {placeName(item.place, lang)}
          {item.district && item.district !== item.place ? ` · ${placeName(item.district, lang)}` : ""}
        </p>
        <h3>
          <Link to={`/object/${item.id}`}>{view.title}</Link>
        </h3>
        <p className="place-card__meta">
          {typeof item.rating === "number" ? (
            <span className="stars" aria-label={`${t("rating")} ${item.rating} ${t("of5")}`}>
              {starText(item.rating)} {item.rating}
            </span>
          ) : null}
          <span>{view.workHours}</span>
        </p>
        <p className="story place-card__text">{view.description}</p>
      </div>
    </article>
  );
}
