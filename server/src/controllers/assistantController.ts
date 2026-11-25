import { Request, Response } from "express";
import { checkDescription } from "../assistant/checkDescription";
import { checkPlan } from "../assistant/checkPlan";
import { completeJson } from "../assistant/completeJson";
import { loadCardsByIds, loadCatalog } from "../assistant/loadCatalog";
import { mentionedPlace } from "../assistant/phrase";
import { descriptionSystem, descriptionUser, planSystem, planUser } from "../assistant/prompts";
import { CatalogCard, CurrentRoute } from "../assistant/types";
import { env } from "../config/env";
import { oblastNames, readOblast } from "../seed/oblasts";
import { HttpError } from "../utils/httpError";
import { Transport } from "../utils/routeMeasure";

const hits = new Map<string, number[]>();

function rateLimit(req: Request) {
  const key = req.ip || "local";
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 12) {
    throw new HttpError(429, "Слишком много запросов. Подождите немного.");
  }
  recent.push(now);
  hits.set(key, recent);
}

function readLang(value: unknown): "ru" | "en" | "be" {
  return value === "en" || value === "be" ? value : "ru";
}

function readTransport(value: unknown): Transport {
  return value === "walk" || value === "bike" || value === "car" ? value : "car";
}

function readHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(-4)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as { role?: unknown; text?: unknown };
      const text = String(row.text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
      if (!text) {
        return null;
      }
      return { role: row.role === "assistant" ? "assistant" : "user", text };
    })
    .filter((item): item is { role: string; text: string } => Boolean(item));
}

function readCurrent(value: unknown, cards: CatalogCard[]): CurrentRoute | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as { transport?: unknown; summary?: unknown; days?: unknown };
  if (!Array.isArray(record.days)) {
    return null;
  }
  const known = new Set(cards.map((card) => card.id));
  const days = record.days
    .slice(0, 2)
    .map((day, index) => {
      const row = day && typeof day === "object" ? (day as { placeIds?: unknown }) : {};
      const placeIds = Array.isArray(row.placeIds)
        ? row.placeIds.map((id) => String(id)).filter((id) => known.has(id)).slice(0, 5)
        : [];
      return { title: index === 0 ? "День 1" : "День 2", placeIds };
    })
    .filter((day) => day.placeIds.length);
  if (!days.length) {
    return null;
  }
  return {
    transport: readTransport(record.transport),
    summary: String(record.summary || "").slice(0, 240),
    days,
  };
}

function presentPlace(card: CatalogCard) {
  return {
    id: card.id,
    title: card.title,
    place: card.place,
    district: card.district,
    address: card.address,
    workHours: card.workHours,
    category: card.category,
    lat: card.lat,
    lng: card.lng,
    description: card.about,
  };
}

export function assistantStatus(_req: Request, res: Response) {
  res.json({ available: Boolean(env.aiApiKey) });
}

export async function planAssistant(req: Request, res: Response) {
  const phrase = String(req.body?.phrase || "").trim().slice(0, 500);
  if (phrase.length < 3) {
    throw new HttpError(400, "Напишите, какую поездку собрать");
  }
  if (!env.aiApiKey) {
    throw new HttpError(503, "Составление маршрута временно недоступно");
  }
  rateLimit(req);
  const oblast = readOblast(req.body?.oblast);
  const region = oblastNames[oblast];
  const cards = await loadCatalog(oblast);
  const current = readCurrent(req.body?.current, cards);
  const named = mentionedPlace(phrase, cards.map((card) => card.place));
  const lang = readLang(req.body?.lang);
  const raw = await completeJson(
    planSystem(lang, region.ru, region.capital),
    planUser(phrase, cards, current, named || region.capital, readHistory(req.body?.history)),
    0.2
  );
  const checked = checkPlan(raw, {
    phrase,
    cards,
    current,
    lang,
    capital: { name: region.capital, inRu: region.inRu, inEn: region.inEn, inBe: region.inBe },
  });
  if (checked.status === "error") {
    throw new HttpError(422, checked.message);
  }
  if (checked.status === "decline") {
    res.json({ applied: false, message: checked.message });
    return;
  }
  const days = [];
  for (const day of checked.route.days) {
    const loaded = await loadCardsByIds(day.placeIds, 500, oblast);
    if (loaded.some((card) => !card)) {
      throw new HttpError(422, "В ответе есть место не из каталога. Маршрут не изменён.");
    }
    days.push({
      title: day.title,
      places: loaded.filter((card): card is CatalogCard => Boolean(card)).map(presentPlace),
    });
  }
  res.json({
    applied: true,
    route: {
      startPlace: checked.route.startPlace,
      startAssumed: checked.route.startAssumed,
      transport: checked.route.transport,
      fit: checked.route.fit,
      gap: checked.route.gap,
      summary: checked.route.summary,
      days,
    },
  });
}

export async function describeAssistant(req: Request, res: Response) {
  const phrase = String(req.body?.phrase || "").trim().slice(0, 500);
  const gap = String(req.body?.gap || "").trim().slice(0, 400);
  const source = Array.isArray(req.body?.days) ? req.body.days.slice(0, 2) : [];
  if (!source.length) {
    throw new HttpError(400, "Нет точек для описания");
  }
  if (!env.aiApiKey) {
    throw new HttpError(503, "Составление маршрута временно недоступно");
  }
  rateLimit(req);
  const oblast = readOblast(req.body?.oblast);
  const region = oblastNames[oblast];
  const catalog = await loadCatalog(oblast);
  const days: { title: string; cards: CatalogCard[] }[] = [];
  for (const day of source) {
    const row = day && typeof day === "object" ? (day as { title?: unknown; placeIds?: unknown }) : {};
    const ids = Array.isArray(row.placeIds) ? row.placeIds.map((id) => String(id)).slice(0, 5) : [];
    const loaded = await loadCardsByIds(ids, 500, oblast);
    if (!ids.length || loaded.some((card) => !card)) {
      throw new HttpError(422, "В ответе есть место не из каталога. Маршрут не изменён.");
    }
    days.push({
      title: String(row.title || ""),
      cards: loaded.filter((card): card is CatalogCard => Boolean(card)),
    });
  }
  const system = descriptionSystem(readLang(req.body?.lang), region.ru);
  const user = descriptionUser(phrase, gap, days);
  const selected = days.flatMap((day) => day.cards);
  let raw = await completeJson(system, user, 0.4);
  let checked = checkDescription(raw, { selected, catalog });
  if (checked.status === "error") {
    raw = await completeJson(
      system,
      `${user}\nПрошлый ответ не принят: ${checked.message} Напиши заметку заново и не добавляй часы, цены, кафе и места вне этого списка.`,
      0.2
    );
    checked = checkDescription(raw, { selected, catalog });
  }
  if (checked.status === "error") {
    throw new HttpError(422, checked.message);
  }
  res.json({ text: checked.text });
}
