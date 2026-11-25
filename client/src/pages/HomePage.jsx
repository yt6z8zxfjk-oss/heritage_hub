import { AboutRegion } from "../components/AboutRegion/AboutRegion";
import { HeroSection } from "../components/HeroSection/HeroSection";
import { HomeFlow } from "../components/HomeFlow/HomeFlow";
import "./HomePage.css";

export function HomePage() {
  return (
    <div className="home">
      <HeroSection />
      <HomeFlow />
      <AboutRegion />
    </div>
  );
}
