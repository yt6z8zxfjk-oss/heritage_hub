import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AttributionControl, MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import { api } from "../api/api";
import { useI18n } from "../i18n/language.jsx";
import { categoryName, placeName } from "../i18n/copy";
import { localAttraction } from "../i18n/localize";
import { AttractionCard } from "../components/AttractionCard/AttractionCard";
import "../components/AttractionCatalog/AttractionCatalog.css";
import { CoverImage, starText } from "../components/CoverImage/CoverImage";
import "./AttractionPage.css";
import "../components/MapCanvas/MapCanvas.css";

const pin = L.divIcon({
  className: "pin-wrap",
  html: '<span class="pin pin--active"></span>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function validateReview(name, text, rating, t) {
  const errors = {};
  if (name.trim().length < 2) {
    errors.name = t("reviewName");
  }
  if (text.trim().length < 2) {
    errors.text = t("reviewText");
  }
  if (!rating) {
    errors.rating = t("reviewScore");
  }
  return errors;
}

export function AttractionPage() {
  const { id } = useParams();
  const { lang, t } = useI18n();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [yandexReviews, setYandexReviews] = useState([]);
  const [yandexUrl, setYandexUrl] = useState("");
  const [nearby, setNearby] = useState([]);
  const [error, setError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState("5");
  const [formErrors, setFormErrors] = useState({});
  const [reviewNotice, setReviewNotice] = useState("");

  useEffect(() => {
    let stop = false;
    setItem(null);
    setNearby([]);
    api(`/attractions/${id}`)
      .then((data) => {
        if (!stop) {
          setItem(data.item);
        }
      })
      .catch((loadError) => {
        if (!stop) {
          setError(loadError.message);
        }
      });
    setYandexReviews([]);
    setYandexUrl("");
    api(`/attractions/${id}/reviews`)
      .then((data) => {
        if (!stop) {
          setReviews(data.items || []);
          setYandexReviews(data.yandex || []);
          setYandexUrl(data.yandexUrl || "");
        }
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [id]);

  useEffect(() => {
    if (!item?.district) {
      return;
    }
    let stop = false;
    api(`/attractions?district=${encodeURIComponent(item.district)}`)
      .then((data) => {
        if (!stop) {
          setNearby(data.items.filter((place) => place.id !== item.id).slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [item]);

  async function buildFromHere() {
    if (!item || !navigator.geolocation) {
      setRouteError(t("geoOff"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api("/routes", {
            method: "POST",
            body: JSON.stringify({
              points: [
                { lat: position.coords.latitude, lng: position.coords.longitude, title: t("myLocation") },
                { lat: item.lat, lng: item.lng, title: localAttraction(item, lang).title },
              ],
            }),
          });
          window.open(data.url, "_blank", "noopener,noreferrer");
          setRouteError("");
        } catch (loadError) {
          setRouteError(loadError.message);
        }
      },
      () => setRouteError(t("geoDeny"))
    );
  }

  async function sendReview(event) {
    event.preventDefault();
    const nextErrors = validateReview(name, text, rating, t);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    try {
      await api(`/attractions/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ authorName: name.trim(), text: text.trim(), rating: Number(rating) }),
      });
      setText("");
      setReviewNotice(t("reviewSent"));
    } catch (loadError) {
      setReviewNotice("");
      setFormErrors({ text: loadError.message });
    }
  }

  if (error && !item) {
    return (
      <section className="section container">
        <p className="notice">{error}</p>
        <Link to="/">{t("toHome")}</Link>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="section container">
        <p>{t("loadingPlace")}</p>
      </section>
    );
  }

  const view = localAttraction(item, lang);
  const cover = view.photos[0];
  const placeLine = item.district && item.district !== item.place ? `${placeName(item.place, lang)} · ${placeName(item.district, lang)}` : placeName(item.place, lang);

  return (
    <article className="object-page">
      <header className="object-hero">
        {cover ? <img className="object-hero__photo" src={cover.url} alt="" /> : null}
        <div className="object-hero__shade" />
        <div className="container object-hero__copy">
          <Link className="object-page__back" to="/places">
            {t("backPlaces")}
          </Link>
          <p className="section__eyebrow">{placeLine}</p>
          <h1>{view.title}</h1>
          <ul className="object-hero__facts">
            {typeof item.rating === "number" ? (
              <li>
                <span className="stars" aria-label={`${t("rating")} ${item.rating} ${t("of5")}`}>
                  {starText(item.rating)} {item.rating}
                </span>
              </li>
            ) : null}
            {item.category?.title ? <li>{categoryName(item.category, lang, t)}</li> : null}
            <li>{view.workHours}</li>
          </ul>
        </div>
      </header>
      <div className="section">
        <div className="container">
          <div className="object-page__grid">
            <div className="object-page__copy">
              <div className="object-read">
                <p className="story object-page__lead">{view.description}</p>
                {item.history ? (
                  <section className="object-story" aria-labelledby="object-story-title">
                    {cover ? <img className="object-story__photo" src={cover.url} alt="" /> : null}
                    <div className="object-story__copy">
                      <p className="section__eyebrow">{t("placeHistory")}</p>
                      <h2 id="object-story-title">{t("someHistory")}</h2>
                      {String(view.history)
                        .split(/\n+/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph) => (
                          <p className="story" key={paragraph.slice(0, 48)}>
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </section>
                ) : null}
              </div>
              <p className="object-page__address">
                <strong>{t("address")}</strong> {view.address}
              </p>
              <div className="object-page__actions">
                <button type="button" className="btn btn-accent" onClick={buildFromHere}>
                  {t("routeFromMe")}
                </button>
                <a
                  className="btn btn-ghost"
                  href={`https://yandex.ru/maps/?pt=${item.lng},${item.lat}&z=15&l=map`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("yandexPoint")}
                </a>
              </div>
              {routeError ? <p className="field-error">{routeError}</p> : null}
            </div>
            <div className="object-page__map">
              <MapContainer className="object-map" center={[item.lat, item.lng]} zoom={14} scrollWheelZoom={false} attributionControl={false}>
                <AttributionControl prefix='<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' />
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[item.lat, item.lng]} icon={pin} />
              </MapContainer>
            </div>
            <div className="object-page__rest">
              {item.photos.length > 1 ? (
                <div className="object-gallery">
                  {item.photos.map((photo) => (
                    <CoverImage key={photo.url} src={photo.url} alt={photo.alt} />
                  ))}
                </div>
              ) : null}
              <section className="reviews" aria-labelledby="reviews-title">
                <h2 id="reviews-title">{t("reviews")}</h2>
                {yandexReviews.length ? (
                  <>
                    <p className="reviews__source">
                      {yandexUrl ? (
                        <a href={yandexUrl} target="_blank" rel="noreferrer">
                          {t("yandexReviews")}
                        </a>
                      ) : (
                        t("yandexReviews")
                      )}
                    </p>
                    <ul>
                      {yandexReviews.map((review) => (
                        <li key={review.id}>
                          <strong>
                            {review.authorName} · {review.rating}/5
                          </strong>
                          <p>{review.text}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p>{t("reviewNote")}</p>
                {reviews.length === 0 && yandexReviews.length === 0 ? <p>{t("noReviews")}</p> : null}
                <ul>
                  {reviews.map((review) => (
                    <li key={review.id}>
                      <strong>
                        {review.authorName} · {review.rating}/5
                      </strong>
                      <p>{review.text}</p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={sendReview} className="reviews__form">
                  <label className="field">
                    <span>{t("name")}</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                  {formErrors.name ? <p className="field-error">{formErrors.name}</p> : null}
                  <label className="field">
                    <span>{t("score")}</span>
                    <select value={rating} onChange={(event) => setRating(event.target.value)}>
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{t("text")}</span>
                    <textarea value={text} onChange={(event) => setText(event.target.value)} />
                  </label>
                  {formErrors.text ? <p className="field-error">{formErrors.text}</p> : null}
                  <button type="submit" className="btn btn-primary">
                    {t("leaveReview")}
                  </button>
                  {reviewNotice ? <p className="notice notice-ok">{reviewNotice}</p> : null}
                </form>
              </section>
            </div>
          </div>
          {nearby.length ? (
            <section className="object-nearby" aria-labelledby="nearby-title">
              <h2 id="nearby-title">{t("moreDistrict")}</h2>
              <div className="object-nearby__grid place-list">
                {nearby.map((place) => (
                  <AttractionCard key={place.id} item={place} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
