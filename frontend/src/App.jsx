import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Accueil/Home.jsx";
import ImcPage from "./pages/Imc/ImcPage.jsx"
import CaloriePage from "./pages/Calorie/CaloriePage.jsx";
import ContactPage from "./pages/Contact/ContactPage.jsx";
import AboutPage from "./pages/About/AboutPage.jsx";
import VerifyEmail from "./components/Auth/VerifyEmail/VerifyEmail.jsx";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword.jsx";
import MentionsLegales from "./pages/RGPD/MentionsLegales.jsx";
import CookiesPolicy from "./pages/RGPD/CookiesPolicy.jsx";
import PrivacyPolicy from "./pages/RGPD/PrivacyPolicy.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";
import ExoPage from "./pages/Exo/Exo.jsx";
import PageOutils from "./pages/OutilsCalcul/PageOutils.jsx";
import NewsletterAdmin from "./pages/Admin/NewsletterAdmin.jsx";
import AdminPage from "./pages/Admin/AdminPage.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import Pricing from "./pages/Pricing/Pricing.jsx";
import SupportTickets from "./pages/Admin/SupportTickets.jsx";
import Clarity from '@microsoft/clarity';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import UpdatePrompt from "./components/Shared/UpdatePrompt.jsx";
import CanonicalLink from "./components/CanonicalLink/CanonicalLink.jsx";
import ChatWidget from "./components/Chat/ChatWidget.jsx";
import './i18n/config';

export default function App() {
  useEffect(() => {
    Clarity.init("thd0hih6t5");
    // Note: Session management is now handled server-side via httpOnly cookies
    // No need for client-side session checks anymore
  }, []);

  return (
    <ErrorBoundary>
      <UpdatePrompt />
      <CanonicalLink />
      <ChatWidget />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/imc" element={<ImcPage />} />
      <Route path="/calorie" element={<CaloriePage />} />
      <Route path="/calories" element={<Navigate to="/calorie" replace />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/cookies" element={<CookiesPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/exo" element={<ExoPage />} />
      <Route path="/outils" element={<PageOutils />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/newsletter/new" element={<NewsletterAdmin />} />
      <Route path="/admin/newsletter/:id" element={<NewsletterAdmin />} />
      <Route path="/admin/support-tickets" element={<SupportTickets />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}