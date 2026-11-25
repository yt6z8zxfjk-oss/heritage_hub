import { Request, Response } from "express";
import { GuideCard } from "../models/GuideCard";
import { readOblast } from "../seed/oblasts";
import { HttpError } from "../utils/httpError";
import { makeSlug } from "../utils/slug";

const kinds = ["district", "category", "search", "anchor"] as const;

function presentGuide(item: {
  _id: unknown;
  slug: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  photo: string;
  kind: string;
  target: string;
  order: number;
}) {
  return {
    id: String(item._id),
    slug: item.slug,
    title: item.title,
    titleEn: item.titleEn || "",
    text: item.text,
    textEn: item.textEn || "",
    photo: item.photo,
    kind: item.kind,
    target: item.target,
    order: item.order,
  };
}

function readGuide(body: unknown) {
  const source = (body || {}) as Record<string, unknown>;
  const title = String(source.title || "").trim();
  const text = String(source.text || "").trim();
  const photo = String(source.photo || "").trim();
  const kind = String(source.kind || "").trim();
  const target = String(source.target || "").trim();
  const order = Number(source.order ?? 0);
  if (title.length < 2 || title.length > 80) {
    throw new HttpError(400, "Название карточки: от 2 до 80 символов");
  }
  if (text.length < 10 || text.length > 300) {
    throw new HttpError(400, "Текст карточки: от 10 до 300 символов");
  }
  if (!photo.startsWith("/") && !photo.startsWith("http")) {
    throw new HttpError(400, "Фото: путь /photos/... или ссылка");
  }
  if (!kinds.includes(kind as (typeof kinds)[number])) {
    throw new HttpError(400, "Выберите действие карточки");
  }
  if (target.length < 1 || target.length > 80) {
    throw new HttpError(400, "Укажите, куда ведёт карточка");
  }
  if (kind === "anchor" && !target.startsWith("#")) {
    throw new HttpError(400, "Якорь начинается с #, например #routes");
  }
  if (!Number.isFinite(order)) {
    throw new HttpError(400, "Порядок должен быть числом");
  }
  const titleEn = String(source.titleEn || "").trim();
  const textEn = String(source.textEn || "").trim();
  if (titleEn.length > 80 || textEn.length > 300) {
    throw new HttpError(400, "Английский текст карточки слишком длинный");
  }
  return { title, titleEn, text, textEn, photo, kind, target, order };
}

export async function listGuides(req: Request, res: Response) {
  const items = await GuideCard.find({ oblast: readOblast(req.query.oblast) }).sort({ order: 1, title: 1 });
  res.json({ items: items.map(presentGuide) });
}

export async function createGuide(req: Request, res: Response) {
  const input = readGuide(req.body);
  let slug = makeSlug(input.title);
  const taken = await GuideCard.findOne({ slug });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  const item = await GuideCard.create({ ...input, slug, oblast: readOblast((req.body as { oblast?: unknown }).oblast) });
  res.status(201).json({ item: presentGuide(item) });
}

export async function updateGuide(req: Request, res: Response) {
  const input = readGuide(req.body);
  const item = await GuideCard.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) {
    throw new HttpError(404, "Карточка не найдена");
  }
  res.json({ item: presentGuide(item) });
}

export async function deleteGuide(req: Request, res: Response) {
  const item = await GuideCard.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new HttpError(404, "Карточка не найдена");
  }
  res.json({ ok: true });
}
