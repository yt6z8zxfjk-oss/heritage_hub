export const oblastList = [
  {
    id: "brest",
    ru: "Брестская область",
    be: "Брэсцкая вобласць",
    en: "Brest region",
    lead: {
      ru: "Крепость на Буге, Беловежская пуща, Пинск, Коссово и Ружаны.",
      be: "Крэпасць на Бугу, Белавежская пушча, Пінск, Косава і Ружаны.",
      en: "The fortress on the Bug, Belovezhskaya Pushcha, Pinsk, Kosava and Ruzhany.",
    },
    bounds: { south: 51.4, north: 53.0, west: 23.1, east: 27.5 },
  },
  {
    id: "vitebsk",
    ru: "Витебская область",
    be: "Віцебская вобласць",
    en: "Vitebsk region",
    lead: {
      ru: "Витебск, Полоцк, Орша и Браславские озёра.",
      be: "Віцебск, Полацк, Орша і Браслаўскія азёры.",
      en: "Vitebsk, Polotsk, Orsha and the Braslav lakes.",
    },
    bounds: { south: 54.2, north: 56.2, west: 26.4, east: 31.0 },
  },
  {
    id: "gomel",
    ru: "Гомельская область",
    be: "Гомельская вобласць",
    en: "Gomel region",
    lead: {
      ru: "Собрали места Гомеля и области: от набережной Сожа до Турова, Мозыря и Ветки.",
      be: "Месцы Гомеля і вобласці: ад набярэжнай Сожа да Турава, Мазыра і Веткі.",
      en: "Places in Gomel and the region, from the Sozh embankment to Turov, Mozyr and Vetka.",
    },
    bounds: { south: 51.5, north: 53.4, west: 27.3, east: 31.8 },
  },
  {
    id: "grodno",
    ru: "Гродненская область",
    be: "Гродзенская вобласць",
    en: "Grodno region",
    lead: {
      ru: "Замки Гродно, Мир и Лида, Жировичи, Крево и Гольшаны.",
      be: "Замкі Гродна, Мір і Ліда, Жыровічы, Крэва і Гальшаны.",
      en: "The Grodno castles, Mir and Lida, Zhirovichi, Krevo and Halshany.",
    },
    bounds: { south: 52.9, north: 54.5, west: 23.1, east: 26.9 },
  },
  {
    id: "minsk",
    ru: "Минская область",
    be: "Мінская вобласць",
    en: "Minsk region",
    lead: {
      ru: "Несвиж, Верхний город, Хатынь, Нарочь и Дудутки.",
      be: "Нясвіж, Верхні горад, Хатынь, Нарач і Дудуткі.",
      en: "Nesvizh, the Upper Town, Khatyn, Lake Narach and Dudutki.",
    },
    bounds: { south: 52.7, north: 54.9, west: 26.1, east: 29.0 },
  },
  {
    id: "mogilev",
    ru: "Могилёвская область",
    be: "Магілёўская вобласць",
    en: "Mogilev region",
    lead: {
      ru: "Ратуша над Днепром, Жиличи, Быхов, Мстиславль и Бобруйск.",
      be: "Ратуша над Дняпром, Жылічы, Быхаў, Мсціслаў і Бабруйск.",
      en: "The town hall above the Dnieper, Zhilichi, Bykhov, Mstislavl and Bobruisk.",
    },
    bounds: { south: 52.8, north: 54.5, west: 28.1, east: 32.5 },
  },
];

export function oblastById(id) {
  return oblastList.find((item) => item.id === id) || oblastList[2];
}

export function oblastLabel(item, lang) {
  if (!item) {
    return "";
  }
  return item[lang] || item.ru;
}

export function oblastLead(item, lang) {
  if (!item) {
    return "";
  }
  return item.lead[lang] || item.lead.ru;
}
