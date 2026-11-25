import { CatalogCard } from "./types";

export type DescriptionCheck = { status: "error"; message: string } | { status: "ok"; text: string };

const BROKEN = "План дня получился неразборчивым. Маршрут не изменён.";
const OFF_ROUTE = "План дня назвал место не из маршрута. Маршрут не изменён.";
const OFF_FACT = "План дня добавил то, чего нет в карточках. Маршрут не изменён.";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
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

function noteFromStops(stops: unknown[], selected: CatalogCard[]) {
  const titles = new Map(selected.map((card) => [card.id, card.title]));
  return stops
    .map((stop) => {
      const row = asRecord(stop);
      if (!row) {
        return "";
      }
      const title = titles.get(String(row.id || "").trim()) || "";
      return [title, String(row.why || "").trim(), String(row.stay || "").trim(), String(row.look || "").trim()]
        .filter(Boolean)
        .join(". ");
    })
    .filter(Boolean)
    .join(". ");
}

function clockKey(value: string) {
  const [hours, minutes] = value.split(":");
  return `${Number(hours)}:${minutes}`;
}

export function checkDescription(
  raw: unknown,
  input: { selected: CatalogCard[]; catalog: CatalogCard[] }
): DescriptionCheck {
  const record = asRecord(raw);
  const stops = record && Array.isArray(record.stops) ? record.stops : null;
  const written = record ? String(record.text || "").trim() : "";
  const text = written.length >= 80 || !stops ? written : [written, noteFromStops(stops, input.selected)].filter(Boolean).join(". ");
  if (!record || text.length < 80 || !stops) {
    return { status: "error", message: BROKEN };
  }

  const expected = input.selected.map((card) => card.id);
  const received: string[] = [];
  for (const stop of stops) {
    const row = asRecord(stop);
    const id = row ? String(row.id || "").trim() : "";
    if (!id) {
      return { status: "error", message: BROKEN };
    }
    received.push(id);
  }
  if (received.length !== expected.length || new Set(received).size !== received.length) {
    return { status: "error", message: OFF_ROUTE };
  }
  for (const id of expected) {
    if (!received.includes(id)) {
      return { status: "error", message: OFF_ROUTE };
    }
  }

  const selectedTitles = new Set(input.selected.map((card) => card.title.toLowerCase()));
  const foreignTitle = input.catalog.find(
    (card) => card.title.length >= 6 && !selectedTitles.has(card.title.toLowerCase()) && text.toLowerCase().includes(card.title.toLowerCase())
  );
  if (foreignTitle) {
    return { status: "error", message: OFF_ROUTE };
  }

  const selectedAddresses = input.selected.map((card) => card.address.trim()).filter((address) => address.length >= 8);
  const foreignAddress = input.catalog.find((card) => {
    const address = card.address.trim();
    return address.length >= 8 && !selectedAddresses.includes(address) && text.includes(address);
  });
  if (foreignAddress) {
    return { status: "error", message: OFF_FACT };
  }

  const allowedClocks = new Set(
    input.selected.flatMap((card) => (card.workHours.match(/\d{1,2}:\d{2}/g) || []).map(clockKey))
  );
  const clocks = text.match(/\d{1,2}:\d{2}/g) || [];
  if (clocks.some((clock) => !allowedClocks.has(clockKey(clock)))) {
    return { status: "error", message: OFF_FACT };
  }

  const source = input.selected
    .map((card) => `${card.title} ${card.about} ${card.address} ${card.workHours} ${card.category}`)
    .join(" ");
  if (/\d+(?:[.,]\d+)?\s*км/i.test(text) || /\d+\s*(?:мин|час)[^\n.]{0,20}(пути|езд|дорог)/i.test(text)) {
    return { status: "error", message: OFF_FACT };
  }
  const forbidden = ["кафе", "ресторан", "туалет", "столов"];
  if (forbidden.some((word) => mentionsAsFact(text, word, source))) {
    return { status: "error", message: OFF_FACT };
  }
  if (/(руб|byn|€|\$)/i.test(text) && !/(руб|byn|€|\$)/i.test(source)) {
    return { status: "error", message: OFF_FACT };
  }
  if (/\+?\d[\d\s()-]{8,}/.test(text) && !/\+?\d[\d\s()-]{8,}/.test(source)) {
    return { status: "error", message: OFF_FACT };
  }

  return { status: "ok", text: text.slice(0, 5000) };
}
