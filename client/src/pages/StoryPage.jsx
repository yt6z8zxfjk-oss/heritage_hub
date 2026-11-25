import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/api";
import { useI18n } from "../i18n/language.jsx";
import { useOblast } from "../i18n/oblast.jsx";
import { localStory } from "../i18n/localize";
import "./StoryPage.css";

export function StoryPage() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const { id: oblastId } = useOblast();
  const [story, setStory] = useState(null);
  const [others, setOthers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    setStory(null);
    setError("");
    api(`/stories/${slug}`)
      .then((data) => {
        if (!stop) {
          setStory(data.item);
        }
      })
      .catch((loadError) => {
        if (!stop) {
          setError(loadError.message);
        }
      });
    api("/stories")
      .then((data) => {
        if (!stop) {
          setOthers(data.items.filter((item) => item.slug !== slug).slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [slug, oblastId]);

  if (error && !story) {
    return (
      <section className="section container">
        <p className="notice">{error}</p>
        <Link to="/history">{t("toStories")}</Link>
      </section>
    );
  }

  if (!story) {
    return (
      <section className="section container">
        <p>{t("openingStory")}</p>
      </section>
    );
  }

  const view = localStory(story, lang);

  return (
    <article className="story-page">
      <header className="story-hero">
        <img src={story.photo} alt="" />
        <div className="story-hero__shade" />
        <div className="container story-hero__copy">
          <Link className="story-hero__back" to="/history">
            {t("allStories")}
          </Link>
          <p className="section__eyebrow">{view.era}</p>
          <h1>{view.title}</h1>
        </div>
      </header>
      <div className="section">
        <div className="container story-sheet">
          {view.body.split("\n").filter(Boolean).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="story">
              {paragraph}
            </p>
          ))}
          {others.length ? (
            <section className="story-more" aria-labelledby="story-more-title">
              <h2 id="story-more-title">{t("moreStories")}</h2>
              <div className="story-more__grid">
                {others.map((item) => (
                  <Link key={item.id} to={`/story/${item.slug}`}>
                    <img src={item.photo} alt="" />
                    <span>{localStory(item, lang).era}</span>
                    <strong>{localStory(item, lang).title}</strong>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
