import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PageShell } from "./components/PageShell/PageShell";
import { AdminPage } from "./pages/AdminPage";
import { AssistantPage } from "./pages/AssistantPage";
import { AttractionPage } from "./pages/AttractionPage";
import { CountryPage } from "./pages/CountryPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlacesPage } from "./pages/PlacesPage";
import { RoutesPage } from "./pages/RoutesPage";
import { StoryPage } from "./pages/StoryPage";

export function App() {
  return (
    <BrowserRouter>
      <PageShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/country" element={<CountryPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/object/:id" element={<AttractionPage />} />
          <Route path="/story/:slug" element={<StoryPage />} />
          <Route path="/desk" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageShell>
    </BrowserRouter>
  );
}
