import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Helmet, HelmetProvider } from "@dr.pogodin/react-helmet";

import App from "./App.jsx";
import "./index.css";
import SafeGoogleReCaptchaProvider from "./providers/SafeGoogleReCaptchaProvider.jsx";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

ReactDOM.createRoot(document.getElementById("root")).render(
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
