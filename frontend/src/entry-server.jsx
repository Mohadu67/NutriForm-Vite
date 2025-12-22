import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import CanonicalLink from './components/CanonicalLink/CanonicalLink.jsx';
import LoadingSpinner from './components/Shared/LoadingSpinner.jsx';

// Les polyfills sont gérés par jsdom dans le middleware backend
// Pas besoin de les redéfinir ici

// Pages principales - chargées pour le SSR
import Home from './pages/Accueil/Home.jsx';
import ImcPage from './pages/Imc/ImcPage.jsx';
import CaloriePage from './pages/Calorie/CaloriePage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import AboutPage from './pages/About/AboutPage.jsx';
// ExoPage utilise Leaflet (cartes) qui ne supporte pas le SSR - lazy load uniquement
const ExoPage = lazy(() => import('./pages/Exo/Exo.jsx'));
import PageOutils from './pages/OutilsCalcul/PageOutils.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

// Pages publiques importantes pour le SEO
const Pricing = lazy(() => import('./pages/Pricing/Pricing.jsx'));
const Programs = lazy(() => import('./pages/Programs/Programs.jsx'));

// Pages RGPD - lazy loaded
const MentionsLegales = lazy(() => import('./pages/RGPD/MentionsLegales.jsx'));
const CookiesPolicy = lazy(() => import('./pages/RGPD/CookiesPolicy.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/RGPD/PrivacyPolicy.jsx'));
const CGV = lazy(() => import('./pages/RGPD/CGV.jsx'));

const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard.jsx'));
const RecipesPage = lazy(() => import('./pages/Recipes/RecipesPage.jsx'));
const RecipeDetail = lazy(() => import('./pages/Recipes/RecipeDetail.jsx'));
const RewardsPage = lazy(() => import('./pages/Rewards/RewardsPage.jsx'));

// Version simplifiée de l'App pour le SSR (sans WebSocket, Chat, etc.)
function ServerApp() {
  return (
    <ErrorBoundary>
      <CanonicalLink />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Pages principales */}
          <Route path="/" element={<Home />} />
          <Route path="/imc" element={<ImcPage />} />
          <Route path="/calorie" element={<CaloriePage />} />
          <Route path="/calories" element={<Navigate to="/calorie" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/exo" element={<ExoPage />} />
          <Route path="/outils" element={<PageOutils />} />

          {/* Pages RGPD */}
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgv" element={<CGV />} />

          {/* Autres pages publiques */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/recettes" element={<RecipesPage />} />
          <Route path="/recettes/:id" element={<RecipeDetail />} />
          <Route path="/rewards" element={<RewardsPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export function render(url, context = {}) {
  // Rendu de l'application côté serveur
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <HelmetProvider context={context}>
        <StaticRouter location={url}>
          <ServerApp />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>
  );

  // Extraire les balises helmet pour les injecter dans le HTML
  const { helmet } = context;

  return {
    html,
    helmet
  };
}
