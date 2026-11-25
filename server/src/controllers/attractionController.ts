import { Request, Response } from "express";
import mongoose from "mongoose";
import { Attraction } from "../models/Attraction";
import { Category } from "../models/Category";
import { Photo } from "../models/Photo";
import { Review } from "../models/Review";
import { HttpError } from "../utils/httpError";
import { presentAttraction, presentAttractions } from "../utils/presentAttraction";
import { readAttractionInput } from "../utils/readAttractionInput";
import { readOblast } from "../seed/oblasts";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function uniqueSlug(base: string) {
  let slug = base;
  let index = 2;
  while (await Attraction.exists({ slug })) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

async function savePhotos(attractionId: mongoose.Types.ObjectId, photos: Array<{ url: string; alt: string }>) {
  await Photo.deleteMany({ attraction: attractionId });
  if (photos.length) {
    await Photo.insertMany(photos.map((photo) => ({ ...photo, attraction: attractionId })));
  }
}

export async function listAttractions(req: Request, res: Response) {
  const q = String(req.query.q || "").trim().slice(0, 80);
  const category = String(req.query.category || "").trim();
  const district = String(req.query.district || "").trim().slice(0, 40);
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius);
  const filter: Record<string, unknown> = { oblast: readOblast(req.query.oblast) };

  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      throw new HttpError(400, "Некорректная категория");
    }
    filter.category = category;
  }

  if (district) {
    filter.district = district;
  }

  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius) && radius > 0;
  if (hasGeo) {
    if (radius > 200000) {
      throw new HttpError(400, "Радиус поиска слишком большой");
    }
    filter.location = {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    };
  } else if (q) {
    const pattern = escapeRegex(q);
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { address: { $regex: pattern, $options: "i" } },
      { place: { $regex: pattern, $options: "i" } },
      { district: { $regex: pattern, $options: "i" } },
      { history: { $regex: pattern, $options: "i" } },
    ];
  }

  let found = await Attraction.find(filter).populate("category").limit(200);
  if (hasGeo && q) {
    const needle = q.toLowerCase();
    found = found.filter((item) => {
      const bag = `${item.title} ${item.description} ${item.history || ""} ${item.address} ${item.place} ${item.district || ""}`.toLowerCase();
      return bag.includes(needle);
    });
  }

  if (!found.length) {
    res.json({ items: [], message: "Ничего не нашли. Попробуйте другой район или другое слово." });
    return;
  }

  const items = await presentAttractions(found);
  res.json({ items });
}

export async function listDistricts(req: Request, res: Response) {
  const rows = await Attraction.aggregate<{ _id: string; count: number }>([
    { $match: { oblast: readOblast(req.query.oblast), district: { $nin: ["", null] } } },
    { $group: { _id: "$district", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({
    items: rows.map((row) => ({ title: row._id, count: row.count })),
  });
}

export async function getAttraction(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Объект не найден");
  }
  const item = await Attraction.findById(req.params.id).populate("category");
  if (!item) {
    throw new HttpError(404, "Объект не найден");
  }
  res.json({ item: await presentAttraction(item) });
}

export async function createAttraction(req: Request, res: Response) {
  const input = readAttractionInput(req.body);
  const category = await Category.findById(input.categoryId);
  if (!category) {
    throw new HttpError(400, "Категория не найдена");
  }
  const slug = await uniqueSlug(input.slug);
  const created = await Attraction.create({
    title: input.title,
    titleEn: input.titleEn,
    slug,
    description: input.description,
    descriptionEn: input.descriptionEn,
    address: input.address,
    addressEn: input.addressEn,
    place: input.place,
    district: input.district,
    history: input.history,
    historyEn: input.historyEn,
    category: category._id,
    location: { type: "Point", coordinates: [input.lng, input.lat] },
    rating: input.rating,
    workHours: input.workHours,
    workHoursEn: input.workHoursEn,
    oblast: input.oblast,
  });
  await savePhotos(created._id, input.photos);
  const full = await Attraction.findById(created._id).populate("category");
  res.status(201).json({ item: await presentAttraction(full!) });
}

export async function updateAttraction(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Объект не найден");
  }
  const current = await Attraction.findById(req.params.id);
  if (!current) {
    throw new HttpError(404, "Объект не найден");
  }
  const input = readAttractionInput(req.body, current.slug);
  const category = await Category.findById(input.categoryId);
  if (!category) {
    throw new HttpError(400, "Категория не найдена");
  }
  current.title = input.title;
  current.titleEn = input.titleEn;
  current.description = input.description;
  current.descriptionEn = input.descriptionEn;
  current.address = input.address;
  current.addressEn = input.addressEn;
  current.place = input.place;
  current.district = input.district;
  current.history = input.history;
  current.historyEn = input.historyEn;
  current.category = category._id;
  current.location = { type: "Point", coordinates: [input.lng, input.lat] };
  current.rating = input.rating;
  current.workHours = input.workHours;
  current.workHoursEn = input.workHoursEn;
  await current.save();
  await savePhotos(current._id, input.photos);
  const full = await Attraction.findById(current._id).populate("category");
  res.json({ item: await presentAttraction(full!) });
}

export async function deleteAttraction(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Объект не найден");
  }
  const current = await Attraction.findById(req.params.id);
  if (!current) {
    throw new HttpError(404, "Объект не найден");
  }
  await Photo.deleteMany({ attraction: current._id });
  await Review.deleteMany({ attraction: current._id });
  await current.deleteOne();
  res.json({ message: "Объект удалён" });
}
