import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useOblast } from "../../i18n/oblast.jsx";
import "./AdminMessageDesk.css";

export function AdminMessageDesk() {
  const { id } = useOblast();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/messages");
    setThreads(data.threads);
    setActiveId((current) => current || data.threads[0]?.visitorId || "");
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const active = threads.find((thread) => thread.visitorId === activeId);

  async function reply(event) {
    event.preventDefault();
    if (text.trim().length < 2) {
      setError("Ответ — минимум 2 символа");
      return;
    }
    try {
      await api("/messages/reply", {
        method: "POST",
        body: JSON.stringify({ visitorId: activeId, text: text.trim() }),
      });
      setText("");
      setError("");
      await load();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function removeMessage(message) {
    if (!window.confirm("Удалить это сообщение?")) {
      return;
    }
    try {
      await api(`/messages/${message.id}`, { method: "DELETE" });
      setError("");
      await load();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function removeThread(thread) {
    if (!window.confirm(`Удалить переписку с «${thread.authorName}»?`)) {
      return;
    }
    try {
      await api(`/messages/thread/${thread.visitorId}`, { method: "DELETE" });
      if (activeId === thread.visitorId) {
        setActiveId("");
      }
      setError("");
      await load();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <div className={`message-desk ${threads.length ? "has-threads" : ""}`}>
      {threads.length === 0 ? <p className="admin-empty">Пока никто ничего не написал. Сообщения придут с кнопки «Предложение» на сайте.</p> : null}
      {threads.length ? (
      <div className="thread-list">
        {threads.map((thread) => (
          <div className="thread-list__item" key={thread.visitorId}>
            <button
              type="button"
              className={thread.visitorId === activeId ? "is-active" : ""}
              onClick={() => setActiveId(thread.visitorId)}
            >
              {thread.authorName}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => removeThread(thread)}>
              Удалить
            </button>
          </div>
        ))}
      </div>
      ) : null}
      {threads.length ? (
      <div>
        <div className="admin-chat">
          {active?.messages.map((message) => (
            <article key={message.id} className={message.fromAdmin ? "is-admin" : ""}>
              <div className="admin-chat__top">
                <strong>{message.authorName}</strong>
                <button type="button" onClick={() => removeMessage(message)}>
                  Удалить
                </button>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        {active ? (
          <form className="message-desk__reply" onSubmit={reply}>
            <label className="field">
              <span>Ответ</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <div className="message-desk__actions">
              <button type="submit" className="btn btn-primary">
                Ответить
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => removeThread(active)}>
                Удалить переписку
              </button>
            </div>
          </form>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
