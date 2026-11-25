import { Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { buildMeasuredRoute, RoutePoint, Transport } from "../utils/routeMeasure";

function readTransport(value: unknown): Transport {
  return value === "walk" || value === "bike" ? value : "car";
}

function readPoint(item: { lat?: unknown; lng?: unknown; title?: unknown }): RoutePoint {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  const title = String(item?.title || "Точка").trim().slice(0, 120);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new HttpError(400, "У точки маршрута нет координат");
  }
  return { lat, lng, title };
}

function readGroups(body: { groups?: unknown; points?: unknown }) {
  const source = Array.isArray(body.groups) ? body.groups : Array.isArray(body.points) ? [body.points] : null;
  if (!source) {
    throw new HttpError(400, "Добавьте минимум две точки маршрута");
  }
  return source.map((group) => {
    if (!Array.isArray(group) || !group.length) {
      throw new HttpError(400, "Добавьте минимум две точки маршрута");
    }
    return group.map((item) => readPoint(item));
  });
}

export function buildRoute(req: Request, res: Response) {
  const groups = readGroups(req.body || {});
  const total = groups.reduce((sum, group) => sum + group.length, 0);
  if (total < 2) {
    throw new HttpError(400, "Добавьте минимум две точки маршрута");
  }
  if (total > 12) {
    throw new HttpError(400, "В маршруте не больше 12 точек");
  }
  res.json(buildMeasuredRoute(groups, readTransport(req.body?.transport)));
}
