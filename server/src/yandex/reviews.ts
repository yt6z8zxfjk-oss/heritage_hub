const SEARCH = "https://yandex.by/maps/";
const CACHE_MS = 6 * 60 * 60 * 1000;
const NEAR_KM = 3;
const LIMIT = 6;

type YandexReview = {
  id: string;
  authorName: string;
  text: string;
  rating: number;
};

type CacheEntry = {
  at: number;
  items: YandexReview[];
  url: string;
};

const cache = new Map<string, CacheEntry>();

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "ru",
};

function kmBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function readJsonArray(html: string, marker: string) {
  const at = html.indexOf(marker);
  if (at < 0) {
    return null;
  }
  const start = at + marker.length - 1;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        try {
          const value = JSON.parse(html.slice(start, index + 1)) as unknown;
          return Array.isArray(value) ? value : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function readPage(url: string) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(9000), redirect: "follow" });
  if (!response.ok) {
    return "";
  }
  return response.text();
}

function nearestOrg(html: string, lat: number, lng: number) {
  const pattern =
    /"id":"(\d{5,})","displayGeometry":\{"type":"GeometryCollection","geometries":\[\{"type":"(?:Polygon|Point|LineString)","coordinates":\[+(?:\[)*([0-9.]+),([0-9.]+)/g;
  let best: { id: string; distance: number } | null = null;
  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    const pointLng = Number(match[2]);
    const pointLat = Number(match[3]);
    if (!Number.isFinite(pointLat) || !Number.isFinite(pointLng)) {
      continue;
    }
    const distance = kmBetween(lat, lng, pointLat, pointLng);
    if (distance > NEAR_KM) {
      continue;
    }
    if (!best || distance < best.distance) {
      best = { id, distance };
    }
  }
  if (best) {
    return best.id;
  }
  const canonical = html.match(/rel="canonical" href="https:\/\/yandex\.[a-z.]+\/maps\/org\/[^"/]+\/(\d+)\//);
  if (canonical) {
    return canonical[1];
  }
  return html.match(/\/org\/[a-z0-9_]+\/(\d+)\//)?.[1] || "";
}

function closeEnough(html: string, lat: number, lng: number) {
  const pattern = /"coordinates":\[([0-9.]+),([0-9.]+)\]/g;
  let best = Number.POSITIVE_INFINITY;
  for (const match of html.matchAll(pattern)) {
    const pointLng = Number(match[1]);
    const pointLat = Number(match[2]);
    if (pointLat < 51 || pointLat > 57 || pointLng < 22 || pointLng > 33) {
      continue;
    }
    best = Math.min(best, kmBetween(lat, lng, pointLat, pointLng));
  }
  return best <= NEAR_KM;
}

function readReviews(html: string) {
  const rows = readJsonArray(html, '"reviews":[');
  if (!rows) {
    return [];
  }
  const items: YandexReview[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const review = row as {
      reviewId?: unknown;
      text?: unknown;
      rating?: unknown;
      author?: { name?: unknown };
    };
    const text = String(review.text || "").replace(/\s+/g, " ").trim();
    const rating = Number(review.rating);
    if (text.length < 2 || !Number.isFinite(rating)) {
      continue;
    }
    items.push({
      id: String(review.reviewId || `${items.length}-${text.slice(0, 24)}`),
      authorName: String(review.author?.name || "").trim() || "Яндекс Карты",
      text: text.length > 500 ? `${text.slice(0, 499).trim()}…` : text,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
    });
    if (items.length >= LIMIT) {
      break;
    }
  }
  return items;
}

export async function loadYandexReviews(place: {
  id: string;
  title: string;
  town: string;
  lat: number;
  lng: number;
}) {
  const saved = cache.get(place.id);
  if (saved && Date.now() - saved.at < CACHE_MS) {
    return { items: saved.items, url: saved.url };
  }
  const empty = { items: [] as YandexReview[], url: "" };
  const query = `${place.title} ${place.town}`.trim();
  const searchUrl = `${SEARCH}?ll=${place.lng},${place.lat}&z=16&text=${encodeURIComponent(query)}`;
  const searchHtml = await readPage(searchUrl);
  const orgId = nearestOrg(searchHtml, place.lat, place.lng);
  if (!orgId) {
    cache.set(place.id, { at: Date.now(), ...empty });
    return empty;
  }
  const url = `https://yandex.by/maps/org/place/${orgId}/reviews/`;
  const reviewsHtml = await readPage(url);
  if (!closeEnough(reviewsHtml, place.lat, place.lng)) {
    cache.set(place.id, { at: Date.now(), ...empty });
    return empty;
  }
  const items = readReviews(reviewsHtml);
  const result = { items, url: items.length ? url : "" };
  cache.set(place.id, { at: Date.now(), ...result });
  return result;
}
