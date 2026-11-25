import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { useTripContext } from "../../hooks/tripContext.jsx";
import "./RouteAssistant.css";

function TypedText({ text, onTick }) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;
  const reduce = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;
  const [count, setCount] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (reduce) {
      setCount(text.length);
      return undefined;
    }
    const start = performance.now();
    const pace = 36;
    const timer = window.setInterval(() => {
      const next = Math.min(text.length, Math.max(1, Math.floor(((performance.now() - start) / 1000) * pace)));
      setCount(next);
      tickRef.current?.();
      if (next >= text.length) {
        window.clearInterval(timer);
      }
    }, 32);
    return () => window.clearInterval(timer);
  }, [text, reduce]);

  if (count >= text.length) {
    return text;
  }
  return (
    <>
      {text.slice(0, count)}
      <span className="route-chat__caret" aria-hidden="true" />
    </>
  );
}

export function RouteAssistant() {
  const trip = useTripContext();
  const { t } = useI18n();
  const logRef = useRef(null);
  const latestId = trip.messages.length ? trip.messages[trip.messages.length - 1].id : 0;

  function scrollLog() {
    const log = logRef.current;
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }

  useEffect(() => {
    scrollLog();
  }, [trip.messages, trip.pending]);

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      trip.submit(event);
    }
  }

  const tools = trip.available && trip.hasPoints;

  return (
    <section className="route-chat" aria-label={t("chatTitle")}>
      {trip.available === false ? (
        <p className="route-assistant__off">{t("chatOff")}</p>
      ) : (
        <>
          <div className="route-chat__log" ref={logRef}>
            {trip.messages.map((message) => (
              <p key={message.id} className={`route-chat__bubble route-chat__bubble--${message.role}`}>
                {message.role === "assistant" && message.id === latestId && !trip.pending ? (
                  <TypedText text={message.text} onTick={scrollLog} />
                ) : (
                  message.text
                )}
              </p>
            ))}
            {trip.pending ? (
              <p className="route-chat__bubble route-chat__bubble--assistant route-chat__bubble--wait">
                <span className="route-chat__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {trip.pending}
              </p>
            ) : null}
          </div>
          {tools ? (
            <div className="route-chat__tools">
              <Link to="/map">{t("onMap")}</Link>
            </div>
          ) : null}
          <form className="route-chat__form" onSubmit={trip.submit} aria-busy={Boolean(trip.pending)}>
            <label className="field">
              <span className="route-chat__label">{t("message")}</span>
              <textarea
                value={trip.phrase}
                onChange={(event) => trip.setPhrase(event.target.value)}
                onKeyDown={onKeyDown}
                maxLength={500}
                rows={1}
                placeholder={t("askPlaceholder")}
                disabled={Boolean(trip.pending)}
              />
            </label>
            <button className="route-chat__send" type="submit" disabled={Boolean(trip.pending) || !trip.phrase.trim()} aria-label={t("send")}>
              ↑
            </button>
          </form>
          {trip.assistantError ? (
            <p className="route-chat__note">
              {trip.assistantError}{" "}
              <button type="button" className="route-chat__retry" onClick={trip.retry}>
                {t("retry")}
              </button>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
