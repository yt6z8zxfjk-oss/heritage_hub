import { Transport } from "../utils/routeMeasure";

export function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function wantsWeekend(phrase: string) {
  return /выходн|два дня|уикенд/i.test(phrase);
}

export function inferReachKm(phrase: string) {
  if (/без дальней|недалек|по городу/i.test(phrase)) {
    return 35;
  }
  if (wantsWeekend(phrase)) {
    return 160;
  }
  if (/день|утром|сегодня/i.test(phrase)) {
    return 90;
  }
  return 120;
}

export function resolveTransport(phrase: string, current: Transport | null): Transport {
  if (/велосипед/i.test(phrase)) {
    return "bike";
  }
  if (/пешк|без машин|без авто/i.test(phrase)) {
    return "walk";
  }
  if (/на машин|машин/i.test(phrase)) {
    return "car";
  }
  return current || "car";
}

export function mentionedPlace(phrase: string, places: string[]) {
  const text = phrase.toLowerCase().replace(/ё/g, "е");
  const sorted = [...new Set(places)].sort((left, right) => right.length - left.length);
  for (const place of sorted) {
    const base = place.toLowerCase().replace(/ё/g, "е");
    const stemLength = Math.min(base.length, Math.max(4, base.length - 2));
    const stem = base.slice(0, stemLength).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![а-я])${stem}[а-я]{0,3}(?![а-я])`, "i");
    if (pattern.test(text)) {
      return place;
    }
  }
  return null;
}

export function stripTravelNumbers(text: string) {
  return text
    .replace(/\d+(?:[.,]\d+)?\s*(?:км|km|мин(?:ут\w*)?|час(?:а|ов)?)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}
