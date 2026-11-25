import { haversineKm } from "../utils/routeMeasure";
import { clip, inferReachKm, mentionedPlace, resolveTransport, stripTravelNumbers, wantsWeekend } from "./phrase";
import { CatalogCard, CurrentRoute, PlanRoute } from "./types";

export type PlanCheck =
  | { status: "error"; message: string }
  | { status: "decline"; message: string }
  | { status: "ok"; route: PlanRoute };

const BROKEN = "Ответ получился неразборчивым. Маршрут не изменён.";
const UNKNOWN = "В ответе есть место не из каталога. Маршрут не изменён.";
const DUPLICATE = "В маршруте повторяется одно и то же место. Маршрут не изменён.";
const REBUILT = "Правка собрала маршрут заново. Прежний маршрут оставлен.";
const TOO_SMALL = "Получилось меньше двух точек. Маршрут не изменён.";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function resolveId(value: unknown, cards: CatalogCard[]) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  const byId = cards.find((card) => card.id === raw);
  if (byId) {
    return byId.id;
  }
  const byTitle = cards.filter((card) => card.title.toLowerCase() === raw.toLowerCase());
  return byTitle.length === 1 ? byTitle[0].id : "";
}

function readDays(record: Record<string, unknown>) {
  const source = Array.isArray(record.days)
    ? record.days
    : Array.isArray(record.placeIds)
      ? [{ title: "День 1", placeIds: record.placeIds }]
      : null;
  if (!source) {
    return null;
  }
  return source.map((day) => {
    const row = asRecord(day);
    const placeIds = row && Array.isArray(row.placeIds) ? row.placeIds : [];
    return {
      title: row ? String(row.title || "") : "",
      placeIds,
    };
  });
}

function clockKey(value: string) {
  const [hours, minutes] = value.split(":");
  return `${Number(hours)}:${minutes}`;
}

function containsWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zа-яё])${escaped}(?![a-zа-яё])`, "i").test(text);
}

function mentionsAsFact(text: string, word: string, source: string) {
  if (!containsWord(text, word)) {
    return false;
  }
  if (containsWord(source, word)) {
    return false;
  }
  const honest = new RegExp(
    [
      `нет[^.]{0,80}${word}`,
      `${word}[^.]{0,80}нет`,
      `${word}[^.]{0,80}не\\s+указан`,
      `не\\s+указан[^.]{0,40}${word}`,
      `в карточк[аеи][^.]{0,50}${word}`,
      `негде[^.]{0,40}${word}`,
      `${word}[^.]{0,40}негде`,
    ].join("|"),
    "i"
  );
  return !honest.test(text);
}

function talkAnswer(text: string, cards: CatalogCard[]): PlanCheck {
  const clean = stripTravelNumbers(text).trim();
  if (clean.length < 8 || clean.length > 1200) {
    return { status: "error", message: BROKEN };
  }
  const off = "В ответе есть то, чего нет в карточках. Повторите вопрос.";
  if (/\d+(?:[.,]\d+)?\s*км/i.test(clean) || /\d+\s*(?:мин|час)[^\n.]{0,20}(пути|езд|дорог)/i.test(clean)) {
    return { status: "error", message: off };
  }
  const allowedClocks = new Set(cards.flatMap((card) => (card.workHours.match(/\d{1,2}:\d{2}/g) || []).map(clockKey)));
  const clocks = clean.match(/\d{1,2}:\d{2}/g) || [];
  if (clocks.some((clock) => !allowedClocks.has(clockKey(clock)))) {
    return { status: "error", message: off };
  }
  const source = cards.map((card) => `${card.title} ${card.about} ${card.address} ${card.workHours} ${card.category}`).join(" ");
  const forbidden = ["кафе", "ресторан", "туалет", "столов"];
  if (forbidden.some((word) => mentionsAsFact(clean, word, source))) {
    return { status: "error", message: off };
  }
  if (/(руб|byn|€|\$)/i.test(clean) && !/(руб|byn|€|\$)/i.test(source)) {
    return { status: "error", message: off };
  }
  if (/\+?\d[\d\s()-]{8,}/.test(clean) && !/\+?\d[\d\s()-]{8,}/.test(source)) {
    return { status: "error", message: off };
  }
  return { status: "decline", message: clean };
}

function originOf(cards: CatalogCard[], startPlace: string, fallbackPlace: string) {
  const local = cards.filter((card) => card.place.toLowerCase() === startPlace.toLowerCase());
  const pool = local.length ? local : cards.filter((card) => card.place === fallbackPlace);
  const source = pool.length ? pool : cards;
  const lat = source.reduce((sum, card) => sum + card.lat, 0) / source.length;
  const lng = source.reduce((sum, card) => sum + card.lng, 0) / source.length;
  return { lat, lng };
}

function keepNearest(ids: string[], cards: Map<string, CatalogCard>, origin: { lat: number; lng: number }, limit: number) {
  const ranked = [...ids].sort(
    (left, right) =>
      haversineKm(origin, cards.get(left) || origin) - haversineKm(origin, cards.get(right) || origin)
  );
  const keep = new Set(ranked.slice(0, limit));
  return ids.filter((id) => keep.has(id));
}

export function checkPlan(
  raw: unknown,
  input: {
    phrase: string;
    cards: CatalogCard[];
    current: CurrentRoute | null;
    lang?: "ru" | "en" | "be";
    capital?: { name: string; inRu: string; inEn: string; inBe: string };
  }
): PlanCheck {
  const record = asRecord(raw);
  const parsedDays = record ? readDays(record) : null;
  const answerOnly = record && String(record.kind || "") === "answer" && !parsedDays?.some((day) => day.placeIds.length);
  if (answerOnly && record) {
    return talkAnswer(String(record.text || record.summary || ""), input.cards);
  }
  if (!record || !parsedDays) {
    return { status: "error", message: BROKEN };
  }

  const cardsById = new Map(input.cards.map((card) => [card.id, card]));
  const capital = input.capital || { name: "Гомель", inRu: "Гомеле", inEn: "Gomel", inBe: "Гомелі" };
  const namedStart = mentionedPlace(input.phrase, input.cards.map((card) => card.place));
  const startAssumed = !namedStart;
  const startPlace = namedStart || capital.name;
  const editing = Boolean(input.current && input.current.days.some((day) => day.placeIds.length));
  const weekend = wantsWeekend(input.phrase) || (editing && (input.current?.days.length || 0) > 1 && !/одним дн|один день/i.test(input.phrase));
  const maxDays = weekend ? 2 : 1;
  const maxStops = 5;
  const reachKm = inferReachKm(input.phrase);
  const origin = originOf(input.cards, startPlace, capital.name);

  const resolved: string[][] = [];
  for (const day of parsedDays.slice(0, maxDays)) {
    const ids: string[] = [];
    for (const value of day.placeIds) {
      const id = resolveId(value, input.cards);
      if (!id) {
        return { status: "error", message: UNKNOWN };
      }
      ids.push(id);
    }
    resolved.push(ids);
  }

  const flat = resolved.flat();
  if (flat.length === 0) {
    const message = clip(String(record.gap || record.summary || ""), 400);
    return {
      status: "decline",
      message: message || "Из каталога так не собрать. Назовите город и что хотите увидеть.",
    };
  }
  if (new Set(flat).size !== flat.length) {
    return { status: "error", message: DUPLICATE };
  }

  let droppedFar = false;
  const days = resolved
    .map((ids) => {
      const near = ids.filter((id) => {
        const card = cardsById.get(id);
        return card ? haversineKm(origin, card) <= reachKm : false;
      });
      let next = near.length >= 2 ? near : ids;
      if (near.length >= 2 && near.length !== ids.length) {
        droppedFar = true;
      }
      if (next.length > maxStops) {
        next = keepNearest(next, cardsById, origin, maxStops);
      }
      return next;
    })
    .filter((ids) => ids.length > 0);

  let shaped = days;
  if (maxDays === 2 && shaped.length === 1 && shaped[0].length >= 4) {
    const mid = Math.ceil(shaped[0].length / 2);
    const second = shaped[0].slice(mid);
    if (second.length >= 2) {
      shaped = [shaped[0].slice(0, mid), second];
    }
  }

  const chosen = shaped.flat();
  if (chosen.length < 2) {
    return { status: "error", message: TOO_SMALL };
  }

  if (editing && input.current) {
    const previous = new Set(input.current.days.flatMap((day) => day.placeIds));
    const shared = chosen.filter((id) => previous.has(id));
    if (shared.length === 0) {
      return { status: "error", message: REBUILT };
    }
  }

  let gap = clip(stripTravelNumbers(String(record.gap || "")), 400);
  const english = input.lang === "en";
  const belarusian = input.lang === "be";
  const asksFood = /поесть|обед|кафе|ресторан|перекус|lunch|cafe|eat|паесці|абед/i.test(input.phrase);
  const hasFood = input.cards.some((card) => /кафе|ресторан|столов/i.test(`${card.title} ${card.about} ${card.category}`));
  const foodLine = english
    ? "The cards have no cafe and nowhere listed for lunch."
    : belarusian
      ? "У картках няма кавярні і няма месца, дзе паабедаць."
      : "В карточках нет кафе и нет места, где пообедать.";
  if (asksFood && !hasFood && !/кафе|поесть|обед|ресторан|cafe|lunch|кавярн/i.test(gap)) {
    gap = clip([gap, foodLine].filter(Boolean).join(" "), 400);
  }
  if (droppedFar && !gap) {
    gap = english
      ? "Far points were left out: they do not fit this trip."
      : belarusian
        ? "Далёкія кропкі не ўзяў: на гэтую паездку яны не ўкладваюцца."
        : "Дальние точки не взял: за эту поездку они не укладываются.";
  }
  if (wantsWeekend(input.phrase) && shaped.length < 2) {
    gap = clip(
      [
        gap,
        english
          ? "There were not enough separate points for a second day, so it stays one day."
          : belarusian
            ? "На другі дзень асобных кропак не набралася, таму дзень адзін."
            : "На второй день отдельных точек не набралось, поэтому день один.",
      ]
        .filter(Boolean)
        .join(" "),
      400
    );
  }

  const startLine = english
    ? `The start is ${capital.inEn}.`
    : belarusian
      ? `Старт узялі ў ${capital.inBe}.`
      : `Старт взяли в ${capital.inRu}.`;
  let summary = clip(stripTravelNumbers(String(record.summary || "")), 500);
  const stem = capital.name.slice(0, 4);
  if (startAssumed && !new RegExp(stem, "i").test(summary)) {
    summary = clip(`${startLine} ${summary}`.trim(), 500);
  }
  if (!summary) {
    summary = startAssumed
      ? startLine
      : english
        ? "The points come from the regional catalog."
        : belarusian
          ? "Кропкі ўзятыя з каталога вобласці."
          : "Точки взяты из каталога области.";
  }

  const fit = gap ? "partial" : "ok";
  return {
    status: "ok",
    route: {
      startPlace,
      startAssumed,
      transport: resolveTransport(input.phrase, editing ? input.current?.transport || null : null),
      fit,
      gap,
      summary,
      days: shaped.map((placeIds, index) => ({
        title: shaped.length > 1 ? `День ${index + 1}` : "",
        placeIds,
      })),
    },
  };
}
