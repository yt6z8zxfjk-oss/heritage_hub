import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { oblastLabel, oblastLead, oblastList } from "../../data/oblasts";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { placeName } from "../../i18n/copy";
import { localAttraction } from "../../i18n/localize";
import { belarusDistricts } from "../DistrictMap/districts";
import { districtMeta } from "../DistrictMap/districtMeta";
import "./HeroSection.css";

const pinFit = {
  brest: { a: 93.73, b: -2153.31, c: -144.272, d: 8128.61 },
  vitebsk: { a: 95.641, b: -2216.46, c: -136.53, d: 7699.48 },
  grodno: { a: 80.552, b: -1828.13, c: -138.741, d: 7837.94 },
  minsk: { a: 96.185, b: -2228.45, c: -142.301, d: 8025.06 },
  mogilev: { a: 92.739, b: -2134.1, c: -145.449, d: 8203.43 },
};

function fitPoint(lat, lng, fit) {
  return { x: fit.a * lng + fit.b, y: fit.c * lat + fit.d };
}

function pathsBox(items) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of items) {
    const box = pathBox(item.d);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.w);
    maxY = Math.max(maxY, box.y + box.h);
  }
  if (!Number.isFinite(minX)) {
    return "0 0 100 100";
  }
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

function pathBox(d) {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let index = 0; index + 1 < nums.length; index += 2) {
    minX = Math.min(minX, nums[index]);
    maxX = Math.max(maxX, nums[index]);
    minY = Math.min(minY, nums[index + 1]);
    maxY = Math.max(maxY, nums[index + 1]);
  }
  const pad = 16;
  return {
    x: minX - pad,
    y: minY - pad,
    w: Math.max(40, maxX - minX + pad * 2),
    h: Math.max(40, maxY - minY + pad * 2),
  };
}

function pinPoint(lat, lng) {
  return {
    x: 100.34 * lng - 2375.4,
    y: -134.13 * lat + 7619.1,
  };
}

let probeSvg = null;
const pathCache = new Map();

function probe() {
  if (probeSvg || typeof document === "undefined") {
    return probeSvg;
  }
  probeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  probeSvg.setAttribute("aria-hidden", "true");
  probeSvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(probeSvg);
  return probeSvg;
}

function pathEl(d) {
  const svg = probe();
  if (!svg) {
    return null;
  }
  let element = pathCache.get(d);
  if (!element) {
    element = document.createElementNS("http://www.w3.org/2000/svg", "path");
    element.setAttribute("d", d);
    svg.appendChild(element);
    pathCache.set(d, element);
  }
  return element;
}

function insideDistricts(point, districts) {
  const svg = probe();
  if (!svg || !districts.length) {
    return true;
  }
  const spot = svg.createSVGPoint();
  spot.x = point.x;
  spot.y = point.y;
  return districts
    .map((item) => pathEl(item.d))
    .filter(Boolean)
    .some((path) => path.isPointInFill(spot));
}

function pullInside(point, origin, districts) {
  if (insideDistricts(point, districts)) {
    return point;
  }
  let inside = origin;
  let outside = point;
  for (let step = 0; step < 8; step += 1) {
    const mid = { x: (inside.x + outside.x) / 2, y: (inside.y + outside.y) / 2 };
    if (insideDistricts(mid, districts)) {
      inside = mid;
    } else {
      outside = mid;
    }
  }
  return inside;
}

function spreadPins(points, districts, gap, maxShift) {
  const next = points.map((point) => ({ x: point.x, y: point.y }));
  const origin = points.map((point) => ({ x: point.x, y: point.y }));
  for (let pass = 0; pass < 28; pass += 1) {
    for (let left = 0; left < next.length; left += 1) {
      for (let right = left + 1; right < next.length; right += 1) {
        let dx = next[right].x - next[left].x;
        let dy = next[right].y - next[left].y;
        let distance = Math.hypot(dx, dy);
        if (distance < 0.4) {
          const angle = ((left + 1) * 2.399 + pass * 0.17) % (Math.PI * 2);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        if (distance >= gap) {
          continue;
        }
        const push = (gap - distance) / 2;
        next[left].x -= (dx / distance) * push;
        next[left].y -= (dy / distance) * push;
        next[right].x += (dx / distance) * push;
        next[right].y += (dy / distance) * push;
      }
    }
    for (let index = 0; index < next.length; index += 1) {
      const dx = next[index].x - origin[index].x;
      const dy = next[index].y - origin[index].y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxShift) {
        next[index].x = origin[index].x + (dx / distance) * maxShift;
        next[index].y = origin[index].y + (dy / distance) * maxShift;
      }
      const kept = pullInside(next[index], origin[index], districts);
      next[index].x = kept.x;
      next[index].y = kept.y;
    }
  }
  return next;
}

