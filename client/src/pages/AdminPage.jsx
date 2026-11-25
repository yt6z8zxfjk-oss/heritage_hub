import { useEffect, useState } from "react";
import { api } from "../api/api";
import { adminT } from "../i18n/adminCopy";
import { useI18n } from "../i18n/language.jsx";
import { useOblast } from "../i18n/oblast.jsx";
import { AdminLogin } from "../components/AdminLogin/AdminLogin";
import { AdminMessageDesk } from "../components/AdminMessageDesk/AdminMessageDesk";
import { AdminReviewDesk } from "../components/AdminReviewDesk/AdminReviewDesk";
import { CategoryDesk, GuideDesk, StoryDesk, TripDesk } from "../components/AdminBoards/AdminBoards";
import { AdminObjectForm, formFromItem } from "../components/AdminObjectForm/AdminObjectForm";

export function AdminPage() {
  const { lang } = useI18n();
  const { id: oblastId, name } = useOblast();
  const a = (text) => adminT(lang, text);
  const [loginName, setLoginName] = useState(localStorage.getItem("heritage-token") ? "desk" : "");
  const [tab, setTab] = useState("objects");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadObjects() {
    const [categoryData, objectData] = await Promise.all([
      api("/categories"),
      api("/attractions"),
    ]);
    setCategories(categoryData.items);
    setItems(objectData.items);
  }

  useEffect(() => {
    if (!loginName) {
      return;
    }
    loadObjects().catch((loadError) => {
      if (loadError.status === 401) {
        localStorage.removeItem("heritage-token");
        setLoginName("");
      }
      setError(loadError.message);
    });
  }, [loginName, oblastId]);

  async function save(payload) {
    if (editing) {
      await api(`/attractions/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      setEditing(null);
      setMessage(a("Объект обновлён"));
    } else {
      await api("/attractions", { method: "POST", body: JSON.stringify(payload) });
      setMessage(a("Объект добавлен и уже виден на карте"));
    }
    await loadObjects();
  }

  async function remove(item) {
    if (!window.confirm(`${a("Удалить")} «${item.title}»?`)) {
      return;
    }
    await api(`/attractions/${item.id}`, { method: "DELETE" });
    setMessage(a("Объект удалён"));
    await loadObjects();
  }

  function logout() {
    localStorage.removeItem("heritage-token");
    setLoginName("");
  }

  if (!loginName) {
    return (
      <section className="section container">
        <AdminLogin onSuccess={setLoginName} />
      </section>
    );
  }

  return (
    <section className="section container admin-page">
      <p className="admin-oblast">
        {a("Сейчас выбрана")}: {name}. {a("Новые объекты, истории, маршруты и сообщения относятся к этой области.")}
      </p>
      <div className="admin-tabs">
        <button type="button" className={tab === "objects" ? "is-active" : ""} onClick={() => setTab("objects")}>
          {a("Объекты")}
        </button>
        <button type="button" className={tab === "messages" ? "is-active" : ""} onClick={() => setTab("messages")}>
          {a("Сообщения")}
        </button>
        <button type="button" className={tab === "reviews" ? "is-active" : ""} onClick={() => setTab("reviews")}>
          {a("Отзывы")}
        </button>
        <button type="button" className={tab === "stories" ? "is-active" : ""} onClick={() => setTab("stories")}>
          {a("Истории")}
        </button>
        <button type="button" className={tab === "guides" ? "is-active" : ""} onClick={() => setTab("guides")}>
          {a("Область")}
        </button>
        <button type="button" className={tab === "trips" ? "is-active" : ""} onClick={() => setTab("trips")}>
          {a("Маршруты")}
        </button>
        <button type="button" className={tab === "categories" ? "is-active" : ""} onClick={() => setTab("categories")}>
          {a("Категории")}
        </button>
        <button type="button" onClick={logout}>
          {a("Выйти")}
        </button>
      </div>
      {message ? <p className="notice notice-ok">{message}</p> : null}
      {error ? <p className="notice">{error}</p> : null}
      {tab === "messages" ? <AdminMessageDesk /> : null}
      {tab === "reviews" ? <AdminReviewDesk /> : null}
      {tab === "stories" ? <StoryDesk /> : null}
      {tab === "guides" ? <GuideDesk categories={categories} /> : null}
      {tab === "trips" ? <TripDesk attractions={items} /> : null}
      {tab === "categories" ? <CategoryDesk categories={categories} onChange={loadObjects} /> : null}
      {tab === "objects" ? (
        <>
          <AdminObjectForm
            key={editing?.id || "new"}
            categories={categories}
            initial={editing ? formFromItem(editing) : null}
            onSubmit={save}
            onCancel={editing ? () => setEditing(null) : null}
          />
          <div className="admin-desk">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{a("Объект")}</th>
                  <th>{a("Место")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.place}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(item)}>
                        {a("Изменить")}
                      </button>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => remove(item)}>
                        {a("Удалить")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
