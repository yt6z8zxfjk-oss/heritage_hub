import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AttractionCatalog } from "../components/AttractionCatalog/AttractionCatalog";
import { useI18n } from "../i18n/language.jsx";
import { useOblast } from "../i18n/oblast.jsx";
import { matchesPlace } from "../i18n/localize";

export function PlacesPage() {
  const [searchParams] = useSearchParams();
  const { lang } = useI18n();
  const { id: oblastId } = useOblast();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryId, setCategoryId] = useState("");
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [focusId, setFocusId] = useState("");
  const [loading, setLoading] = useState(true);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [error, setError] = useState("");
  const seenOblast = useRef(oblastId);
  const debouncedQuery = useDebouncedValue(query);
  const categorySlug = searchParams.get("category") || "";

  useEffect(() => {
    if (seenOblast.current === oblastId) {
      return;
    }
    seenOblast.current = oblastId;
    setDistrict("");
  }, [oblastId]);

  useEffect(() => {
    api("/categories")
      .then((data) => {
        setCategories(data.items);
        if (categorySlug) {
          const match = data.items.find((item) => item.slug === categorySlug);
          if (match) {
            setCategoryId(match.id);
          }
        }
      })
      .catch((loadError) => setError(loadError.message));
    api("/districts")
      .then((data) => setDistricts(data.items))
      .catch(() => {});
  }, [categorySlug, oblastId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (lang === "ru" && debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    }
    if (categoryId) {
      params.set("category", categoryId);
    }
    if (district) {
      params.set("district", district);
    }
    let stop = false;
    setLoading(true);
    api(`/attractions?${params.toString()}`)
      .then((data) => {
        if (stop) {
          return;
        }
        setItems(data.items);
        setEmptyMessage(data.message || "");
        setError("");
      })
      .catch((loadError) => {
        if (!stop) {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (!stop) {
          setLoading(false);
        }
      });
    return () => {
      stop = true;
    };
  }, [debouncedQuery, categoryId, district, lang, oblastId]);

  useEffect(() => {
    if (focusId && !items.some((item) => item.id === focusId)) {
      setFocusId("");
    }
  }, [items, focusId]);

  const visible = lang !== "ru" && debouncedQuery.trim() ? items.filter((item) => matchesPlace(item, debouncedQuery)) : items;

  return (
    <>
      {error ? (
        <div className="container">
          <p className="notice">{error}</p>
        </div>
      ) : null}
      <AttractionCatalog
        items={focusId ? visible.filter((item) => item.id === focusId) : visible}
        choices={visible}
        query={query}
        onQuery={setQuery}
        loading={loading}
        emptyMessage={emptyMessage}
        districts={districts}
        district={district}
        onDistrict={(value) => {
          setDistrict(value);
          setCategoryId("");
          setFocusId("");
        }}
        focusId={focusId}
        onFocus={setFocusId}
      />
    </>
  );
}
