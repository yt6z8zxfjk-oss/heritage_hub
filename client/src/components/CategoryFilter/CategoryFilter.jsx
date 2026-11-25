import { useI18n } from "../../i18n/language.jsx";
import { categoryName } from "../../i18n/copy";
import { categoryText } from "../../i18n/localize";
import { Reveal } from "../Reveal/Reveal";
import "./CategoryFilter.css";

const covers = {
  architecture: "/photos/palace.jpg",
  museum: "/photos/vetka.jpg",
  park: "/photos/park.jpg",
  monument: "/photos/turov.jpg",
  religion: "/photos/cathedral.jpg",
  nature: "/photos/pripyat-dunes.jpg",
};

export function CategoryFilter({ categories, activeId, onSelect }) {
  const { lang, t } = useI18n();
  return (
    <section className="section category-filter ornament-field ornament-field--accent" aria-labelledby="categories-title">
      <div className="container">
        <Reveal>
          <p className="section__eyebrow">{t("categories")}</p>
          <h2 className="section__title" id="categories-title">
            {t("chooseWatch")}
          </h2>
        </Reveal>
        <div className="category-filter__grid">
          <button
            type="button"
            className={`category-card ${activeId ? "" : "is-active"}`}
            onClick={() => onSelect("")}
          >
            <img src="/photos/sozh.jpg" alt="" />
            <span className="category-card__shade" />
            <strong>{t("allPlaces")}</strong>
            <span>{t("fullCatalog")}</span>
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`category-card ${activeId === category.id ? "is-active" : ""}`}
              onClick={() => {
                onSelect(category.id);
                document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <img src={covers[category.slug] || "/photos/palace.jpg"} alt="" />
              <span className="category-card__shade" />
              <strong>{categoryName(category, lang, t)}</strong>
              <span>{categoryText(category, lang)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
