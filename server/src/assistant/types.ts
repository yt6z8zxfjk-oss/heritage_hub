import { Transport } from "../utils/routeMeasure";

export type CatalogCard = {
  id: string;
  title: string;
  place: string;
  district: string;
  address: string;
  workHours: string;
  category: string;
  lat: number;
  lng: number;
  about: string;
};

export type CurrentRoute = {
  transport: Transport;
  summary: string;
  days: { title: string; placeIds: string[] }[];
};

export type PlanRoute = {
  startPlace: string;
  startAssumed: boolean;
  transport: Transport;
  fit: "ok" | "partial";
  gap: string;
  summary: string;
  days: { title: string; placeIds: string[] }[];
};
