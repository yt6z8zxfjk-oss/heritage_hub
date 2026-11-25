import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useOblast } from "../i18n/oblast.jsx";
import { MapSection } from "../components/MapSection/MapSection";

export function MapPage() {
  const { id } = useOblast();
  const [items, setItems] = useState([]);
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (geo) {
      params.set("lat", String(geo.lat));
      params.set("lng", String(geo.lng));
      params.set("radius", String(geo.radius));
    }
    let stop = false;
    api(`/attractions?${params.toString()}`)
      .then((data) => {
        if (!stop) {
          setItems(data.items);
        }
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [geo, id]);

  return <MapSection items={items} geoActive={Boolean(geo)} onGeoFilter={setGeo} />;
}
