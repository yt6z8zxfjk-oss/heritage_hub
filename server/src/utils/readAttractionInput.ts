import mongoose from "mongoose";
import { readOblast } from "../seed/oblasts";
import { HttpError } from "./httpError";
import { makeSlug } from "./slug";

export type AttractionInput = {
  title: string;
  slug: string;
  description: string;
  history: string;
  district: string;
  address: string;
  addressEn: string;
  titleEn: string;
  descriptionEn: string;
  historyEn: string;
  place: string;
  categoryId: string;
  lat: number;
  lng: number;
  rating: number;
  workHours: string;
  workHoursEn: string;
  photos: Array<{ url: string; alt: string }>;
  oblast: string;
};

function optional(value: unknown, label: string, max: number) {
  const line = text(value);
  if (line.length > max) {
    throw new HttpError(400, `${label}: не длиннее ${max} символов`);
  }
  return line;
}

function text(value: unknown) {
  return String(value || "").trim();
}

export function readAttractionInput(body: Record<string, unknown>, currentSlug = "") {
  const title = text(body.title);
  const description = text(body.description);
  const history = text(body.history);
  const district = text(body.district);
  const address = text(body.address);
  const place = text(body.place);
  const categoryId = text(body.categoryId);
  const workHours = text(body.workHours);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const rating = Number(body.rating);
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];

  if (title.length < 2 || title.length > 120) {
    throw new HttpError(400, "Название должно быть от 2 до 120 символов");
  }
  if (place.length < 2 || place.length > 60) {
    throw new HttpError(400, "Укажите населённый пункт");
  }
  if (address.length < 5 || address.length > 200) {
    throw new HttpError(400, "Укажите адрес");
  }
  if (description.length < 20 || description.length > 2000) {
    throw new HttpError(400, "Описание должно быть от 20 до 2000 символов");
  }
  if (history.length < 40 || history.length > 2500) {
    throw new HttpError(400, "История места должна быть от 40 до 2500 символов");
  }
  if (district.length < 2 || district.length > 40) {
    throw new HttpError(400, "Укажите район");
  }
  if (workHours.length < 2 || workHours.length > 120) {
    throw new HttpError(400, "Укажите время работы");
  }
  if (!mongoose.isValidObjectId(categoryId)) {
    throw new HttpError(400, "Выберите категорию");
  }
  if (!Number.isFinite(lat) || lat < 51 || lat > 56.4) {
    throw new HttpError(400, "Широта должна быть числом в пределах Беларуси");
  }
  if (!Number.isFinite(lng) || lng < 23 || lng > 32.9) {
    throw new HttpError(400, "Долгота должна быть числом в пределах Беларуси");
  }
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new HttpError(400, "Рейтинг должен быть от 0 до 5");
  }
  if (rawPhotos.length > 6) {
    throw new HttpError(400, "Можно добавить не больше 6 фотографий");
  }

  const photos = rawPhotos.map((item) => {
    const url = text(typeof item === "string" ? item : (item as { url?: string }).url);
    if (!url.startsWith("/") && !url.startsWith("http://") && !url.startsWith("https://")) {
      throw new HttpError(400, "Ссылка на фото должна начинаться с / или http");
    }
    if (url.length > 500) {
      throw new HttpError(400, "Слишком длинная ссылка на фото");
    }
    return { url, alt: title };
  });

  return {
    title,
    titleEn: optional(body.titleEn, "Английское название", 160),
    slug: currentSlug || makeSlug(title),
    description,
    descriptionEn: optional(body.descriptionEn, "Английское описание", 2000),
    history,
    historyEn: optional(body.historyEn, "Английская история", 2500),
    district,
    address,
    addressEn: optional(body.addressEn, "Английский адрес", 200),
    place,
    categoryId,
    lat,
    lng,
    rating: Math.round(rating * 10) / 10,
    workHours,
    workHoursEn: optional(body.workHoursEn, "Английское время работы", 120),
    photos,
    oblast: readOblast(body.oblast),
  } satisfies AttractionInput;
}

export function readPersonName(value: unknown, label: string) {
  const name = text(value);
  if (name.length < 2 || name.length > 40) {
    throw new HttpError(400, `${label}: от 2 до 40 символов`);
  }
  if (!/^[A-Za-zА-Яа-яЁёІіЎў\-\s]+$/.test(name)) {
    throw new HttpError(400, `${label} может содержать только буквы`);
  }
  return name;
}
