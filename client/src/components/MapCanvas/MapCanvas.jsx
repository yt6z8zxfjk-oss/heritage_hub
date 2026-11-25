import { useEffect } from "react";
import { AttributionControl, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./MapCanvas.css";

function markerIcon(item, selectedId, routeIds) {
  const routeIndex = routeIds.indexOf(item.id);
  const classes = [
    "pin",
    item.id === selectedId ? "pin--active" : "",
    routeIndex >= 0 ? "pin--route" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="${classes}">${routeIndex >= 0 ? routeIndex + 1 : ""}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function FitList({ signature, items, locked }) {
  const map = useMap();
  useEffect(() => {
    if (locked || !items.length) {
      return;
    }
    map.fitBounds(
      items.map((item) => [item.lat, item.lng]),
      { padding: [36, 36] }
    );
  }, [signature, map, locked]);
  return null;
}

function WatchCenter({ onCenter }) {
  const map = useMap();
  useEffect(() => {
    const send = () => {
      const center = map.getCenter();
      onCenter({ lat: center.lat, lng: center.lng });
    };
    send();
    map.on("moveend", send);
    return () => map.off("moveend", send);
  }, [map, onCenter]);
  return null;
}

function RouteLines({ lines }) {
  const ready = (lines || []).filter((line) => line.length >= 2);
  const signature = ready
    .map((line) => line.map((point) => `${Number(point.lat).toFixed(5)},${Number(point.lng).toFixed(5)}`).join(";"))
    .join("|");
  const map = useMap();
  useEffect(() => {
    if (!signature) {
      return;
    }
    const points = ready.flat();
    map.fitBounds(
      points.map((point) => [point.lat, point.lng]),
      { padding: [48, 48] }
    );
  }, [signature, map]);
  if (!ready.length) {
    return null;
  }
  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue("--color-accent").trim();
  const second = style.getPropertyValue("--color-lake").trim() || accent;
  return ready.map((line, index) => (
    <Polyline
      key={`${signature}:${index}`}
      positions={line.map((point) => [point.lat, point.lng])}
      pathOptions={{ color: index === 0 ? accent : second, weight: 4, dashArray: index === 0 ? undefined : "8 10" }}
    />
  ));
}

export function MapCanvas({ items, selectedId, routeIds, lines, onMarkerClick, onCenter }) {
  const signature = items.map((item) => item.id).join("|");
  const routeLocked = (lines || []).some((line) => line.length >= 2);
  return (
    <MapContainer className="map-canvas" center={[52.42, 30.4]} zoom={8} scrollWheelZoom attributionControl={false}>
      <AttributionControl prefix='<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitList signature={signature} items={items} locked={routeLocked} />
      <WatchCenter onCenter={onCenter} />
      <RouteLines lines={lines} />
      <MarkerClusterGroup chunkedLoading>
        {items.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={markerIcon(item, selectedId, routeIds)}
            eventHandlers={{ click: () => onMarkerClick(item) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
