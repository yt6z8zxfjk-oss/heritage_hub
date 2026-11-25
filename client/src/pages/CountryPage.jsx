import { useNavigate } from "react-router-dom";
import { CountrySection } from "../components/CountrySection/CountrySection";

export function CountryPage() {
  const navigate = useNavigate();
  return (
    <CountrySection
      onDistrict={(value) => {
        navigate(`/places?district=${encodeURIComponent(value)}`);
      }}
    />
  );
}
