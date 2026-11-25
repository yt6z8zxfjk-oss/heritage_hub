export type RoutePoint = { lat: number; lng: number; title: string };

export type Transport = "car" | "walk" | "bike";

const EARTH_KM = 6371;

const SPEED: Record<Transport, number> = {
  car: 50,
  walk: 4.5,
  bike: 15,
};

export function haversineKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function measureRoute(points: RoutePoint[], transport: Transport) {
  let rawKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    rawKm += haversineKm(points[index - 1], points[index]);
  }
  const distanceKm = Math.round(rawKm * 10) / 10;
  const durationMin = rawKm === 0 ? 0 : Math.max(1, Math.round((rawKm / SPEED[transport]) * 60));
  return { distanceKm, durationMin };
}

export function buildMeasuredRoute(groups: RoutePoint[][], transport: Transport) {
  const measured = groups.map((points) => ({
    points,
    ...measureRoute(points, transport),
  }));
  const distanceKm = Math.round(measured.reduce((sum, group) => sum + group.distanceKm, 0) * 10) / 10;
  const durationMin = measured.reduce((sum, group) => sum + group.durationMin, 0);
  const flat = groups.flat();
  const rtext = flat.map((point) => `${point.lat},${point.lng}`).join("~");
  const url = flat.length >= 2 ? `https://yandex.ru/maps/?rtext=${rtext}&rtt=auto` : "";
  return { url, points: flat, groups: measured, distanceKm, durationMin, transport };
}
