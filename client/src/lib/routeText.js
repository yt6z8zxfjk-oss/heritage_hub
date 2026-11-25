export function formatDistance(km, lang = "ru") {
  const rounded = Math.round(Number(km) * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const shown = lang === "en" ? text : text.replace(".", ",");
  return `${shown} ${lang === "en" ? "km" : "км"}`;
}

export function formatDuration(minutes, lang = "ru") {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  const min = lang === "en" ? "min" : "мин";
  const hour = lang === "en" ? "h" : "ч";
  if (value < 60) {
    return `${value} ${min}`;
  }
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours} ${hour} ${rest} ${min}` : `${hours} ${hour}`;
}

export function transportLabel(transport, lang = "ru") {
  if (transport === "walk") {
    return lang === "en" ? "on foot" : "пешком";
  }
  if (transport === "bike") {
    return lang === "en" ? "by bicycle" : "на велосипеде";
  }
  return lang === "en" ? "by car" : "на машине";
}

export function isUndoPhrase(phrase) {
  const text = String(phrase || "").trim();
  return text.length > 0 && text.length < 80 && /верни как было|как было|отмени правк|верни назад|отмени последний/i.test(text);
}
