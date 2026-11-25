import { useI18n } from "../../i18n/language.jsx";
import { dayLabel, localAttraction } from "../../i18n/localize";
import { formatDistance, formatDuration, transportLabel } from "../../lib/routeText";
import "./RouteBuilder.css";

export function RouteBuilder({ days, stats, onRemove, onBuild, onClear, url, error, canPhrase }) {
  const { lang, t } = useI18n();
  const points = days.flatMap((day) => day.points);
  let number = 0;

  return (
    <div className="route-builder">
      <h3>{t("route")}</h3>
      {stats ? (
        <p className="route-builder__measure">
          {days.length > 1 ? t("together") : ""}
          {formatDistance(stats.distanceKm, lang)}, {t("about")} {formatDuration(stats.durationMin, lang)} {transportLabel(stats.transport, lang)}
        </p>
      ) : null}
      {points.length === 0 ? (
        <p>{canPhrase ? t("pointsHere") : t("markTwo")}</p>
      ) : (
        days.map((day, dayIndex) => (
          <div key={day.title || `day-${dayIndex}`} className="route-builder__day">
            {day.title ? <h4>{dayLabel(day.title, lang)}</h4> : null}
            {days.length > 1 && stats?.perDay?.[dayIndex] ? (
              <p className="route-builder__measure">
                {formatDistance(stats.perDay[dayIndex].distanceKm, lang)}, {t("about")} {formatDuration(stats.perDay[dayIndex].durationMin, lang)}
              </p>
            ) : null}
            <ol>
              {day.points.map((point) => {
                number += 1;
                return (
                  <li key={point.id}>
                    <span>
                      {number}. {localAttraction(point, lang).title}
                    </span>
                    <button type="button" onClick={() => onRemove(point.id)}>
                      {t("remove")}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))
      )}
      {error ? <p className="field-error">{error}</p> : null}
      <div className="route-builder__actions">
        <button type="button" className="btn btn-accent btn-small" onClick={onBuild}>
          {t("build")}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onClear}>
          {t("clear")}
        </button>
      </div>
      {url ? (
        <a className="route-builder__link" href={url} target="_blank" rel="noreferrer">
          {t("yandex")}
        </a>
      ) : null}
    </div>
  );
}
