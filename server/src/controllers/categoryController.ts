import { Request, Response } from "express";
import { Attraction } from "../models/Attraction";
import { Category } from "../models/Category";
import { HttpError } from "../utils/httpError";
import { makeSlug } from "../utils/slug";

export async function listCategories(_req: Request, res: Response) {
  const items = await Category.find().sort({ title: 1 });
  res.json({
    items: items.map((item) => ({
      id: String(item._id),
      slug: item.slug,
      title: item.title,
      description: item.description,
    })),
  });
}

function readCategory(body: unknown) {
  const source = (body || {}) as Record<string, unknown>;
  const title = String(source.title || "").trim();
  const description = String(source.description || "").trim();
  if (title.length < 2 || title.length > 40) {
    throw new HttpError(400, "Название категории: от 2 до 40 символов");
  }
  if (description.length < 4 || description.length > 160) {
    throw new HttpError(400, "Описание категории: от 4 до 160 символов");
  }
  return { title, description };
}

export async function createCategory(req: Request, res: Response) {
  const input = readCategory(req.body);
  let slug = makeSlug(input.title);
  const taken = await Category.findOne({ slug });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  const item = await Category.create({ ...input, slug });
  res.status(201).json({
    item: { id: String(item._id), slug: item.slug, title: item.title, description: item.description },
  });
}

export async function updateCategory(req: Request, res: Response) {
  const input = readCategory(req.body);
  const item = await Category.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!item) {
    throw new HttpError(404, "Категория не найдена");
  }
  res.json({
    item: { id: String(item._id), slug: item.slug, title: item.title, description: item.description },
  });
}

export async function deleteCategory(req: Request, res: Response) {
  const used = await Attraction.countDocuments({ category: req.params.id });
  if (used > 0) {
    throw new HttpError(400, "Категория используется объектами, сначала перенесите их");
  }
  const item = await Category.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new HttpError(404, "Категория не найдена");
  }
  res.json({ ok: true });
}
