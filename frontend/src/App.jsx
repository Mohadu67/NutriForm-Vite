import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Clarity from '@microsoft/clarity';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import UpdatePrompt from "./components/Shared/UpdatePrompt.jsx";
import CanonicalLink from "./components/CanonicalLink/CanonicalLink.jsx";
import NotificationPrompt from "./components/Notifications/NotificationPrompt.jsx";
import LoadingSpinner from "./components/Shared/LoadingSpinner.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.jsx";
import { initializeNotifications } from "./services/notificationService.js";
import MessageNotificationManager from "./components/Chat/MessageNotificationManager.jsx";
import './i18n/config';

// Pages principales - chargées immédiatement (pour SEO et performance initiale)
import Home from "./pages/Accueil/Home.jsx";
import ImcPage from "./pages/Imc/ImcPage.jsx"
import CaloriePage from "./pages/Calorie/CaloriePage.jsx";
import ContactPage from "./pages/Contact/ContactPage.jsx";
import AboutPage from "./pages/About/AboutPage.jsx";
import ExoPage from "./pages/Exo/Exo.jsx";
import ProgramsPage from "./pages/Programs/Programs.jsx";
import PageOutils from "./pages/OutilsCalcul/PageOutils.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";

// Pages RGPD - lazy loaded
const MentionsLegales = lazy(() => import("./pages/RGPD/MentionsLegales.jsx"));
const CookiesPolicy = lazy(() => import("./pages/RGPD/CookiesPolicy.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/RGPD/PrivacyPolicy.jsx"));

// Auth - lazy loaded
const VerifyEmail = lazy(() => import("./components/Auth/VerifyEmail/VerifyEmail.jsx"));
const ResetPassword = lazy(() => import("./components/Auth/ResetPassword/ResetPassword.jsx"));

// Dashboard & Leaderboard - lazy loaded (pages premium)
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard/Leaderboard.jsx"));
const Pricing = lazy(() => import("./pages/Pricing/Pricing.jsx"));

// Admin pages - lazy loaded (usage limité)
const AdminPage = lazy(() => import("./pages/Admin/AdminPage.jsx"));
const NewsletterAdmin = lazy(() => import("./pages/Admin/NewsletterAdmin.jsx"));
const SupportTickets = lazy(() => import("./pages/Admin/SupportTickets.jsx"));
const ProgramsAdmin = lazy(() => import("./pages/Admin/ProgramsAdmin/ProgramsAdmin.jsx"));

// Profile & Matching - lazy loaded (features avancées)
const ProfileSetup = lazy(() => import("./pages/Profile/ProfileSetup.jsx"));
const ProfileSetupFuturistic = lazy(() => import("./pages/Profile/ProfileSetupFuturistic.jsx"));
const MatchingPage = lazy(() => import("./pages/Matching/MatchingPage.jsx"));
const MatchingPageFuturistic = lazy(() => import("./pages/Matching/MatchingPageFuturistic.jsx"));

// Chat - lazy loaded (feature social)
const Chat = lazy(() => import("./pages/Chat/Chat.jsx"));

export default function App() {
  useEffect(() => {
    Clarity.init("thd0hih6t5");
    // Note: Session management is now handled server-side via httpOnly cookies
    // No need for client-side session checks anymore

    // Initialiser les notifications push
    initializeNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <ChatProvider>
          <UpdatePrompt />
          <CanonicalLink />
          <NotificationPrompt />
          <MessageNotificationManager />
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Pages principales - chargées immédiatement */}
            <Route path="/" element={<Home />} />
            <Route path="/imc" element={<ImcPage />} />
            <Route path="/calorie" element={<CaloriePage />} />
            <Route path="/calories" element={<Navigate to="/calorie" replace />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/exo" element={<ExoPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/outils" element={<PageOutils />} />

            {/* Pages RGPD - lazy loaded */}
            <Route path="/cookies" element={<CookiesPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />

            {/* Auth - lazy loaded */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard & Premium - lazy loaded */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Admin - lazy loaded */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/newsletter/new" element={<NewsletterAdmin />} />
            <Route path="/admin/newsletter/:id" element={<NewsletterAdmin />} />
            <Route path="/admin/support-tickets" element={<SupportTickets />} />
            <Route path="/admin/programs" element={<ProgramsAdmin />} />

            {/* Profile & Matching - lazy loaded */}
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/profile/setup-futur" element={<ProfileSetupFuturistic />} />
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/matching-futur" element={<MatchingPageFuturistic />} />

            {/* Chat - lazy loaded */}
            <Route path="/chat/:matchId" element={<Chat />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChatProvider>
      </WebSocketProvider>
    </ErrorBoundary>
  );
}