import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";
import { localStory } from "../../i18n/localize";
import { Reveal } from "../Reveal/Reveal";
import "./RegionHistory.css";

export function RegionHistory() {
  const { lang, t } = useI18n();
  const { id } = useOblast();
  const [stories, setStories] = useState([]);

  useEffect(() => {
    api("/stories")
      .then((data) => setStories(data.items))
      .catch(() => {});
  }, [id]);

  return (
    <section className="section" id="history">
      <div className="container">
        <Reveal>
          <p className="section__eyebrow">{t("historyEyebrow")}</p>
          <h2 className="section__title">{t("historyTitle")}</h2>
          <p className="story section__lead">{t("historyLead")}</p>
        </Reveal>
        <ol className="region-history">
          {stories.map((story, index) => {
            const view = localStory(story, lang);
            return (
            <li key={story.id}>
              <Reveal>
                <Link to={`/story/${story.slug}`} className={`region-history__card ${index % 2 ? "is-flip" : ""}`}>
                  <img src={story.photo} alt="" />
                  <div className="region-history__shade" />
                  <div className="region-history__copy">
                    <time>{view.era}</time>
                    <h3>{view.title}</h3>
                    <p>{view.lead}</p>
                    <span className="region-history__open">{t("read")}</span>
                  </div>
                </Link>
              </Reveal>
            </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
