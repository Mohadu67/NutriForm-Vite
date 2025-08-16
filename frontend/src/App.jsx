import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Accueil/Home.jsx";
import ImcPage from "./pages/Imc/ImcPage.jsx"
import CaloriePage from "./pages/Calorie/CaloriePage.jsx";
import ContactPage from "./pages/Contact/ContactPage.jsx";
import VerifyEmail from "./components/Auth/VerifyEmail/VerifyEmail.jsx";
import ResetPassword from "./pages/Auth/ResetPassword/ResetPassword.jsx";
import "tarteaucitronjs";

export default function App() {
  useEffect(() => {
    if (window.__tac_inited) return;

    const doInit = () => {
      if (!window.tarteaucitron) return;
      try {
        window.tarteaucitron.init({
          privacyUrl: "",
          hashtag: "#tarteaucitron",
          cookieName: "tarteaucitron",
          orientation: "bottom",
          showAlertSmall: false,
          cookieslist: true,
          adblocker: false,
          AcceptAllCta: true,
          highPrivacy: true,
          handleBrowserDNTRequest: false,
          removeCredit: true,
          useExternalCss:true,
        });

        window.tarteaucitron.lang = "fr";
        window.__tac_inited = true;
      } catch (e) {
        console.error("Tarteaucitron init error", e);
      }
    };

    if (window.tarteaucitron) {
      doInit();
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://tarteaucitron.io/load.js';
    s.async = true;
    s.onload = doInit;
    s.onerror = () => console.error('Impossible de charger tarteaucitron');
    document.head.appendChild(s);

    return () => {
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/imc" element={<ImcPage />} />
      <Route path="/calorie" element={<CaloriePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}