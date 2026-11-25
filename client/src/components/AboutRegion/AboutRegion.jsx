import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { localGuide } from "../../i18n/localize";
import "./AboutRegion.css";

const anchorPages = {
  "#catalog": "/places",
  "#map": "/map",
  "#routes": "/routes",
  "#history": "/history",
  "#country": "/country",
  "#about": "/",
};

export function AboutRegion() {
  const { lang, t } = useI18n();
  const { id } = useOblast();
  const actionLabel = {
    district: t("openPlaces"),
    category: t("openPlaces"),
    search: t("openPlaces"),
    anchor: t("goThere"),
  };
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);

  useEffect(() => {
    api("/guides")
      .then((data) => setCards(data.items))
      .catch(() => {});
  }, [id]);

  function openCard(card) {
    if (card.kind === "district") {
      navigate(`/places?district=${encodeURIComponent(card.target)}`);
      return;
    }
    if (card.kind === "category") {
      navigate(`/places?category=${encodeURIComponent(card.target)}`);
      return;
    }
    if (card.kind === "search") {
      navigate(`/places?q=${encodeURIComponent(card.target)}`);
      return;
    }
    navigate(anchorPages[card.target] || "/places");
  }

  return (
    <section className="section" id="about">
      <div className="container about">
        <p className="section__eyebrow">{t("startEyebrow")}</p>
        <h2 className="section__title">{t("startTitle")}</h2>
        <div className="about__facts">
          {cards.map((card) => {
            const view = localGuide(card, lang);
            return (
            <button type="button" className="about__card" key={card.id} onClick={() => openCard(card)}>
              <img src={card.photo} alt="" />
              <h3>{view.title}</h3>
              <p>{view.text}</p>
              <span className="about__go">{actionLabel[card.kind] || t("open")}</span>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
