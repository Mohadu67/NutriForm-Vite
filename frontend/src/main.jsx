import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Helmet, HelmetProvider } from "@dr.pogodin/react-helmet";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

import App from "./App.jsx";
import "./index.css";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      {RECAPTCHA_SITE_KEY ? (
        <GoogleReCaptchaProvider
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
        </GoogleReCaptchaProvider>
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </HelmetProvider>
  </React.StrictMode>
);