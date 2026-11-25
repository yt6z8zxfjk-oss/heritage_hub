import { useEffect, useState } from "react";
import { oblastById, oblastLabel } from "../../data/oblasts";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { placeName } from "../../i18n/copy";
import { belarusDistricts } from "./districts";
import { districtMeta } from "./districtMeta";
import "./DistrictMap.css";

function tone(name, home) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 33 + char.charCodeAt(0)) % 97;
  }
  if (home) {
    return `hsl(${72 + (hash % 28)} 62% ${42 + (hash % 16)}%)`;
  }
  return `hsl(${78 + (hash % 36)} 58% ${46 + (hash % 22)}%)`;
}

function infoOf(item) {
  return districtMeta[item.id] || { oblast: "", filter: item.filter || "" };
}

export function DistrictMap({ onDistrict }) {
  const { lang, t } = useI18n();
  const { id, setOblast } = useOblast();
  const [activeId, setActiveId] = useState("");
  const current = belarusDistricts.find((item) => item.id === activeId) || belarusDistricts.find((item) => infoOf(item).oblast === id) || belarusDistricts[0];
  const currentInfo = infoOf(current);

  useEffect(() => {
    const first = belarusDistricts.find((item) => infoOf(item).oblast === id);
    setActiveId(first?.id || "");
  }, [id]);

  function openPlaces() {
    const filter = current.filter || currentInfo.filter;
    if (!filter || !onDistrict) {
      return;
    }
    if (currentInfo.oblast && currentInfo.oblast !== id) {
      setOblast(currentInfo.oblast);
    }
    onDistrict(filter);
  }

  return (
    <div className="district-map">
      <svg viewBox="0 0 920 760" role="img" aria-label={t("countryMap")}>
        {belarusDistricts.map((item) => {
          const info = infoOf(item);
          const home = info.oblast === id;
          return (
          <path
            key={item.id}
            d={item.d}
            fill={tone(item.name, home)}
            className={item.id === current.id ? "is-active" : ""}
            data-home={home ? "true" : "false"}
            onMouseEnter={() => setActiveId(item.id)}
            onClick={() => {
              setActiveId(item.id);
              const filter = item.filter || info.filter;
              if (!filter || !onDistrict) {
                return;
              }
              if (info.oblast && info.oblast !== id) {
                setOblast(info.oblast);
              }
              onDistrict(filter);
            }}
          >
            <title>{placeName(item.name, lang)}</title>
          </path>
          );
        })}
        {belarusDistricts.map((item) => (
          <text key={`${item.id}-label`} x={item.x} y={item.y}>
            {placeName(item.name, lang)}
          </text>
        ))}
      </svg>
        <aside className="district-map__card" key={current.id}>
        <p>{currentInfo.oblast ? oblastLabel(oblastById(currentInfo.oblast), lang) : t("otherDistrict")}</p>
        <h3>{placeName(current.name, lang)}</h3>
        <span>{currentInfo.oblast === id ? t("districtOpen") : t("districtOther")}</span>
        {currentInfo.filter || current.filter ? (
          <button type="button" className="btn btn-primary" onClick={openPlaces}>
            {t("showDistrict")}
          </button>
        ) : null}
      </aside>
    </div>
  );
}
