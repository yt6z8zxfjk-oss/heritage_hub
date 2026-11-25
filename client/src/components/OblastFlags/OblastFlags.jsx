import { oblastLabel, oblastList } from "../../data/oblasts";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import "./OblastFlags.css";

export function OblastFlags() {
  const { lang, t } = useI18n();
  const { id, setOblast } = useOblast();
  return (
    <div className="oblast-flags" role="group" aria-label={t("oblastPick")}>
      {oblastList.map((item) => {
        const name = oblastLabel(item, lang);
        const on = item.id === id;
        return (
          <button key={item.id} type="button" className={on ? "is-on" : ""} aria-pressed={on} title={name} onClick={() => setOblast(item.id)}>
            <img src={`/flags/${item.id}.svg`} alt="" />
            <span className="sr-only">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
