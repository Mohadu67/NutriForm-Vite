import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from 'sonner';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import UpdatePrompt from "./components/Shared/UpdatePrompt.jsx";
import UpdateBanner from "./components/UpdateBanner/UpdateBanner.jsx";
import CanonicalLink from "./components/CanonicalLink/CanonicalLink.jsx";
import NotificationPrompt from "./components/Notifications/NotificationPrompt.jsx";
import LoadingSpinner from "./components/Shared/LoadingSpinner.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.jsx";
import { initializeNotifications } from "./services/notificationService.js";
import MessageNotificationManager from "./components/Chat/MessageNotificationManager.jsx";
import CookieConsent from "./components/CookieConsent";

// Pages critiques - chargées immédiatement (SEO + landing)
import Home from "./pages/Accueil/Home.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";

// Pages calculateurs - lazy loaded (non-critiques pour landing)
const ImcPage = lazy(() => import("./pages/Imc/ImcPage.jsx"));
const CaloriePage = lazy(() => import("./pages/Calorie/CaloriePage.jsx"));
const PageOutils = lazy(() => import("./pages/OutilsCalcul/PageOutils.jsx"));

// Pages secondaires - lazy loaded
const ContactPage = lazy(() => import("./pages/Contact/ContactPage.jsx"));
const AboutPage = lazy(() => import("./pages/About/AboutPage.jsx"));
const ExoPage = lazy(() => import("./pages/Exo/Exo.jsx"));
const ProgramsPage = lazy(() => import("./pages/Programs/Programs.jsx"));

// Pages RGPD - lazy loaded
const MentionsLegales = lazy(() => import("./pages/RGPD/MentionsLegales.jsx"));
const CookiesPolicy = lazy(() => import("./pages/RGPD/CookiesPolicy.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/RGPD/PrivacyPolicy.jsx"));
const CGV = lazy(() => import("./pages/RGPD/CGV.jsx"));

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
const PartnersAdmin = lazy(() => import("./pages/Admin/PartnersAdmin/PartnersAdmin.jsx"));

// Profile & Matching - loaded directly to avoid Safari lazy loading issues
import ProfileSetup from "./pages/Profile/ProfileSetup.jsx";
import MatchingPage from "./pages/Matching/MatchingPage.jsx";

// Chat - lazy loaded (feature social)
const Chat = lazy(() => import("./pages/Chat/Chat.jsx"));

// Recipes - lazy loaded
const RecipesPage = lazy(() => import("./pages/Recipes/RecipesPage.jsx"));
const RecipeDetail = lazy(() => import("./pages/Recipes/RecipeDetail.jsx"));
const RecipeForm = lazy(() => import("./pages/Admin/RecipeForm.jsx"));

// Rewards - lazy loaded
const RewardsPage = lazy(() => import("./pages/Rewards/RewardsPage.jsx"));

export default function App() {
  useEffect(() => {
    // Notifications uniquement côté client
    // Note: Analytics (GA + Clarity) sont gérés par le composant CookieConsent
    if (typeof window !== 'undefined') {
      initializeNotifications();
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster richColors closeButton />
      <WebSocketProvider>
        <ChatProvider>
          <UpdatePrompt />
          <UpdateBanner />
          <CanonicalLink />
          <NotificationPrompt />
          <MessageNotificationManager />
          <CookieConsent />
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
            <Route path="/cgv" element={<CGV />} />

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
            <Route path="/admin/partners" element={<PartnersAdmin />} />
            <Route path="/admin/recipes/new" element={<RecipeForm />} />
            <Route path="/admin/recipes/:id/edit" element={<RecipeForm />} />

            {/* Profile & Matching */}
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/matching" element={<MatchingPage />} />

            {/* Chat - lazy loaded */}
            <Route path="/chat/:matchId" element={<Chat />} />

            {/* Recipes - lazy loaded */}
            <Route path="/recettes" element={<RecipesPage />} />
            <Route path="/recettes/:id" element={<RecipeDetail />} />

            {/* Rewards - lazy loaded */}
            <Route path="/rewards" element={<RewardsPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChatProvider>
      </WebSocketProvider>
    </ErrorBoundary>
  );
}