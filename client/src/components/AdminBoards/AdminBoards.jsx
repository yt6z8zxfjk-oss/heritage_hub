import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { adminT } from "../../i18n/adminCopy";
import { useI18n } from "../../i18n/language.jsx";
import { useOblast } from "../../i18n/oblast.jsx";

function useList(path) {
  const { id } = useOblast();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function reload() {
    const data = await api(path);
    setItems(data.items);
    setError("");
  }

  useEffect(() => {
    reload().catch((loadError) => setError(loadError.message));
  }, [path, id]);

  return { items, error, setError, reload };
}

function RowActions({ onEdit, onDelete }) {
  const { lang } = useI18n();
  return (
    <td>
      <button type="button" className="btn btn-ghost btn-small" onClick={onEdit}>
        {adminT(lang, "Изменить")}
      </button>
      <button type="button" className="btn btn-ghost btn-small" onClick={onDelete}>
        {adminT(lang, "Удалить")}
      </button>
    </td>
  );
}

export function StoryDesk() {
  const { items, error, setError, reload } = useList("/stories");
  const [form, setForm] = useState(emptyStory);
  const [editing, setEditing] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const payload = { ...form, order: Number(form.order) };
    try {
      if (editing) {
        await api(`/stories/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/stories", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyStory);
      setEditing("");
      await reload();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <Board error={error} title={editing ? "Править историю" : "Новая история"} form={form} setField={setField} onSubmit={submit} onCancel={editing ? () => { setEditing(""); setForm(emptyStory); } : null}>
      <Field label="Период" name="era" form={form} setField={setField} />
      <Field label="Название" name="title" form={form} setField={setField} />
      <Field label="Короткая подпись" name="lead" form={form} setField={setField} />
      <Field label="Текст" name="body" form={form} setField={setField} area />
      <p className="admin-en-note">Для английского можно оставить пустым: у новой истории останется русский текст, у уже известной — готовый перевод.</p>
      <Field label="Период по-английски" name="eraEn" form={form} setField={setField} />
      <Field label="Название по-английски" name="titleEn" form={form} setField={setField} />
      <Field label="Подпись по-английски" name="leadEn" form={form} setField={setField} />
      <Field label="Текст по-английски" name="bodyEn" form={form} setField={setField} area />
      <Field label="Фото, например /photos/turov.jpg" name="photo" form={form} setField={setField} />
      <Field label="Порядок" name="order" form={form} setField={setField} />
      <table className="admin-table">
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.era} · {item.title}
              </td>
              <RowActions
                onEdit={() => {
                  setEditing(item.id);
                  setForm({
                    era: item.era,
                    eraEn: item.eraEn || "",
                    title: item.title,
                    titleEn: item.titleEn || "",
                    lead: item.lead,
                    leadEn: item.leadEn || "",
                    body: item.body,
                    bodyEn: item.bodyEn || "",
                    photo: item.photo,
                    order: String(item.order),
                  });
                }}
                onDelete={async () => {
                  if (!window.confirm(`Удалить «${item.title}»?`)) {
                    return;
                  }
                  await api(`/stories/${item.id}`, { method: "DELETE" });
                  await reload();
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </Board>
  );
}

const emptyStory = { era: "", eraEn: "", title: "", titleEn: "", lead: "", leadEn: "", body: "", bodyEn: "", photo: "/photos/", order: "0" };

export function GuideDesk({ categories }) {
  const { items, error, setError, reload } = useList("/guides");
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState(emptyGuide);
  const [editing, setEditing] = useState("");

  const { id: oblastId } = useOblast();
  useEffect(() => {
    api("/districts")
      .then((data) => setDistricts(data.items))
      .catch(() => {});
  }, [oblastId]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = { ...form, order: Number(form.order) };
      if (editing) {
        await api(`/guides/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/guides", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyGuide);
      setEditing("");
      await reload();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <Board error={error} title={editing ? "Править карточку области" : "Новая карточка области"} onSubmit={submit} onCancel={editing ? () => { setEditing(""); setForm(emptyGuide); } : null}>
      <Field label="Название" name="title" form={form} setField={setField} />
      <Field label="Текст" name="text" form={form} setField={setField} />
      <p className="admin-en-note">Для английского можно оставить пустым: у новой карточки останется русский текст, у уже известной — готовый перевод.</p>
      <Field label="Название по-английски" name="titleEn" form={form} setField={setField} />
      <Field label="Текст по-английски" name="textEn" form={form} setField={setField} />
      <Field label="Фото" name="photo" form={form} setField={setField} />
      <label className="field">
        <span>Что делает карточка</span>
        <select value={form.kind} onChange={(event) => setField("kind", event.target.value)}>
          <option value="district">Открыть район</option>
          <option value="category">Открыть категорию</option>
          <option value="search">Найти в каталоге</option>
          <option value="anchor">Перейти к блоку</option>
        </select>
      </label>
      {form.kind === "district" ? (
        <label className="field">
          <span>Район</span>
          <input list="guide-districts" value={form.target} onChange={(event) => setField("target", event.target.value)} />
          <datalist id="guide-districts">
            {districts.map((item) => (
              <option key={item.title} value={item.title} />
            ))}
          </datalist>
        </label>
      ) : null}
      {form.kind === "category" ? (
        <label className="field">
          <span>Категория</span>
          <select value={form.target} onChange={(event) => setField("target", event.target.value)}>
            <option value="">Выберите</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {form.kind === "search" ? <Field label="Слово поиска" name="target" form={form} setField={setField} /> : null}
      {form.kind === "anchor" ? (
        <label className="field">
          <span>Блок</span>
          <select value={form.target} onChange={(event) => setField("target", event.target.value)}>
            <option value="#catalog">Объекты</option>
            <option value="#map">Карта</option>
            <option value="#routes">Маршруты</option>
            <option value="#history">История</option>
          </select>
        </label>
      ) : null}
      <Field label="Порядок" name="order" form={form} setField={setField} />
      <table className="admin-table">
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.title} · {item.kind}
              </td>
              <RowActions
                onEdit={() => {
                  setEditing(item.id);
                  setForm({
                    title: item.title,
                    titleEn: item.titleEn || "",
                    text: item.text,
                    textEn: item.textEn || "",
                    photo: item.photo,
                    kind: item.kind,
                    target: item.target,
                    order: String(item.order),
                  });
                }}
                onDelete={async () => {
                  if (!window.confirm(`Удалить «${item.title}»?`)) {
                    return;
                  }
                  await api(`/guides/${item.id}`, { method: "DELETE" });
                  await reload();
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </Board>
  );
}

const emptyGuide = { title: "", titleEn: "", text: "", textEn: "", photo: "/photos/", kind: "district", target: "", order: "0" };

export function TripDesk({ attractions }) {
  const { items, error, setError, reload } = useList("/trips");
  const [form, setForm] = useState(emptyTrip);
  const [editing, setEditing] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleStop(slug) {
    setForm((current) => ({
      ...current,
      stops: current.stops.includes(slug) ? current.stops.filter((item) => item !== slug) : [...current.stops, slug],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      title: form.title,
      lead: form.lead,
      stops: form.stops,
      titleEn: form.titleEn,
      leadEn: form.leadEn,
      cafeTitle: form.cafeTitle,
      cafeTitleEn: form.cafeTitleEn,
      cafeNote: form.cafeNote,
      cafeNoteEn: form.cafeNoteEn,
      cafeLat: Number(form.cafeLat),
      cafeLng: Number(form.cafeLng),
      order: Number(form.order),
    };
    try {
      if (editing) {
        await api(`/trips/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/trips", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyTrip);
      setEditing("");
      await reload();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <Board error={error} title={editing ? "Править маршрут" : "Новый маршрут"} onSubmit={submit} onCancel={editing ? () => { setEditing(""); setForm(emptyTrip); } : null}>
      <Field label="Название" name="title" form={form} setField={setField} />
      <Field label="Коротко о поездке" name="lead" form={form} setField={setField} />
      <p className="admin-en-note">Для английского можно оставить пустым: у нового маршрута останется русский текст, у уже известного — готовый перевод.</p>
      <Field label="Название по-английски" name="titleEn" form={form} setField={setField} />
      <Field label="О поездке по-английски" name="leadEn" form={form} setField={setField} />
      <div className="field">
        <span>Объекты по пути</span>
        <div className="admin-checks">
          {attractions.map((item) => (
            <label key={item.id}>
              <input type="checkbox" checked={form.stops.includes(item.slug)} onChange={() => toggleStop(item.slug)} />
              {item.title}
            </label>
          ))}
        </div>
      </div>
      <Field label="Кафе" name="cafeTitle" form={form} setField={setField} />
      <Field label="Заметка про кафе" name="cafeNote" form={form} setField={setField} />
      <Field label="Кафе по-английски" name="cafeTitleEn" form={form} setField={setField} />
      <Field label="Заметка про кафе по-английски" name="cafeNoteEn" form={form} setField={setField} />
      <Field label="Широта кафе" name="cafeLat" form={form} setField={setField} />
      <Field label="Долгота кафе" name="cafeLng" form={form} setField={setField} />
      <Field label="Порядок" name="order" form={form} setField={setField} />
      <table className="admin-table">
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <RowActions
                onEdit={() => {
                  setEditing(item.id);
                  setForm({
                    title: item.title,
                    titleEn: item.titleEn || "",
                    lead: item.lead,
                    leadEn: item.leadEn || "",
                    stops: item.stops,
                    cafeTitle: item.cafe.title,
                    cafeTitleEn: item.cafeTitleEn || "",
                    cafeNote: item.cafe.note,
                    cafeNoteEn: item.cafeNoteEn || "",
                    cafeLat: String(item.cafe.lat),
                    cafeLng: String(item.cafe.lng),
                    order: String(item.order),
                  });
                }}
                onDelete={async () => {
                  if (!window.confirm(`Удалить «${item.title}»?`)) {
                    return;
                  }
                  await api(`/trips/${item.id}`, { method: "DELETE" });
                  await reload();
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </Board>
  );
}

const emptyTrip = {
  title: "",
  titleEn: "",
  lead: "",
  leadEn: "",
  stops: [],
  cafeTitle: "",
  cafeTitleEn: "",
  cafeNote: "",
  cafeNoteEn: "",
  cafeLat: "",
  cafeLng: "",
  order: "0",
};

export function CategoryDesk({ categories, onChange }) {
  const [form, setForm] = useState({ title: "", description: "" });
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      if (editing) {
        await api(`/categories/${editing}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await api("/categories", { method: "POST", body: JSON.stringify(form) });
      }
      setForm({ title: "", description: "" });
      setEditing("");
      setError("");
      await onChange();
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <Board error={error} title={editing ? "Править категорию" : "Новая категория"} onSubmit={submit} onCancel={editing ? () => { setEditing(""); setForm({ title: "", description: "" }); } : null}>
      <Field label="Название" name="title" form={form} setField={setField} />
      <Field label="Описание" name="description" form={form} setField={setField} />
      <table className="admin-table">
        <tbody>
          {categories.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <RowActions
                onEdit={() => {
                  setEditing(item.id);
                  setForm({ title: item.title, description: item.description });
                }}
                onDelete={async () => {
                  if (!window.confirm(`Удалить «${item.title}»?`)) {
                    return;
                  }
                  try {
                    await api(`/categories/${item.id}`, { method: "DELETE" });
                    await onChange();
                  } catch (loadError) {
                    setError(loadError.message);
                  }
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </Board>
  );
}

function Field({ label, name, form, setField, area = false }) {
  const { lang } = useI18n();
  return (
    <label className="field">
      <span>{adminT(lang, label)}</span>
      {area ? (
        <textarea value={form[name]} onChange={(event) => setField(name, event.target.value)} />
      ) : (
        <input value={form[name]} onChange={(event) => setField(name, event.target.value)} />
      )}
    </label>
  );
}

function Board({ title, error, onSubmit, onCancel, children }) {
  const { lang } = useI18n();
  return (
    <>
      {error ? <p className="notice">{error}</p> : null}
      <form className="object-form" onSubmit={onSubmit}>
        <h2>{adminT(lang, title)}</h2>
        {children}
        <div className="object-form__actions">
          <button type="submit" className="btn btn-primary">
            {adminT(lang, "Сохранить")}
          </button>
          {onCancel ? (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              {adminT(lang, "Отмена")}
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}
