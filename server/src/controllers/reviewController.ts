import { Request, Response } from "express";
import mongoose from "mongoose";
import { Attraction } from "../models/Attraction";
import { Review } from "../models/Review";
import { HttpError } from "../utils/httpError";
import { readPersonName } from "../utils/readAttractionInput";
import { loadYandexReviews } from "../yandex/reviews";

export async function listReviews(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Объект не найден");
  }
  const reviews = await Review.find({
    attraction: req.params.id,
    $or: [{ status: "published" }, { status: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .limit(50);
  const attraction = await Attraction.findById(req.params.id).select("title place location");
  let yandex: { id: string; authorName: string; text: string; rating: number }[] = [];
  let yandexUrl = "";
  const coordinates = attraction?.location?.coordinates;
  if (attraction && Array.isArray(coordinates) && coordinates.length === 2) {
    try {
      const loaded = await loadYandexReviews({
        id: String(attraction._id),
        title: attraction.title,
        town: attraction.place,
        lng: Number(coordinates[0]),
        lat: Number(coordinates[1]),
      });
      yandex = loaded.items;
      yandexUrl = loaded.url;
    } catch {
      yandex = [];
      yandexUrl = "";
    }
  }
  res.json({
    items: reviews.map((item) => ({
      id: String(item._id),
      authorName: item.authorName,
      text: item.text,
      rating: item.rating,
      createdAt: item.createdAt,
    })),
    yandex,
    yandexUrl,
  });
}

export async function createReview(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Объект не найден");
  }
  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) {
    throw new HttpError(404, "Объект не найден");
  }
  const authorName = readPersonName(req.body.authorName, "Имя");
  const text = String(req.body.text || "").trim();
  const rating = Number(req.body.rating);
  if (text.length < 2 || text.length > 600) {
    throw new HttpError(400, "Текст отзыва — от 2 до 600 символов");
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "Поставьте оценку от 1 до 5");
  }
  const review = await Review.create({
    attraction: attraction._id,
    authorName,
    text,
    rating,
    status: "pending",
  });
  res.status(201).json({
    item: {
      id: String(review._id),
      authorName: review.authorName,
      text: review.text,
      rating: review.rating,
      createdAt: review.createdAt,
      status: review.status,
    },
  });
}

function placeTitle(value: unknown) {
  if (value && typeof value === "object" && "title" in value) {
    return String((value as { title: unknown }).title);
  }
  return "Объект удалён";
}

export async function listReviewsForAdmin(_req: Request, res: Response) {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(200).populate("attraction", "title");
  res.json({
    items: reviews.map((item) => ({
      id: String(item._id),
      attractionTitle: placeTitle(item.attraction),
      authorName: item.authorName,
      text: item.text,
      rating: item.rating,
      status: item.status === "pending" ? "pending" : "published",
      createdAt: item.createdAt,
    })),
  });
}

export async function publishReview(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Отзыв не найден");
  }
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new HttpError(404, "Отзыв не найден");
  }
  review.status = "published";
  await review.save();
  res.json({ item: { id: String(review._id), status: review.status } });
}

export async function deleteReview(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, "Отзыв не найден");
  }
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    throw new HttpError(404, "Отзыв не найден");
  }
  res.json({ ok: true });
}
