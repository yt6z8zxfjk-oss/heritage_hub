import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkDescription } from "./checkDescription";
import { checkPlan } from "./checkPlan";
import { mentionedPlace } from "./phrase";
import { CatalogCard } from "./types";
import { buildMeasuredRoute } from "../utils/routeMeasure";

const cards: CatalogCard[] = [
  card("palace", "Дворцово-парковый ансамбль", "Гомель", "Архитектура", 52.4226, 31.0167, "10:00–18:00"),
  card("park", "Парк дворцового ансамбля", "Гомель", "Парки", 52.4209, 31.0138, "Круглосуточно"),
  card("sozh", "Набережная Сожа", "Гомель", "Парки", 52.4234, 31.0094, "Круглосуточно"),
  card("lodge", "Охотничий домик", "Гомель", "Архитектура", 52.4202, 31.0206, "10:00–18:00"),
  card("cathedral", "Собор святых Петра и Павла", "Гомель", "Храмы", 52.4251, 31.014, "08:00–19:00"),
  card("museum", "Краеведческий музей", "Калинковичи", "Музеи", 52.13, 29.33, "10:00–18:00"),
  card("castle", "Замковая гора", "Мозырь", "Памятники", 52.049, 29.245, "Круглосуточно"),
  card("mozyr", "Свято-Михайловский собор", "Мозырь", "Храмы", 52.047, 29.27, "08:00–19:00"),
  card("pripyat", "Национальный парк Припятский", "Петриковский район", "Природа", 52.0, 28.4, "09:00–17:00"),
];

function card(
  id: string,
  title: string,
  place: string,
  category: string,
  lat: number,
  lng: number,
  workHours: string
): CatalogCard {
  return {
    id,
    title,
    place,
    district: place,
    address: `${place}, тестовый адрес ${id}`,
    workHours,
    category,
    lat,
    lng,
    about: `${title} стоит в каталоге и подходит для прогулки.`,
  };
}

describe("город старта", () => {
  it("понимает Гомель в родительном падеже и не путает его с областью", () => {
    const places = cards.map((item) => item.place);
    assert.equal(mentionedPlace("день из Гомеля с детьми", places), "Гомель");
    assert.equal(mentionedPlace("достопримечательности Гомельской области", places), null);
    assert.equal(mentionedPlace("выходные из Мозыря, история", places), "Мозырь");
  });
});

describe("сборка маршрута", () => {
  it("оставляет близкие гомельские точки и не берёт дальний парк", () => {
    const checked = checkPlan(
      {
        summary: "Парки рядом с центром.",
        days: [{ placeIds: ["park", "sozh", "palace", "pripyat"] }],
      },
      { phrase: "день из Гомеля с детьми, природа и обед, без дальней дороги", cards, current: null }
    );
    assert.equal(checked.status, "ok");
    if (checked.status !== "ok") {
      return;
    }
    const ids = checked.route.days.flatMap((day) => day.placeIds);
    assert.equal(checked.route.startAssumed, false);
    assert.equal(checked.route.transport, "car");
    assert.ok(ids.includes("park"));
    assert.equal(ids.includes("pripyat"), false);
    assert.match(checked.route.gap, /кафе/i);
    const measured = buildMeasuredRoute(
      checked.route.days.map((day) =>
        day.placeIds.map((id) => {
          const place = cards.find((item) => item.id === id);
          if (!place) {
            throw new Error("нет точки");
          }
          return { lat: place.lat, lng: place.lng, title: place.title };
        })
      ),
      checked.route.transport
    );
    assert.ok(measured.distanceKm > 0);
    assert.ok(measured.distanceKm < 20);
    assert.match(measured.url, /^https:\/\/yandex\.ru\/maps\/\?rtext=\d/);
    assert.equal(measured.url.includes("%"), false);
  });

  it("делает короче тот же маршрут, а не новый", () => {
    const current = {
      transport: "car" as const,
      summary: "Парки Гомеля",
      days: [{ title: "День 1", placeIds: ["park", "sozh", "palace", "lodge"] }],
    };
    const checked = checkPlan(
      { summary: "Оставил две ближние остановки.", days: [{ placeIds: ["park", "sozh"] }] },
      { phrase: "сделай короче", cards, current }
    );
    assert.equal(checked.status, "ok");
    if (checked.status !== "ok") {
      return;
    }
    assert.deepEqual(checked.route.days[0].placeIds, ["park", "sozh"]);
  });

  it("убирает музей и не подменяет маршрут чужими точками", () => {
    const current = {
      transport: "car" as const,
      summary: "Центр",
      days: [{ title: "День 1", placeIds: ["palace", "museum", "park"] }],
    };
    const shorter = checkPlan(
      { summary: "Музей убрал.", days: [{ placeIds: ["palace", "park"] }] },
      { phrase: "убери музей", cards, current }
    );
    assert.equal(shorter.status, "ok");
    if (shorter.status === "ok") {
      assert.deepEqual(shorter.route.days[0].placeIds, ["palace", "park"]);
    }
    const replaced = checkPlan(
      { summary: "Собрал заново.", days: [{ placeIds: ["castle", "mozyr"] }] },
      { phrase: "убери музей", cards, current }
    );
    assert.equal(replaced.status, "error");
  });

  it("не применяет id вне каталога", () => {
    const checked = checkPlan(
      { summary: "Есть лишнее.", days: [{ placeIds: ["park", "нет-такого"] }] },
      { phrase: "день из Гомеля", cards, current: null }
    );
    assert.equal(checked.status, "error");
  });

  it("для выходных делит длинный день на два порядка", () => {
    const checked = checkPlan(
      {
        summary: "Два дня из Мозыря.",
        days: [{ placeIds: ["castle", "mozyr", "park", "sozh"] }],
      },
      { phrase: "выходные из Мозыря, история, на машине", cards, current: null }
    );
    assert.equal(checked.status, "ok");
    if (checked.status !== "ok") {
      return;
    }
    assert.equal(checked.route.days.length, 2);
    assert.equal(checked.route.transport, "car");
    assert.deepEqual(checked.route.days[0].placeIds, ["castle", "mozyr"]);
  });

  it("без названного города прямо берёт Гомель", () => {
    const checked = checkPlan(
      { summary: "Короткая прогулка по паркам.", days: [{ placeIds: ["park", "sozh", "palace"] }] },
      { phrase: "прогулка с детьми по паркам", cards, current: null }
    );
    assert.equal(checked.status, "ok");
    if (checked.status !== "ok") {
      return;
    }
    assert.equal(checked.route.startAssumed, true);
    assert.match(checked.route.summary, /Гомеле/);
  });
});

