import { useState } from "react";
import { useI18n } from "../../i18n/language.jsx";
import { belarusRegions } from "./regions";
import "./BelarusMap.css";

const legend = belarusRegions.filter((region) => region.id !== "minsk-city");

const lakes = [
  { cx: 230, cy: 118, rx: 16, ry: 9 },
  { cx: 268, cy: 146, rx: 11, ry: 7 },
  { cx: 198, cy: 168, rx: 13, ry: 8 },
  { cx: 310, cy: 210, rx: 18, ry: 10 },
  { cx: 360, cy: 96, rx: 9, ry: 6 },
];

const forests = [
  ["vitebsk", "#145c38", "#3d9a55"],
  ["grodno", "#2a7a3e", "#7aaa3a"],
  ["minsk", "#146b62", "#3aaa8c"],
  ["mogilev", "#1d6844", "#5a9a48"],
  ["brest", "#147888", "#3aaf98"],
];

const regionEn = {
  vitebsk: "Vitebsk",
  grodno: "Grodno",
  brest: "Brest",
  minsk: "Minsk",
  mogilev: "Mogilev",
  gomel: "Gomel",
  "minsk-city": "Minsk",
};

export function BelarusMap({ stage = false }) {
  const { lang, t } = useI18n();
  const notes = {
    vitebsk: { tag: t("tagLakes"), text: t("noteVitebsk") },
    grodno: { tag: t("tagNeman"), text: t("noteGrodno") },
    minsk: { tag: t("tagCenter"), text: t("noteMinsk") },
    mogilev: { tag: t("tagDnieper"), text: t("noteMogilev") },
    brest: { tag: t("tagPushcha"), text: t("noteBrest") },
    gomel: { tag: t("tagHome"), text: t("noteGomel") },
  };
  const tricks = [
    { id: "vitebsk", label: t("lakes") },
    { id: "brest", label: t("forest") },
    { id: "gomel", label: t("homeGomel") },
  ];
  const label = (region) => (lang === "en" ? regionEn[region.id] || region.name : region.name);
  const [active, setActive] = useState("gomel");
  const current = legend.find((region) => region.id === active) || legend.find((region) => region.home);

  function select(region) {
    setActive(region.id === "minsk-city" ? "minsk" : region.id);
  }

  return (
    <figure className={`belarus-map ${stage ? "belarus-map--stage" : ""}`}>
      {stage ? (
        <div className="belarus-map__tricks">
          {tricks.map((trick) => (
            <button key={trick.id} type="button" className={active === trick.id ? "is-on" : ""} onClick={() => setActive(trick.id)}>
              {trick.label}
            </button>
          ))}
        </div>
      ) : null}
      <svg viewBox="0 0 640 586" role="img" aria-label={t("mapLive")}>
        <defs>
          {forests.map(([id, from, to]) => (
            <linearGradient key={id} id={`fill-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          ))}
          <linearGradient id="fill-gomel" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0e7a45">
              <animate attributeName="stop-color" values="#0e7a45;#1f9a52;#c9a24a;#0e7a45" dur="9s" repeatCount="indefinite" />
            </stop>
            <stop offset="0.55" stopColor="#1c8f62">
              <animate attributeName="stop-color" values="#1c8f62;#3cb87a;#e2b15a;#1c8f62" dur="9s" repeatCount="indefinite" />
            </stop>
            <stop offset="1" stopColor="#0f6a55">
              <animate attributeName="stop-color" values="#0f6a55;#17829a;#1c8f62;#0f6a55" dur="9s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <radialGradient id="lake-fill" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#e9fbff" />
            <stop offset="0.45" stopColor="#7ed0ea" />
            <stop offset="1" stopColor="#1a7f9c" />
          </radialGradient>
        </defs>
        {belarusRegions.map((region) => {
          const key = region.id === "minsk-city" ? "minsk" : region.id;
          return (
            <path
              key={region.id}
              d={region.d}
              data-region={key}
              className={region.home ? "belarus-map__gomel" : "belarus-map__region"}
              data-active={active === key ? "true" : "false"}
              tabIndex={region.id === "minsk-city" ? -1 : 0}
              onMouseEnter={() => select(region)}
              onFocus={() => select(region)}
              onClick={() => {
                select(region);
                if (region.home && !stage) {
                  document.getElementById("history")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <title>{label(region)} {t("oblast")}</title>
            </path>
          );
        })}
        {lakes.map((lake) => (
          <ellipse key={`${lake.cx}-${lake.cy}`} className="belarus-map__lake" {...lake} />
        ))}
      </svg>
      <div className="belarus-map__legend" role="list">
        {legend.map((region) => (
          <button
            key={region.id}
            type="button"
            role="listitem"
            className={region.home ? "is-home" : ""}
            data-active={active === region.id ? "true" : "false"}
            onClick={() => select(region)}
          >
            {label(region)}
          </button>
        ))}
      </div>
      <figcaption>
        <strong>
          {label(current)} {t("oblast")}
        </strong>
        {stage ? <em>{notes[current.id]?.tag}</em> : null}
        <span>{stage ? notes[current.id]?.text : current.home ? t("captionHome") : t("captionOther")}</span>
        {current.home ? <a href={stage ? "#catalog" : "#history"}>{stage ? t("seePlaces") : t("openHistory")}</a> : null}
      </figcaption>
    </figure>
  );
}
