import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { localAttraction, localTrip } from "../../i18n/localize";
import { Reveal } from "../Reveal/Reveal";
import "./ReadyRoutes.css";

export function ReadyRoutes() {
  const { lang, t } = useI18n();
  const { id: oblastId } = useOblast();
  const [routes, setRoutes] = useState([]);
  const [bySlug, setBySlug] = useState(new Map());
  const [openId, setOpenId] = useState("");
  const [notice, setNotice] = useState("");
  const route = routes.length ? localTrip(routes.find((item) => item.id === openId) || routes[0], lang) : null;
  const cover = route ? route.stops.map((slug) => bySlug.get(slug)).find((item) => item?.photos?.[0]) : null;

  useEffect(() => {
    api("/attractions")
      .then((data) => {
        setBySlug(new Map(data.items.map((item) => [item.slug, item])));
      })
      .catch(() => {});
    api("/trips")
      .then((data) => {
        if (!data.items?.length) {
          return;
        }
        setRoutes(
          data.items.map((item) => ({
            id: item.slug,
            slug: item.slug,
            title: item.title,
            titleEn: item.titleEn,
            lead: item.lead,
            leadEn: item.leadEn,
            cafeTitleEn: item.cafeTitleEn,
            cafeNoteEn: item.cafeNoteEn,
            stops: item.stops,
            cafe: item.cafe,
          }))
        );
        setOpenId(data.items[0].slug);
      })
      .catch(() => {});
  }, [oblastId]);

  async function openInYandex() {
    const points = route.stops
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((item) => ({ lat: item.lat, lng: item.lng, title: item.title }));
    points.splice(Math.min(2, points.length), 0, {
      lat: route.cafe.lat,
      lng: route.cafe.lng,
      title: route.cafe.title,
    });
    try {
      const data = await api("/routes", {
        method: "POST",
        body: JSON.stringify({ points }),
      });
      window.open(data.url, "_blank", "noopener");
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <section className="section" id="routes">
      <div className="container">
        <Reveal>
          <p className="section__eyebrow">{t("routesEyebrow")}</p>
          <h2 className="section__title">{t("routesTitle")}</h2>
        </Reveal>
        <div className="route-picks" role="tablist" aria-label={t("readyRoutes")}>
          {routes.map((item, index) => {
            const thumb = item.stops.map((slug) => bySlug.get(slug)).find((place) => place?.photos?.[0]);
            const selected = item.id === route.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`route-pick ${selected ? "is-selected" : ""}`}
                onClick={() => setOpenId(item.id)}
              >
                {thumb ? <img src={thumb.photos[0].url} alt="" /> : <span>0{index + 1}</span>}
                <strong>{localTrip(item, lang).title}</strong>
              </button>
            );
          })}
        </div>
        {route ? <article className="route-detail" role="tabpanel" key={route.id}>
          {cover ? <img className="route-detail__photo" src={cover.photos[0].url} alt="" /> : null}
          <div className="route-detail__copy">
            <h3>{route.title}</h3>
            <p className="story">{route.lead}</p>
            <ol>
              {route.stops.map((slug) => {
                const item = bySlug.get(slug);
                const view = item ? localAttraction(item, lang) : null;
                const line = view ? [view.address, view.workHours].filter(Boolean).join(" · ") : "";
                return (
                  <li key={slug}>
                    {view ? <Link to={`/object/${item.id}`}>{view.title}</Link> : slug}
                    {line ? <small>{line}</small> : null}
                  </li>
                );
              })}
              <li className="route-detail__cafe">
                {route.cafe.title}
                <small>{route.cafe.note}</small>
              </li>
            </ol>
            <div className="route-detail__actions">
              <button type="button" className="btn btn-primary" onClick={openInYandex}>
                {t("openRoute")}
              </button>
            </div>
            {notice ? <p className="field-error">{notice}</p> : null}
          </div>
        </article> : null}
      </div>
    </section>
  );
}
