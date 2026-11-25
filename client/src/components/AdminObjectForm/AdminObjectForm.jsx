import { useState } from "react";
import { adminT } from "../../i18n/adminCopy";
import { useI18n } from "../../i18n/language.jsx";
import "./AdminObjectForm.css";

const empty = {
  title: "",
  place: "",
  district: "",
  address: "",
  description: "",
  history: "",
  categoryId: "",
  lat: "",
  lng: "",
  rating: "4.5",
  workHours: "",
  titleEn: "",
  addressEn: "",
  workHoursEn: "",
  descriptionEn: "",
  historyEn: "",
  photos: "",
};

export function formFromItem(item) {
  return {
    title: item.title,
    place: item.place,
    district: item.district || "",
    address: item.address,
    description: item.description,
    history: item.history || "",
    categoryId: item.category?.id || "",
    lat: String(item.lat),
    lng: String(item.lng),
    rating: String(item.rating),
    workHours: item.workHours,
    titleEn: item.titleEn || "",
    addressEn: item.addressEn || "",
    workHoursEn: item.workHoursEn || "",
    descriptionEn: item.descriptionEn || "",
    historyEn: item.historyEn || "",
    photos: item.photos.map((photo) => photo.url).join("\n"),
  };
}

export function payloadFromForm(form) {
  return {
    title: form.title,
    place: form.place,
    district: form.district,
    address: form.address,
    description: form.description,
    history: form.history,
    categoryId: form.categoryId,
    lat: Number(form.lat),
    lng: Number(form.lng),
    rating: Number(form.rating),
    workHours: form.workHours,
    titleEn: form.titleEn,
    addressEn: form.addressEn,
    workHoursEn: form.workHoursEn,
    descriptionEn: form.descriptionEn,
    historyEn: form.historyEn,
    photos: form.photos
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export function AdminObjectForm({ categories, initial, onSubmit, onCancel }) {
  const { lang } = useI18n();
  const a = (text) => adminT(lang, text);
  const [form, setForm] = useState(initial || { ...empty, categoryId: categories[0]?.id || "" });
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (form.title.trim().length < 2 || form.description.trim().length < 20) {
      setError("Заполните название и описание не короче 20 символов");
      return;
    }
    if (!form.categoryId) {
      setError("Выберите категорию");
      return;
    }
    try {
      await onSubmit(payloadFromForm(form));
      if (!initial) {
        setForm({ ...empty, categoryId: categories[0]?.id || "" });
      }
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  return (
    <form className="object-form" onSubmit={submit}>
      <h2>{initial ? a("Редактирование") : a("Новый объект")}</h2>
      <label className="field">
        <span>{a("Название")}</span>
        <input value={form.title} onChange={(event) => setField("title", event.target.value)} />
      </label>
      <label className="field">
        <span>{a("Населённый пункт")}</span>
        <input value={form.place} onChange={(event) => setField("place", event.target.value)} />
      </label>
      <label className="field">
        <span>{a("Район")}</span>
        <input value={form.district} onChange={(event) => setField("district", event.target.value)} />
      </label>
      <label className="field">
        <span>{a("Адрес")}</span>
        <input value={form.address} onChange={(event) => setField("address", event.target.value)} />
      </label>
      <label className="field">
        <span>{a("Категория")}</span>
        <select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)}>
          <option value="">{a("Выберите")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>
      <div className="object-form__row">
        <label className="field">
          <span>{a("Широта")}</span>
          <input value={form.lat} onChange={(event) => setField("lat", event.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>{a("Долгота")}</span>
          <input value={form.lng} onChange={(event) => setField("lng", event.target.value)} inputMode="decimal" />
        </label>
      </div>
      <div className="object-form__row">
        <label className="field">
          <span>{a("Рейтинг")}</span>
          <input value={form.rating} onChange={(event) => setField("rating", event.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          <span>{a("Время работы")}</span>
          <input value={form.workHours} onChange={(event) => setField("workHours", event.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>{a("Описание")}</span>
        <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} />
      </label>
      <label className="field">
        <span>{a("История места")}</span>
        <textarea value={form.history} onChange={(event) => setField("history", event.target.value)} />
      </label>
      <div className="object-form__en">
        <h3>{a("Для английского языка")}</h3>
        <p>{a("Можно оставить пустым. У нового места тогда останется русский текст. У уже известного места останется готовый перевод.")}</p>
        <label className="field">
          <span>{a("Название")}</span>
          <input value={form.titleEn} onChange={(event) => setField("titleEn", event.target.value)} />
        </label>
        <label className="field">
          <span>{a("Адрес")}</span>
          <input value={form.addressEn} onChange={(event) => setField("addressEn", event.target.value)} />
        </label>
        <label className="field">
          <span>{a("Время работы")}</span>
          <input value={form.workHoursEn} onChange={(event) => setField("workHoursEn", event.target.value)} />
        </label>
        <label className="field">
          <span>{a("Описание")}</span>
          <textarea value={form.descriptionEn} onChange={(event) => setField("descriptionEn", event.target.value)} />
        </label>
        <label className="field">
          <span>{a("История места")}</span>
          <textarea value={form.historyEn} onChange={(event) => setField("historyEn", event.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>{a("Фото, по одной ссылке в строке")}</span>
        <textarea value={form.photos} onChange={(event) => setField("photos", event.target.value)} />
      </label>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="object-form__actions">
        <button type="submit" className="btn btn-primary">
          {a("Сохранить")}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {a("Отмена")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
