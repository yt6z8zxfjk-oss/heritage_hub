import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { useTripContext } from "../../hooks/tripContext.jsx";
import { MapCanvas } from "../MapCanvas/MapCanvas";
import { RouteBuilder } from "../RouteBuilder/RouteBuilder";
import { SelectedPlace } from "../SelectedPlace/SelectedPlace";
import "./MapSection.css";

export function MapSection({ items, onGeoFilter, geoActive }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);
  const armedRef = useRef("");
  const [center, setCenter] = useState({ lat: 52.42, lng: 30.4 });
  const [radiusKm, setRadiusKm] = useState("40");
  const trip = useTripContext();
  const routePoints = trip.days.flatMap((day) => day.points);
  const mapItems = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    for (const point of trip.days.flatMap((day) => day.points)) {
      if (!byId.has(point.id)) {
        byId.set(point.id, point);
      }
    }
    return [...byId.values()];
  }, [items, trip.days]);

  const onCenter = useCallback((next) => setCenter(next), []);

  function onMarkerClick(item) {
    if (armedRef.current === item.id) {
      navigate(`/object/${item.id}`);
      return;
    }
    armedRef.current = item.id;
    setSelected(item);
  }

  return (
    <section className="section" id="map">
      <div className="container">
        <p className="section__eyebrow">{t("mapEyebrow")}</p>
        <h2 className="section__title">{t("mapTitle")}</h2>
        <p className="section__lead">{t("mapLead")}</p>
        <div className="map-layout">
          <MapCanvas
            items={mapItems}
            selectedId={selected?.id || ""}
            routeIds={routePoints.map((item) => item.id)}
            lines={trip.lines}
            onMarkerClick={onMarkerClick}
            onCenter={onCenter}
          />
          <div className="map-layout__side map-board">
            <RouteBuilder
              days={trip.days}
              stats={trip.stats}
              onRemove={trip.removePoint}
              onBuild={trip.openRoute}
              onClear={trip.clear}
              url={trip.routeUrl}
              error={trip.routeError}
              canPhrase={Boolean(trip.available)}
            />
            <SelectedPlace
              item={selected}
              onOpen={() => selected && navigate(`/object/${selected.id}`)}
              onAdd={() => trip.addPoint(selected)}
            />
            <div className="geo-filter">
              <label className="field">
                <span>{t("radius")}</span>
                <select value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)}>
                  <option value="15">{t("km15")}</option>
                  <option value="40">{t("km40")}</option>
                  <option value="90">{t("km90")}</option>
                </select>
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => onGeoFilter({ ...center, radius: Number(radiusKm) * 1000 })}
              >
                {t("nearby")}
              </button>
              {geoActive ? (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => onGeoFilter(null)}>
                  {t("wholeRegion")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
