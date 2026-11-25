import { Request, Response } from "express";
import { Attraction } from "../models/Attraction";
import { Trip } from "../models/Trip";
import { readOblast } from "../seed/oblasts";
import { HttpError } from "../utils/httpError";
import { makeSlug } from "../utils/slug";

function presentTrip(item: {
  _id: unknown;
  slug: string;
  title: string;
  titleEn?: string;
  lead: string;
  leadEn?: string;
  stops: string[];
  cafeTitle: string;
  cafeTitleEn?: string;
  cafeNote: string;
  cafeNoteEn?: string;
  cafeLat: number;
  cafeLng: number;
  order: number;
}) {
  return {
    id: String(item._id),
    slug: item.slug,
    title: item.title,
    titleEn: item.titleEn || "",
    lead: item.lead,
    leadEn: item.leadEn || "",
    stops: item.stops,
    order: item.order,
    cafeTitleEn: item.cafeTitleEn || "",
    cafeNoteEn: item.cafeNoteEn || "",
    cafe: {
      title: item.cafeTitle,
      note: item.cafeNote,
      lat: item.cafeLat,
      lng: item.cafeLng,
    },
  };
}

async function readTrip(body: unknown, oblast: string) {
  const source = (body || {}) as Record<string, unknown>;
  const title = String(source.title || "").trim();
  const lead = String(source.lead || "").trim();
  const stops = Array.isArray(source.stops) ? source.stops.map((item) => String(item).trim()).filter(Boolean) : [];
  const cafeTitle = String(source.cafeTitle || "").trim();
  const cafeNote = String(source.cafeNote || "").trim();
  const cafeLat = Number(source.cafeLat);
  const cafeLng = Number(source.cafeLng);
  const order = Number(source.order ?? 0);
  if (title.length < 2 || title.length > 80) {
    throw new HttpError(400, "Название маршрута: от 2 до 80 символов");
  }
  if (lead.length < 10 || lead.length > 300) {
    throw new HttpError(400, "Описание маршрута: от 10 до 300 символов");
  }
  if (stops.length < 2 || stops.length > 6) {
    throw new HttpError(400, "В маршруте от 2 до 6 объектов");
  }
  const found = await Attraction.find({ slug: { $in: stops }, oblast }).select("slug");
  if (found.length !== new Set(stops).size) {
    throw new HttpError(400, "В маршруте есть неизвестный объект");
  }
  if (cafeTitle.length < 2 || cafeNote.length < 8) {
    throw new HttpError(400, "Укажите кафе и короткую пометку");
  }
  if (!Number.isFinite(cafeLat) || !Number.isFinite(cafeLng)) {
    throw new HttpError(400, "Укажите координаты кафе");
  }
  if (!Number.isFinite(order)) {
    throw new HttpError(400, "Порядок должен быть числом");
  }
  const titleEn = String(source.titleEn || "").trim();
  const leadEn = String(source.leadEn || "").trim();
  const cafeTitleEn = String(source.cafeTitleEn || "").trim();
  const cafeNoteEn = String(source.cafeNoteEn || "").trim();
  if (titleEn.length > 80 || leadEn.length > 300 || cafeTitleEn.length > 80 || cafeNoteEn.length > 300) {
    throw new HttpError(400, "Английский текст маршрута слишком длинный");
  }
  return { title, titleEn, lead, leadEn, stops, cafeTitle, cafeTitleEn, cafeNote, cafeNoteEn, cafeLat, cafeLng, order };
}

export async function listTrips(req: Request, res: Response) {
  const items = await Trip.find({ oblast: readOblast(req.query.oblast) }).sort({ order: 1, title: 1 });
  res.json({ items: items.map(presentTrip) });
}

export async function createTrip(req: Request, res: Response) {
  const oblast = readOblast((req.body as { oblast?: unknown }).oblast);
  const input = await readTrip(req.body, oblast);
  let slug = makeSlug(input.title);
  const taken = await Trip.findOne({ slug });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  const item = await Trip.create({ ...input, slug, oblast });
  res.status(201).json({ item: presentTrip(item) });
}

export async function updateTrip(req: Request, res: Response) {
  const current = await Trip.findById(req.params.id);
  if (!current) {
    throw new HttpError(404, "Маршрут не найден");
  }
  const input = await readTrip(req.body, current.oblast || "gomel");
  const item = await Trip.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) {
    throw new HttpError(404, "Маршрут не найден");
  }
  res.json({ item: presentTrip(item) });
}

export async function deleteTrip(req: Request, res: Response) {
  const item = await Trip.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new HttpError(404, "Маршрут не найден");
  }
  res.json({ ok: true });
}
