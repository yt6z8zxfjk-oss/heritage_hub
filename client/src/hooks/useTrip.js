import { useEffect, useRef, useState } from "react";
import { api } from "../api/api";
import { useI18n } from "../i18n/language.jsx";
import { useOblast } from "../i18n/oblast.jsx";
import { isUndoPhrase } from "../lib/routeText";

export const routeExamples = [
  "день из Гомеля с детьми, природа и обед, без дальней дороги",
  "выходные из Мозыря, история, на машине",
  "день из Гомеля, парки и набережная, без машины",
];

const serverEn = {
  "У сервиса ответов закончились средства. Ответы появятся, когда счёт модели пополнят.": "The answer service has no balance left. Replies will return when the model account is topped up.",
  "Составление маршрута временно недоступно": "Route composition is unavailable right now.",
  "Напишите, какую поездку собрать": "Write which trip to build.",
  "Слишком много запросов. Подождите немного.": "Too many requests. Wait a moment.",
  "Нет точек для описания": "There are no points to describe.",
  "В ответе есть место не из каталога. Маршрут не изменён.": "The reply named a place that is not in the catalog. The route was left as it was.",
  "Ответ получился неразборчивым. Маршрут не изменён.": "The reply could not be read. The route was left as it was.",
  "Правка собрала маршрут заново. Прежний маршрут оставлен.": "The edit rebuilt the route from scratch. The previous route was kept.",
  "Получилось меньше двух точек. Маршрут не изменён.": "Fewer than two points were left. The route was not changed.",
  "В маршруте повторяется одно и то же место. Маршрут не изменён.": "The same place appears twice. The route was not changed.",
  "В ответе есть то, чего нет в карточках. Повторите вопрос.": "The reply includes something that is not on the cards. Ask again.",
  "План дня получился неразборчивым. Маршрут не изменён.": "The day plan could not be read. The route was left as it was.",
  "План дня назвал место не из маршрута. Маршрут не изменён.": "The day plan named a place that is not on the route. The route was left as it was.",
  "План дня добавил то, чего нет в карточках. Маршрут не изменён.": "The day plan added something that is not on the cards. The route was left as it was.",
  "Сервис маршрутов не ответил. Повторите.": "The route service did not answer. Try again.",
  "Сервис маршрутов не успел ответить. Повторите.": "The route service did not answer in time. Try again.",
  "Пустой ответ. Повторите.": "The reply was empty. Try again.",
  "Нет связи с сервисом маршрутов. Повторите.": "No connection to the route service. Try again.",
  "Локальная модель не ответила. Повторите через несколько секунд.": "The local model did not answer. Try again in a few seconds.",
};

function readable(error, t, lang) {
  if (!error || error.name === "TypeError") {
    return t("noLink");
  }
  const message = error.message || t("noLink");
  if (lang === "en" && serverEn[message]) return serverEn[message];
  return message;
}

function countPoints(days) {
  return days.reduce((sum, day) => sum + day.points.length, 0);
}

function snapshotOf(state) {
  return {
    days: state.days.map((day) => ({ title: day.title, points: [...day.points] })),
    transport: state.transport,
    summary: state.summary,
    gap: state.gap,
    description: state.description,
  };
}

function measure(days, transport) {
  return api("/routes", {
    method: "POST",
    body: JSON.stringify({
      transport,
      groups: days.map((day) => day.points.map((point) => ({ lat: point.lat, lng: point.lng, title: point.title }))),
    }),
  });
}