describe("план дня", () => {
  const selected = [cards[1], cards[2]];

  it("принимает текст только по выбранным карточкам", () => {
    const text = [
      "Утро лучше начать в парке, пока аллеи ещё пустые. Здесь легко быть час: пруд, склон и вид на реку.",
      "Дальше по этому же маршруту набережная. На ней можно остаться до вечера, часов в карточке нет отдельных ворот.",
      "На обед в карточке кафе нет, так что это просто пауза на аллее, без стола и без меню.",
      "Адрес парка тот, что в карточке. Вечером возвращаться удобно той же дорогой вдоль воды.",
    ].join(" ");
    const checked = checkDescription(
      {
        text,
        stops: [
          { id: "park", why: "тихо", stay: "час", look: "пруд" },
          { id: "sozh", why: "река", stay: "дольше", look: "берег" },
        ],
      },
      { selected, catalog: cards }
    );
    assert.equal(checked.status, "ok");
  });

  it("собирает заметку из остановок, если в тексте только заголовок", () => {
    const checked = checkDescription(
      {
        text: "Первый день",
        stops: [
          { id: "cathedral", why: "Посетить службу в кафедральном соборе", stay: "1-2 часа", look: "Портик" },
          { id: "park", why: "Прогуляться по аллеям, пока тихо", stay: "около часа", look: "пруд и склон" },
        ],
      },
      { selected: [cards[4], cards[1]], catalog: cards }
    );
    assert.equal(checked.status, "ok");
    if (checked.status === "ok") {
      assert.match(checked.text, /кафедральн/);
      assert.match(checked.text, /Собор святых Петра и Павла/);
    }
  });

  it("отклоняет чужое место, чужие часы и выдуманное кафе", () => {
    const foreign = checkDescription(
      {
        text: `${"Начнём день спокойно. ".repeat(8)}По дороге заедем на Замковая гора и вернёмся к реке до вечера.`,
        stops: [
          { id: "park", why: "a", stay: "b", look: "c" },
          { id: "sozh", why: "a", stay: "b", look: "c" },
        ],
      },
      { selected, catalog: cards }
    );
    assert.equal(foreign.status, "error");
    const hours = checkDescription(
      {
        text: `${"Утро в парке, потом набережная. ".repeat(6)}Заходить лучше в 07:00, а вечером уже уходить.`,
        stops: [
          { id: "park", why: "a", stay: "b", look: "c" },
          { id: "sozh", why: "a", stay: "b", look: "c" },
        ],
      },
      { selected, catalog: cards }
    );
    assert.equal(hours.status, "error");
    const cafe = checkDescription(
      {
        text: `${"Утро в парке и день у реки. ".repeat(6)}Обед в кафе у набережной, там всегда есть борщ.`,
        stops: [
          { id: "park", why: "a", stay: "b", look: "c" },
          { id: "sozh", why: "a", stay: "b", look: "c" },
        ],
      },
      { selected, catalog: cards }
    );
    assert.equal(cafe.status, "error");
  });
});

describe("ответ в чате", () => {
  it("принимает совет по карточкам и не меняет маршрут", () => {
    const checked = checkPlan(
      {
        kind: "answer",
        text: "Дворцово-парковый ансамбль открыт с 10:00 до 18:00. Кафе в карточке не указано.",
      },
      { phrase: "во сколько открыт дворец", cards, current: null }
    );
    assert.equal(checked.status, "decline");
    if (checked.status === "decline") {
      assert.match(checked.message, /10:00/);
      assert.match(checked.message, /не указано/);
    }
  });

  it("не пропускает выдуманные часы", () => {
    const checked = checkPlan(
      { kind: "answer", text: "Дворец работает с 07:15 до позднего вечера, приходите заранее." },
      { phrase: "во сколько открыт дворец", cards, current: null }
    );
    assert.equal(checked.status, "error");
  });
});

describe("построитель", () => {
  it("считает километры и время по координатам и не кодирует ссылку", () => {
    const measured = buildMeasuredRoute(
      [
        [
          { lat: 52.4226, lng: 31.0167, title: "Дворец" },
          { lat: 52.4251, lng: 31.014, title: "Собор" },
        ],
      ],
      "car"
    );
    assert.ok(measured.distanceKm > 0 && measured.distanceKm < 2);
    assert.equal(measured.durationMin >= 1, true);
    assert.equal(measured.groups.length, 1);
    assert.equal(measured.url, "https://yandex.ru/maps/?rtext=52.4226,31.0167~52.4251,31.014&rtt=auto");
  });
});
