import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Helmet, HelmetProvider } from "@dr.pogodin/react-helmet";

import App from "./App.jsx";
import "./index.css";
import SafeGoogleReCaptchaProvider from "./providers/SafeGoogleReCaptchaProvider.jsx";

// Protection contre import.meta.env undefined
const RECAPTCHA_SITE_KEY = (() => {
  try {
    return import.meta.env?.VITE_RECAPTCHA_SITE_KEY || "";
  } catch {
    return "";
  }
})();

// Utiliser hydrateRoot pour le SSR, sinon createRoot
const rootElement = document.getElementById("root");
const app = (
  <React.StrictMode>
    <HelmetProvider>
      <SafeGoogleReCaptchaProvider
        reCaptchaKey={RECAPTCHA_SITE_KEY}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: "head",
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SafeGoogleReCaptchaProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Détecter si le HTML a été pré-rendu (SSR)
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
