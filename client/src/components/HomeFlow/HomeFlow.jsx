import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { localAttraction } from "../../i18n/localize";
import "./HomeFlow.css";

function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function useCount(target) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target) {
      return undefined;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 1100);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    const backup = setTimeout(() => setValue(target), 1200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(backup);
    };
  }, [target]);

  return value;
}

function Meter({ target, label }) {
  const value = useCount(target);
  return (
    <div className="home-meter">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function HomeFlow() {
  const { lang, t } = useI18n();
  const { id } = useOblast();
  const abilities = [
    { href: "/places", title: t("navPlaces"), text: t("abilityPlaces"), photo: "/photos/palace.jpg" },
    { href: "/map", title: t("navMap"), text: t("abilityMap"), photo: "/photos/sozh.jpg" },
    { href: "/routes", title: t("navRoutes"), text: t("abilityRoutes"), photo: "/photos/park.jpg" },
    { href: "/history", title: t("navHistory"), text: t("abilityHistory"), photo: "/photos/turov.jpg" },
    { href: "/country", title: t("navCountry"), text: t("abilityCountry"), photo: "/photos/pripyat-dunes.jpg" },
  ];
  const [stats, setStats] = useState({ places: 0, districts: 0, routes: 0, stories: 0 });
  const [reel, setReel] = useState([]);

  useEffect(() => {
    api("/attractions")
      .then((data) => {
        const items = data.items || [];
        setStats((current) => ({ ...current, places: items.length }));
        setReel(items.filter((item) => item.photos?.[0]?.url).slice(0, 12));
      })
      .catch(() => {});
    api("/districts")
      .then((data) => setStats((current) => ({ ...current, districts: data.items?.length || 0 })))
      .catch(() => {});
    api("/trips")
      .then((data) => setStats((current) => ({ ...current, routes: data.items?.length || 0 })))
      .catch(() => {});
    api("/stories")
      .then((data) => setStats((current) => ({ ...current, stories: data.items?.length || 0 })))
      .catch(() => {});
  }, [id]);

  const loop = reel.length ? [...reel, ...reel] : [];

  return (
    <div className="home-flow">
      <section className="home-meters" aria-label={t("meters")}>
        <div className="container home-meters__row">
          <Meter target={stats.places} label={lang === "en" ? t(stats.places === 1 ? "placeOne" : "placeMany") : plural(stats.places, t("placeOne"), t("placeFew"), t("placeMany"))} />
          <Meter target={stats.districts} label={lang === "en" ? t(stats.districts === 1 ? "districtOne" : "districtMany") : plural(stats.districts, t("districtOne"), t("districtFew"), t("districtMany"))} />
          <Meter target={stats.routes} label={lang === "en" ? t(stats.routes === 1 ? "routeOne" : "routeMany") : plural(stats.routes, t("routeOne"), t("routeFew"), t("routeMany"))} />
          <Meter target={stats.stories} label={lang === "en" ? t(stats.stories === 1 ? "storyOne" : "storyMany") : plural(stats.stories, t("storyOne"), t("storyFew"), t("storyMany"))} />
        </div>
      </section>

      {loop.length ? (
        <section className="reel" aria-label={t("reel")}>
          <div className="reel__track">
            {loop.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                to={`/object/${item.id}`}
                className="reel__card"
                tabIndex={index >= reel.length ? -1 : undefined}
                aria-hidden={index >= reel.length ? true : undefined}
              >
                <img src={item.photos[0].url} alt="" />
                <span>{localAttraction(item, lang).title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="abilities">
        <div className="container">
          <p className="section__eyebrow">{t("sections")}</p>
          <h2 className="section__title">{t("lookIn")}</h2>
          <ul>
            {abilities.map((item, index) => (
              <li key={item.href} style={{ animationDelay: `${index * 80}ms` }}>
                <Link to={item.href}>
                  <span className="abilities__index">0{index + 1}</span>
                  <span className="abilities__copy">
                    <strong>{item.title}</strong>
                    <em>{item.text}</em>
                  </span>
                  <img src={reel[index]?.photos?.[0]?.url || item.photo} alt="" />
                  <span className="abilities__go" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
