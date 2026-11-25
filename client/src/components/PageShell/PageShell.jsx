import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n/language.jsx";
import { TripProvider } from "../../hooks/tripContext.jsx";
import { ChatWidget } from "../ChatWidget/ChatWidget";
import { Header } from "../Header/Header";
import { SiteFooter } from "../SiteFooter/SiteFooter";

export function PageShell({ children }) {
  const location = useLocation();
  const { t } = useI18n();
  const isAdmin = location.pathname.startsWith("/desk");
  return (
    <TripProvider>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Header />
      <main id="main" className="page-rise" key={location.pathname}>
        {children}
      </main>
      <SiteFooter />
      {isAdmin ? null : <ChatWidget />}
    </TripProvider>
  );
}