export function useTrip() {
  const { lang, t } = useI18n();
  const { id: oblastId } = useOblast();
  const [days, setDays] = useState([]);
  const [transport, setTransport] = useState("car");
  const [summary, setSummary] = useState("");
  const [gap, setGap] = useState("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState([]);
  const [lines, setLines] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeUrl, setRouteUrl] = useState("");
  const [routeError, setRouteError] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");
  const [available, setAvailable] = useState(null);
  const [phrase, setPhrase] = useState("");
  const [messages, setMessages] = useState([]);
  const [staleNote, setStaleNote] = useState("");
  const lastRequest = useRef(null);
  const stateRef = useRef({ days, transport, summary, gap, description });

  useEffect(() => {
    stateRef.current = { days, transport, summary, gap, description };
  }, [days, transport, summary, gap, description]);

  const oblastSeen = useRef(oblastId);
  useEffect(() => {
    if (oblastSeen.current === oblastId) {
      return;
    }
    oblastSeen.current = oblastId;
    setDays([]);
    setSummary("");
    setGap("");
    setDescription("");
    setLines([]);
    setStats(null);
    setRouteUrl("");
    setHistory([]);
    setMessages([]);
    setNotice("");
    setAssistantError("");
  }, [oblastId]);

  useEffect(() => {
    let stop = false;
    api("/assistant/status")
      .then((data) => {
        if (!stop) {
          setAvailable(Boolean(data.available));
        }
      })
      .catch(() => {
        if (!stop) {
          setAvailable(false);
        }
      });
    return () => {
      stop = true;
    };
  }, []);

  function paintMeasure(data) {
    const groups =
      Array.isArray(data.groups) && data.groups.length
        ? data.groups
        : [{ points: data.points || [], distanceKm: data.distanceKm, durationMin: data.durationMin }];
    setLines(groups.filter((group) => Array.isArray(group.points) && group.points.length >= 2).map((group) => group.points));
    setStats(
      Number.isFinite(data.distanceKm)
        ? {
            distanceKm: data.distanceKm,
            durationMin: data.durationMin,
            transport: data.transport || "car",
            perDay: groups.map((group) => ({ distanceKm: group.distanceKm, durationMin: group.durationMin })),
          }
        : null
    );
    setRouteUrl(data.url || "");
  }

  function say(role, text) {
    const clean = String(text || "").trim();
    if (!clean) {
      return;
    }
    setMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, role, text: clean }].slice(-40));
  }

  function remember() {
    setHistory((current) => [...current, snapshotOf(stateRef.current)].slice(-20));
  }

  function applyRoute(nextDays, nextTransport, nextSummary, nextGap, nextDescription, data) {
    remember();
    setDays(nextDays);
    setTransport(nextTransport);
    setSummary(nextSummary);
    setGap(nextGap);
    setDescription(nextDescription);
    setStaleNote("");
    setNotice("");
    setAssistantError("");
    setRouteError("");
    paintMeasure(data);
  }

  async function commitPlan(plan, text) {
    const nextDays = plan.route.days.map((day) => ({ title: day.title || "", points: day.places }));
    let described;
    try {
      described = await api("/assistant/describe", {
        method: "POST",
        body: JSON.stringify({
          phrase: text,
          lang,
          gap: plan.route.gap || "",
          days: nextDays.map((day) => ({ title: day.title, placeIds: day.points.map((point) => point.id) })),
        }),
      });
    } catch (error) {
      lastRequest.current = { type: "describe", phrase: text, plan };
      throw error;
    }
    let data;
    try {
      data = await measure(nextDays, plan.route.transport);
    } catch (error) {
      lastRequest.current = { type: "measure", phrase: text, plan, description: described.text };
      throw error;
    }
    applyRoute(nextDays, plan.route.transport, plan.route.summary || "", plan.route.gap || "", described.text, data);
    return [plan.route.summary, described.text, t("marked")].filter(Boolean).join("\n\n");
  }

  async function runTurn(text) {
    setPending(t("thinking"));
    setAssistantError("");
    setNotice("");
    lastRequest.current = { type: "turn", phrase: text };
    try {
      const plan = await api("/assistant/plan", {
        method: "POST",
        body: JSON.stringify({
          phrase: text,
          lang,
          history: messages.slice(-4).map((item) => ({ role: item.role, text: item.text })),
          current: countPoints(days)
            ? {
                transport,
                summary,
                days: days.map((day) => ({ title: day.title, placeIds: day.points.map((point) => point.id) })),
              }
            : null,
        }),
      });
      if (!plan.applied) {
        const message = plan.message || t("cannotBuild");
        setNotice(message);
        say("assistant", message);
        return;
      }
      const reply = await commitPlan(plan, text);
      say("assistant", reply);
    } catch (error) {
      if (error.status === 503) {
        setAvailable(false);
      }
      setAssistantError(readable(error, t, lang));
    } finally {
      setPending("");
    }
  }

  async function redescribe() {
    if (!countPoints(days) || pending) {
      return;
    }
    setPending(t("thinking"));
    setAssistantError("");
    lastRequest.current = { type: "redescribe" };
    try {
      const described = await api("/assistant/describe", {
        method: "POST",
        body: JSON.stringify({
          phrase,
          lang,
          gap,
          days: days.map((day) => ({ title: day.title, placeIds: day.points.map((point) => point.id) })),
        }),
      });
      remember();
      setDescription(described.text);
      setStaleNote("");
      say("assistant", described.text);
    } catch (error) {
      if (error.status === 503) {
        setAvailable(false);
      }
      setAssistantError(readable(error, t, lang));
    } finally {
      setPending("");
    }
  }

  async function retry() {
    const last = lastRequest.current;
    if (!last || pending) {
      return;
    }
    if (last.type === "turn") {
      await runTurn(last.phrase);
      return;
    }
    if (last.type === "redescribe") {
      await redescribe();
      return;
    }
    setPending(t("thinking"));
    setAssistantError("");
    try {
      if (last.type === "describe") {
        const reply = await commitPlan(last.plan, last.phrase);
        say("assistant", reply);
        return;
      }
      const nextDays = last.plan.route.days.map((day) => ({ title: day.title || "", points: day.places }));
      const data = await measure(nextDays, last.plan.route.transport);
      applyRoute(
        nextDays,
        last.plan.route.transport,
        last.plan.route.summary || "",
        last.plan.route.gap || "",
        last.description,
        data
      );
      say("assistant", last.description);
    } catch (error) {
      setAssistantError(readable(error, t, lang));
    } finally {
      setPending("");
    }
  }

  function undo() {
    if (!history.length) {
      setAssistantError(t("noUndo"));
      say("assistant", t("noUndo"));
      return;
    }
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setDays(prev.days);
    setTransport(prev.transport);
    setSummary(prev.summary);
    setGap(prev.gap);
    setDescription(prev.description);
    setStaleNote("");
    setNotice("");
    setAssistantError("");
    say("assistant", "Вернул маршрут к предыдущему шагу.");
    const total = countPoints(prev.days);
    if (total < 2) {
      setLines([]);
      setStats(null);
      setRouteUrl("");
      return;
    }
    measure(prev.days, prev.transport)
      .then((data) => {
        paintMeasure(data);
        setRouteError("");
      })
      .catch((error) => setRouteError(readable(error, t, lang)));
  }

  function submit(event) {
    event.preventDefault();
    const text = phrase.trim();
    if (!text || pending) {
      return;
    }
    setPhrase("");
    say("user", text);
    if (isUndoPhrase(text)) {
      undo();
      return;
    }
    void runTurn(text);
  }

  async function changePoints(next) {
    const hadDescription = Boolean(description);
    try {
      if (countPoints(next) >= 2) {
        const data = await measure(next, transport);
        setDays(next);
        paintMeasure(data);
        setRouteError("");
      } else {
        setDays(next);
        setLines([]);
        setStats(null);
        setRouteUrl("");
      }
      if (hadDescription) {
        setDescription("");
        setStaleNote("Точки изменились, план дня нужно собрать заново.");
      }
    } catch (error) {
      setRouteError(readable(error, t, lang));
    }
  }

  function addPoint(item) {
    if (!item || days.some((day) => day.points.some((point) => point.id === item.id))) {
      return;
    }
    if (!days.length) {
      void changePoints([{ title: "", points: [item] }]);
      return;
    }
    const next = days.map((day) => ({ title: day.title, points: [...day.points] }));
    next[next.length - 1].points.push(item);
    void changePoints(next);
  }

  function removePoint(id) {
    const next = days
      .map((day) => ({ title: day.title, points: day.points.filter((point) => point.id !== id) }))
      .filter((day) => day.points.length);
    void changePoints(next);
  }

  function clear() {
    setDays([]);
    setTransport("car");
    setSummary("");
    setGap("");
    setDescription("");
    setHistory([]);
    setLines([]);
    setStats(null);
    setRouteUrl("");
    setRouteError("");
    setNotice("");
    setStaleNote("");
    setAssistantError("");
  }

  async function openRoute() {
    if (countPoints(days) < 2) {
      setRouteError("Добавьте минимум две точки");
      return;
    }
    try {
      const data = await measure(days, transport);
      paintMeasure(data);
      setRouteError("");
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setRouteError(readable(error, t, lang));
    }
  }

  return {
    days,
    lines,
    stats,
    routeUrl,
    routeError,
    summary,
    gap,
    description,
    assistantError,
    notice,
    pending,
    available,
    phrase,
    setPhrase,
    messages,
    staleNote,
    hasPoints: countPoints(days) > 0,
    canUndo: history.length > 0,
    submit,
    retry,
    undo,
    redescribe,
    addPoint,
    removePoint,
    clear,
    openRoute,
  };
}
