import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useI18n } from "../../i18n/language.jsx";
import { adminT } from "../../i18n/adminCopy";

export function AdminReviewDesk() {
  const { lang } = useI18n();
  const a = (text) => adminT(lang, text);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await api("/reviews");
    setItems(data.items);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  async function publish(item) {
    try {
      await api(`/reviews/${item.id}/publish`, { method: "POST" });
      setError("");
      await load();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function remove(item) {
    const question = item.status === "pending" ? a("Отклонить отзыв?") : a("Удалить отзыв с сайта?");
    if (!window.confirm(question)) {
      return;
    }
    try {
      await api(`/reviews/${item.id}`, { method: "DELETE" });
      setError("");
      await load();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  const waiting = items.filter((item) => item.status === "pending");
  const published = items.filter((item) => item.status !== "pending");

  return (
    <div className="admin-desk review-desk">
      {error ? <p className="field-error">{error}</p> : null}
      <section>
        <h2>{a("На проверке")}</h2>
        {waiting.length === 0 ? <p className="admin-empty">{a("Новых отзывов нет.")}</p> : null}
        <ReviewTable items={waiting} onPublish={publish} onRemove={remove} a={a} />
      </section>
      <section>
        <h2>{a("Уже на сайте")}</h2>
        {published.length === 0 ? <p className="admin-empty">{a("Опубликованных отзывов пока нет.")}</p> : null}
        <ReviewTable items={published} onRemove={remove} a={a} />
      </section>
    </div>
  );
}

function ReviewTable({ items, onPublish, onRemove, a }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{a("Объект")}</th>
          <th>{a("Отзыв")}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.attractionTitle}</td>
            <td>
              <strong>
                {item.authorName} · {item.rating}/5
              </strong>
              <p>{item.text}</p>
            </td>
            <td>
              {onPublish ? (
                <button type="button" className="btn btn-primary btn-small" onClick={() => onPublish(item)}>
                  {a("Опубликовать")}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost btn-small" onClick={() => onRemove(item)}>
                {onPublish ? a("Отклонить") : a("Удалить")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
