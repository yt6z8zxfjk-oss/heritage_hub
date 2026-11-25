import { useEffect, useRef, useState } from "react";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import "./ChatWidget.css";

function visitorId() {
  const key = "heritage-visitor";
  const saved = localStorage.getItem(key);
  if (saved) {
    return saved;
  }
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

function validate(name, text, t) {
  const errors = {};
  const cleanName = name.trim();
  const cleanText = text.trim();
  if (cleanName.length < 2 || cleanName.length > 40) {
    errors.name = t("nameLen");
  } else if (!/^[A-Za-zА-Яа-яЁёІіЎў\-\s]+$/.test(cleanName)) {
    errors.name = t("nameLetters");
  }
  if (cleanText.length < 2 || cleanText.length > 500) {
    errors.text = t("textLen");
  }
  return errors;
}

export function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem("heritage-name") || "");
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const listRef = useRef(null);
  const id = useRef("");

  useEffect(() => {
    id.current = visitorId();
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    let stop = false;
    async function load() {
      try {
        const data = await api(`/messages/my/${id.current}`);
        if (!stop) {
          setItems(data.items);
        }
      } catch (error) {
        if (!stop) {
          setServerError(error.message);
        }
      }
    }
    load();
    const timer = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [items, open]);

  async function send(event) {
    event.preventDefault();
    const nextErrors = validate(name, text, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    try {
      localStorage.setItem("heritage-name", name.trim());
      const data = await api("/messages", {
        method: "POST",
        body: JSON.stringify({
          visitorId: id.current,
          authorName: name.trim(),
          text: text.trim(),
        }),
      });
      setItems((current) => [...current, data.item]);
      setText("");
      setServerError("");
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <div className="chat">
      {open ? (
        <section className="chat__panel" aria-label={t("offerTitle")}>
          <header className="chat__head">
            <div>
              <strong>{t("offerTitle")}</strong>
              <p>{t("offerLead")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("offerClose")}>
              ×
            </button>
          </header>
          <div className="chat__list" ref={listRef} aria-live="polite">
            <article className="chat__bubble is-admin">
              <p>{t("offerHello")}</p>
            </article>
            {items.map((item) => (
              <article key={item.id} className={`chat__bubble ${item.fromAdmin ? "is-admin" : ""}`}>
                <span>{item.authorName}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <form className="chat__form" onSubmit={send}>
            <label className="field">
              <span>{t("name")}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
            <label className="field">
              <span>{t("idea")}</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} />
            </label>
            {errors.text ? <p className="field-error">{errors.text}</p> : null}
            {serverError ? <p className="field-error">{serverError}</p> : null}
            <button type="submit" className="btn btn-primary">
              {t("send")}
            </button>
          </form>
        </section>
      ) : null}
      <button type="button" className="chat__toggle" onClick={() => setOpen((value) => !value)}>
        {open ? t("close") : t("offer")}
      </button>
    </div>
  );
}