function placePin(point, districts) {
  const svg = probe();
  if (!svg || !districts.length) {
    return point;
  }
  const spot = svg.createSVGPoint();
  spot.x = point.x;
  spot.y = point.y;
  const paths = districts.map((item) => pathEl(item.d)).filter(Boolean);
  if (paths.some((path) => path.isPointInFill(spot))) {
    return point;
  }
  let nearest = null;
  for (const path of paths) {
    const length = path.getTotalLength();
    const step = Math.max(6, length / 70);
    for (let index = 0; index <= length; index += step) {
      const sample = path.getPointAtLength(index);
      const distance = Math.hypot(sample.x - point.x, sample.y - point.y);
      if (!nearest || distance < nearest.distance) {
        nearest = { distance, x: sample.x, y: sample.y, path };
      }
    }
  }
  if (!nearest) {
    return point;
  }
  const box = nearest.path.getBBox();
  const towardX = box.x + box.width / 2 - nearest.x;
  const towardY = box.y + box.height / 2 - nearest.y;
  const length = Math.hypot(towardX, towardY) || 1;
  return { x: nearest.x + (towardX / length) * 8, y: nearest.y + (towardY / length) * 8 };
}

const HOLD = 6400;

export function HeroSection() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const { id, setOblast, current } = useOblast();
  const [places, setPlaces] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let stop = false;
    setIndex(0);
    api("/attractions")
      .then((data) => {
        if (!stop) {
          setPlaces((data.items || []).filter((item) => item.photos?.[0]?.url && item.lat && item.lng));
        }
      })
      .catch(() => {
        if (!stop) {
          setPlaces([]);
        }
      });
    return () => {
      stop = true;
    };
  }, [id]);

  useEffect(() => {
    if (paused || places.length < 2) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setIndex((value) => (value + 1) % places.length);
    }, HOLD);
    return () => clearTimeout(timer);
  }, [paused, places.length, index]);

  const place = places[index];
  const photo = place?.photos?.[0]?.url || `/flags/${id}.svg`;
  const oblastDistricts = belarusDistricts.filter((item) => districtMeta[item.id]?.oblast === id);
  const where = place
    ? [place.place, place.district && place.district !== place.place ? place.district : ""]
        .filter(Boolean)
        .map((part) => placeName(part, lang))
        .join(" · ")
    : oblastLabel(current, lang);

  function step(direction) {
    if (!places.length) {
      return;
    }
    setIndex((value) => (value + direction + places.length) % places.length);
  }

  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="oblast-switch" role="group" aria-label={t("oblastPick")}>
            {oblastList.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === id ? "is-on" : ""}
                aria-pressed={item.id === id}
                onClick={() => setOblast(item.id)}
              >
                {oblastLabel(item, lang).replace(/ область$| region$| вобласць$/i, "")}
              </button>
            ))}
          </div>
          <h1>
            <span>
              <i>{t("heroTitle1")}</i>
            </span>
            <span>
              <i>{t("heroTitle2")}</i>
            </span>
          </h1>
          <p className="hero__sub">{t("heroSub")}</p>
          <p className="story hero__lead">{oblastLead(current, lang)}</p>
          <div className="hero__actions">
            <Link className="btn btn-primary" to="/places">
              {t("heroPlaces")}
            </Link>
            <Link className="btn btn-ghost" to="/map">
              {t("heroMap")}
            </Link>
          </div>
        </div>

        <div className="hero__stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="hero__frame hero__map">
            <svg viewBox={id === "gomel" ? "360 400 490 360" : pathsBox(oblastDistricts)} role="img" aria-label={oblastLabel(current, lang)}>
              {oblastDistricts.map((item) => {
                const filter = item.filter || districtMeta[item.id].filter;
                return (
                    <path
                      key={item.id}
                      d={item.d}
                      className={place?.district === filter ? "is-on" : ""}
                      onClick={() => {
                        if (filter) {
                          navigate(`/places?district=${encodeURIComponent(filter)}`);
                        }
                      }}
                    >
                      <title>{placeName(item.name, lang)}</title>
                    </path>
                );
              })}
              {spreadPins(
                places.map((item) => {
                  const raw = id === "gomel" ? pinPoint(item.lat, item.lng) : fitPoint(item.lat, item.lng, pinFit[id]);
                  return placePin(raw, oblastDistricts);
                }),
                oblastDistricts,
                11,
                28
              ).map((point, itemIndex) => {
                const item = places[itemIndex];
                const active = itemIndex === index;
                return (
                  <g
                    key={item.id}
                    className={active ? "is-active" : ""}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIndex(itemIndex);
                    }}
                  >
                    {active ? <circle className="hero__pulse" cx={point.x} cy={point.y} r="8" /> : null}
                    <circle className="hero__pin" cx={point.x} cy={point.y} r={active ? 6.5 : 3.4} />
                  </g>
                );
              })}
            </svg>
            <img className="hero__polaroid" key={photo} src={photo} alt="" />
          </div>
          <article className="hero__slip">
            <img key={photo} src={photo} alt="" />
            <div className="hero__slip-copy">
              <p>{where}</p>
              <h2>{place ? localAttraction(place, lang).title : t("heroFallback")}</h2>
            </div>
            <div className="hero__slip-nav">
              <button type="button" onClick={() => step(-1)} aria-label={t("heroPrev")}>
                ‹
              </button>
              <Link to={place ? `/object/${place.id}` : "/places"}>{t("heroOpen")}</Link>
              <button type="button" className="hero__next" onClick={() => step(1)} aria-label={t("heroNext")}>
                <svg viewBox="0 0 36 36" aria-hidden="true">
                  <circle className="hero__ring-track" cx="18" cy="18" r="15" />
                  <circle className={`hero__ring ${paused ? "is-paused" : ""}`} key={index} cx="18" cy="18" r="15" />
                </svg>
                <span>›</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
