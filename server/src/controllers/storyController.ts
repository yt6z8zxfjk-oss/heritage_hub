import { Request, Response } from "express";
import { Story } from "../models/Story";
import { readOblast } from "../seed/oblasts";
import { HttpError } from "../utils/httpError";
import { makeSlug } from "../utils/slug";

function presentStory(item: {
  _id: unknown;
  slug: string;
  era: string;
  eraEn?: string;
  title: string;
  titleEn?: string;
  lead: string;
  leadEn?: string;
  body: string;
  bodyEn?: string;
  photo: string;
  order: number;
}) {
  return {
    id: String(item._id),
    slug: item.slug,
    era: item.era,
    eraEn: item.eraEn || "",
    title: item.title,
    titleEn: item.titleEn || "",
    lead: item.lead,
    leadEn: item.leadEn || "",
    body: item.body,
    bodyEn: item.bodyEn || "",
    photo: item.photo,
    order: item.order,
  };
}

function readStory(body: unknown) {
  const source = (body || {}) as Record<string, unknown>;
  const title = String(source.title || "").trim();
  const era = String(source.era || "").trim();
  const lead = String(source.lead || "").trim();
  const text = String(source.body || "").trim();
  const photo = String(source.photo || "").trim();
  const order = Number(source.order ?? 0);
  if (title.length < 2 || title.length > 120) {
    throw new HttpError(400, "Название истории: от 2 до 120 символов");
  }
  if (era.length < 1 || era.length > 40) {
    throw new HttpError(400, "Укажите период, до 40 символов");
  }
  if (lead.length < 20 || lead.length > 400) {
    throw new HttpError(400, "Короткая подпись: от 20 до 400 символов");
  }
  if (text.length < 80 || text.length > 5000) {
    throw new HttpError(400, "Текст истории: от 80 до 5000 символов");
  }
  if (!photo.startsWith("/") && !photo.startsWith("http")) {
    throw new HttpError(400, "Фото: путь /photos/... или ссылка");
  }
  if (!Number.isFinite(order)) {
    throw new HttpError(400, "Порядок должен быть числом");
  }
  const eraEn = String(source.eraEn || "").trim();
  const titleEn = String(source.titleEn || "").trim();
  const leadEn = String(source.leadEn || "").trim();
  const bodyEn = String(source.bodyEn || "").trim();
  if (eraEn.length > 40 || titleEn.length > 160 || leadEn.length > 400 || bodyEn.length > 5000) {
    throw new HttpError(400, "Английский текст истории слишком длинный");
  }
  return { title, titleEn, era, eraEn, lead, leadEn, body: text, bodyEn, photo, order };
}

export async function listStories(req: Request, res: Response) {
  const items = await Story.find({ oblast: readOblast(req.query.oblast) }).sort({ order: 1, title: 1 });
  res.json({ items: items.map(presentStory) });
}

export async function getStory(req: Request, res: Response) {
  const item = await Story.findOne({ slug: req.params.slug });
  if (!item) {
    throw new HttpError(404, "История не найдена");
  }
  res.json({ item: presentStory(item) });
}

export async function createStory(req: Request, res: Response) {
  const input = readStory(req.body);
  let slug = makeSlug(input.title);
  const taken = await Story.findOne({ slug });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  const item = await Story.create({ ...input, slug, oblast: readOblast((req.body as { oblast?: unknown }).oblast) });
  res.status(201).json({ item: presentStory(item) });
}

export async function updateStory(req: Request, res: Response) {
  const input = readStory(req.body);
  const item = await Story.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) {
    throw new HttpError(404, "История не найдена");
  }
  res.json({ item: presentStory(item) });
}

export async function deleteStory(req: Request, res: Response) {
  const item = await Story.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new HttpError(404, "История не найдена");
  }
  res.json({ ok: true });
}
