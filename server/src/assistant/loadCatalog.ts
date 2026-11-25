import { Attraction } from "../models/Attraction";
import { readOblast } from "../seed/oblasts";
import { clip } from "./phrase";
import { CatalogCard } from "./types";

function categoryTitle(value: unknown) {
  if (!value || typeof value !== "object" || !("title" in value)) {
    return "";
  }
  return String((value as { title?: unknown }).title || "");
}

function toCard(item: {
  _id: unknown;
  title: string;
  place: string;
  district?: string;
  address: string;
  workHours?: string;
  description?: string;
  category?: unknown;
  location?: { coordinates?: number[] } | null;
}, aboutLimit: number): CatalogCard | null {
  const coordinates = item.location?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const title = item.title.trim();
  const workHours = (item.workHours || "").trim();
  if (/черновик/i.test(title) || /закрыт/i.test(workHours)) {
    return null;
  }
  return {
    id: String(item._id),
    title,
    place: item.place,
    district: item.district || "",
    address: item.address,
    workHours,
    category: categoryTitle(item.category),
    lat,
    lng,
    about: clip(item.description || "", aboutLimit),
  };
}

export async function loadCatalog(oblast = "gomel") {
  const found = await Attraction.find({ oblast: readOblast(oblast) }).populate("category").limit(200);
  return found
    .map((item) => toCard(item, 180))
    .filter((card): card is CatalogCard => Boolean(card));
}

export async function loadCardsByIds(ids: string[], aboutLimit: number, oblast = "gomel") {
  const found = await Attraction.find({ _id: { $in: ids }, oblast: readOblast(oblast) }).populate("category");
  const cards = new Map<string, CatalogCard>();
  for (const item of found) {
    const card = toCard(item, aboutLimit);
    if (card) {
      cards.set(card.id, card);
    }
  }
  return ids.map((id) => cards.get(id) || null);
}
