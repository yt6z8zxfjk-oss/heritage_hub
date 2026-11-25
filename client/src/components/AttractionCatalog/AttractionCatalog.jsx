import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { placeName } from "../../i18n/copy";
import { localAttraction } from "../../i18n/localize";
import { AttractionCard } from "../AttractionCard/AttractionCard";
import { Reveal } from "../Reveal/Reveal";
import "./AttractionCatalog.css";

export function AttractionCatalog({
  items,
  choices,
  query,
  onQuery,
  loading,
  emptyMessage,
  districts,
  district,
  onDistrict,
  focusId,
  onFocus,
}) {
  const { lang, t } = useI18n();
  const { id, name } = useOblast();
  return (
    <section className="section" id="catalog">
      <div className="container catalog">
        <div className="catalog__head">
          <div>
            <h2 className="section__title">{id === "gomel" ? t("catalogTitle") : name}</h2>
          </div>
          <div className="catalog__tools">
            <label className="field catalog__district">
              <span>{t("district")}</span>
              <select value={district} onChange={(event) => onDistrict(event.target.value)}>
                <option value="">{t("allDistricts")}</option>
                {districts.map((item) => (
                  <option key={item.title} value={item.title}>
                    {placeName(item.title, lang)} · {item.count}
                  </option>
                ))}
                {district && !districts.some((item) => item.title === district) ? (
                  <option value={district}>{placeName(district, lang)}</option>
                ) : null}
              </select>
            </label>
            <form className="catalog__search" role="search" onSubmit={(event) => event.preventDefault()}>
              <label className="field">
                <span>{t("search")}</span>
                <input
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  placeholder={t("searchHint")}
                />
              </label>
            </form>
          </div>
        </div>
        {district ? (
          <div className="catalog__filters catalog__filters--places" role="group" aria-label={t("districtPlaces")}>
            <button type="button" className={`catalog__chip ${focusId ? "" : "is-active"}`} onClick={() => onFocus("")}>
              {t("allInDistrict")}
            </button>
            {choices.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`catalog__chip ${focusId === item.id ? "is-active" : ""}`}
                onClick={() => onFocus(item.id)}
              >
                {localAttraction(item, lang).title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="catalog__grid place-list">
          {items.map((item) => (
            <Reveal key={item.id}>
              <AttractionCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
