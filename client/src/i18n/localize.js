import { attractionEn, categoryEn, guideEn, hoursEn, storyEn, tripEn } from "./objects";
import { guideExtra, morePlaces, storyExtra, tripExtra } from "./moreLang";

function written(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function choose(custom, prepared, original) {
  return written(custom) || written(prepared) || original || "";
}

function pack(table, slug) {
  return (table && table[slug]) || {};
}

function hoursBe(value) {
  if (!value) {
    return value || "";
  }
  return value
    .replace("Внешний осмотр — по режиму университета", "Вонкавы агляд — па рэжыме ўніверсітэта")
    .replace("Внешний осмотр — круглосуточно", "Вонкавы агляд — кругласутачна")
    .replace("Внешний осмотр — по режиму усадьбы", "Вонкавы агляд — па рэжыме сядзібы")
    .replace("посещение по согласованию", "наведванне па дамоўленасці")
    .replace("Круглосуточно", "Кругласутачна")
    .replace("выходной — понедельник", "выхадны — панядзелак")
    .replace("ежедневно", "штодня")
    .replace("Касса — по афише театра", "Каса — па афішы тэатра")
    .replace("Касса — по афише", "Каса — па афішы");
}

export function localAttraction(item, lang) {
  if (!item || (lang !== "en" && lang !== "be")) {
    return item;
  }
  const prepared = lang === "en" ? attractionEn : {};
  const extra = { ...pack(prepared, item.slug), ...pack(morePlaces[lang], item.slug) };
  const customTitle = lang === "en" ? item.titleEn : item.titleBe;
  const customDescription = lang === "en" ? item.descriptionEn : item.descriptionBe;
  const customHistory = lang === "en" ? item.historyEn : item.historyBe;
  const customAddress = lang === "en" ? item.addressEn : item.addressBe;
  const customHours = lang === "en" ? item.workHoursEn : item.workHoursBe;
  return {
    ...item,
    title: choose(customTitle, extra.title, item.title),
    description: choose(customDescription, extra.description, item.description),
    history: choose(customHistory, extra.history, item.history),
    address: choose(customAddress, extra.address, item.address),
    workHours: written(customHours) || (lang === "en" ? hoursEn(item.workHours) : hoursBe(item.workHours)),
    photos: extra.alt && item.photos?.[0] && !written(customTitle) ? [{ ...item.photos[0], alt: extra.alt }, ...item.photos.slice(1)] : item.photos,
  };
}

export function localStory(item, lang) {
  if (!item || (lang !== "en" && lang !== "be")) {
    return item;
  }
  const prepared = lang === "en" ? storyEn : {};
  const extra = { ...pack(prepared, item.slug), ...pack(storyExtra[lang], item.slug) };
  return {
    ...item,
    era: choose(lang === "en" ? item.eraEn : item.eraBe, extra.era, item.era),
    title: choose(lang === "en" ? item.titleEn : item.titleBe, extra.title, item.title),
    lead: choose(lang === "en" ? item.leadEn : item.leadBe, extra.lead, item.lead),
    body: choose(lang === "en" ? item.bodyEn : item.bodyBe, extra.body, item.body),
  };
}

export function localTrip(item, lang) {
  if (!item || (lang !== "en" && lang !== "be")) {
    return item;
  }
  const prepared = lang === "en" ? tripEn : {};
  const extra = { ...pack(prepared, item.slug), ...pack(prepared, item.id), ...pack(tripExtra[lang], item.slug), ...pack(tripExtra[lang], item.id) };
  return {
    ...item,
    title: choose(lang === "en" ? item.titleEn : item.titleBe, extra.title, item.title),
    lead: choose(lang === "en" ? item.leadEn : item.leadBe, extra.lead, item.lead),
    cafe: item.cafe
      ? {
          ...item.cafe,
          title: choose(lang === "en" ? item.cafeTitleEn : item.cafeTitleBe, extra.cafeTitle, item.cafe.title),
          note: choose(lang === "en" ? item.cafeNoteEn : item.cafeNoteBe, extra.cafeNote, item.cafe.note),
        }
      : item.cafe,
  };
}

export function localGuide(item, lang) {
  if (!item || (lang !== "en" && lang !== "be")) {
    return item;
  }
  const prepared = lang === "en" ? guideEn : {};
  const extra = { ...pack(prepared, item.slug), ...pack(guideExtra[lang], item.slug) };
  return {
    ...item,
    title: choose(lang === "en" ? item.titleEn : item.titleBe, extra.title, item.title),
    text: choose(lang === "en" ? item.textEn : item.textBe, extra.text, item.text),
  };
}

const categoryBe = {
  architecture: "Палацы, ратушы і сядзібныя дамы",
  museum: "Калекцыі і памятныя дамы",
  park: "Сады, набярэжныя і прагулкі",
  monument: "Старыя знакі і аглядальныя месцы",
  religion: "Саборы і капліцы",
  nature: "Запаведныя месцы вобласці",
};

export function categoryText(category, lang) {
  if (!category || (lang !== "en" && lang !== "be")) {
    return category?.description || "";
  }
  const table = lang === "en" ? categoryEn : categoryBe;
  return table[category.slug] || category.description || "";
}

export function dayLabel(title, lang) {
  if (!title || (lang !== "en" && lang !== "be")) {
    return title || "";
  }
  if (lang === "be") {
    return title.replace(/День\s+(\d+)/g, "Дзень $1");
  }
  return title.replace(/День\s+(\d+)/g, "Day $1");
}

export function matchesPlace(item, query) {
  const en = { ...(attractionEn[item.slug] || {}), ...(morePlaces.en[item.slug] || {}) };
  const be = morePlaces.be[item.slug] || {};
  const haystack = [item.title, item.titleEn, item.description, item.descriptionEn, item.history, item.historyEn, item.place, item.address, item.addressEn, en.title, en.description, en.history, en.address, be.title, be.description, be.history, be.address]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}
