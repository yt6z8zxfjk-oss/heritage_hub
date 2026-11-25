import { useI18n } from "../../i18n/language.jsx";
import "./LandStrip.css";

export function LandStrip() {
  const { t } = useI18n();
  const shots = [
    { src: "/photos/palace.jpg", title: t("shotPalace") },
    { src: "/photos/park.jpg", title: t("shotPark") },
    { src: "/photos/sozh.jpg", title: t("shotSozh") },
    { src: "/photos/pripyat-dunes.jpg", title: t("shotDunes") },
    { src: "/photos/turov.jpg", title: t("shotTurov") },
    { src: "/photos/mozyr.jpg", title: t("shotMozyr") },
    { src: "/photos/vetka.jpg", title: t("shotVetka") },
    { src: "/photos/krasny.jpg", title: t("shotKrasny") },
    { src: "/photos/svetlogorsk.jpg", title: t("shotSvet") },
    { src: "/photos/loev.jpg", title: t("shotLoev") },
  ];
  const loop = [...shots, ...shots];
  return (
    <section className="land-strip" aria-label={t("land")}>
      <div className="land-strip__track">
        {loop.map((shot, index) => (
          <figure key={`${shot.src}-${index}`}>
            <img src={shot.src} alt="" />
            <figcaption>{shot.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
