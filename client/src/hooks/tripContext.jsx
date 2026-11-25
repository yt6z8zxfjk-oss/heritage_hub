import { createContext, useContext } from "react";
import { useTrip } from "./useTrip";

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const trip = useTrip();
  return <TripContext.Provider value={trip}>{children}</TripContext.Provider>;
}

export function useTripContext() {
  const trip = useContext(TripContext);
  if (!trip) {
    throw new Error("Чат маршрута открыт вне страницы");
  }
  return trip;
}
