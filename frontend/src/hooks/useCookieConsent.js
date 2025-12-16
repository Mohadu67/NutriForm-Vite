import { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'cookie_consent';
const GA_ID = 'G-W8MHL50PHX';
const CLARITY_ID = 'thd0hih6t5';

/**
 * Hook pour gérer le consentement cookies
 * Catégories: necessary (toujours actif), analytics (GA + Clarity)
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le consentement au mount
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        // Si analytics accepté, charger les scripts
        if (parsed.analytics) {
          loadAnalytics();
        }
      } catch {
        setConsent(null);
      }
    }
    setIsLoaded(true);
  }, []);

  // Charger Google Analytics
  const loadGA = useCallback(() => {
    if (window.gaLoaded) return;

    // Créer le script gtag
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialiser gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });

    window.gaLoaded = true;
  }, []);

  // Charger Microsoft Clarity
  const loadClarity = useCallback(() => {
    if (window.clarityLoaded) return;

    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_ID);

    window.clarityLoaded = true;
  }, []);

  // Charger tous les analytics
  const loadAnalytics = useCallback(() => {
    loadGA();
    loadClarity();
  }, [loadGA, loadClarity]);

  // Accepter tous les cookies
  const acceptAll = useCallback(() => {
    const newConsent = {
      necessary: true,
      analytics: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    loadAnalytics();
  }, [loadAnalytics]);

  // Refuser les cookies analytics
  const rejectAll = useCallback(() => {
    const newConsent = {
      necessary: true,
      analytics: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    // Supprimer les cookies GA existants
    clearAnalyticsCookies();
  }, []);

  // Mettre à jour les préférences
  const updateConsent = useCallback((preferences) => {
    const newConsent = {
      necessary: true,
      analytics: preferences.analytics ?? false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);

    if (newConsent.analytics) {
      loadAnalytics();
    } else {
      clearAnalyticsCookies();
    }
  }, [loadAnalytics]);

  // Réinitialiser le consentement (pour permettre à l'utilisateur de re-choisir)
  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsent(null);
    clearAnalyticsCookies();
  }, []);

  return {
    consent,
    isLoaded,
    hasConsented: consent !== null,
    analyticsEnabled: consent?.analytics ?? false,
    acceptAll,
    rejectAll,
    updateConsent,
    resetConsent
  };
}

// Utilitaire pour supprimer les cookies analytics
function clearAnalyticsCookies() {
  const cookiesToDelete = ['_ga', '_gid', '_gat', '_clck', '_clsk'];
  const domains = [window.location.hostname, '.' + window.location.hostname];

  cookiesToDelete.forEach(name => {
    domains.forEach(domain => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });
}

export default useCookieConsent;
