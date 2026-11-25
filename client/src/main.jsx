import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import { App } from "./App";
import { LanguageProvider } from "./i18n/language.jsx";
import { OblastProvider } from "./i18n/oblast.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <OblastProvider>
        <App />
      </OblastProvider>
    </LanguageProvider>
  </React.StrictMode>
);
