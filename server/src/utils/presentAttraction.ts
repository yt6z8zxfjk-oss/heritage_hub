import { Photo } from "../models/Photo";
import { HttpError } from "./httpError";

type AttractionShape = {
  _id: unknown;
  title: string;
  titleEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  history?: string;
  historyEn?: string;
  district?: string;
  oblast?: string;
  address: string;
  addressEn?: string;
  place: string;
  category: unknown;
  location?: { coordinates: number[] } | null;
  rating?: number | null;
  workHours: string;
  workHoursEn?: string;
};

type CategoryShape = {
  _id: unknown;
  title: string;
  slug: string;
};

function asCategory(value: unknown) {
  if (!value || typeof value !== "object" || !("title" in value)) {
    return null;
  }
  const category = value as CategoryShape;
  return {
    id: String(category._id),
    title: category.title,
    slug: category.slug,
  };
}

export async function presentAttraction(item: AttractionShape) {
  const photos = await Photo.find({ attraction: item._id }).select("url alt");
  const coordinates = item.location?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    throw new HttpError(500, "У объекта нет координат");
  }
  const [lng, lat] = coordinates;
  return {
    id: String(item._id),
    title: item.title,
    titleEn: item.titleEn || "",
    slug: item.slug,
    description: item.description,
    descriptionEn: item.descriptionEn || "",
    history: item.history || "",
    historyEn: item.historyEn || "",
    district: item.district || "",
    oblast: item.oblast || "gomel",
    address: item.address,
    addressEn: item.addressEn || "",
    place: item.place,
    category: asCategory(item.category),
    lat,
    lng,
    rating: typeof item.rating === "number" ? item.rating : null,
    workHours: item.workHours,
    workHoursEn: item.workHoursEn || "",
    photos: photos.map((photo) => ({ url: photo.url, alt: photo.alt })),
  };
}

export async function presentAttractions(items: AttractionShape[]) {
  return Promise.all(items.map((item) => presentAttraction(item)));
}
