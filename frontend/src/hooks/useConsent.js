import { useState, useCallback, useEffect } from "react";
import { consentDefaults, consentTypes, cookiesToClear } from "../pages/RGPD/config/consents";
import { storage } from "../shared/utils/storage.js";

const CONSENT_STORAGE_KEY = "harmonith_consent_preferences";
const CONSENT_VERSION = "2026-02-04"; // Update when consent structure changes

/**
 * Enhanced cookie/consent management hook
 * Handles all consent types: necessary, analytics, health_data, marketing
 */
export function useConsent() {
  const [consentState, setConsentState] = useState(null);
  const [consentShown, setConsentShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent preferences from localStorage
  useEffect(() => {
    const loadConsent = () => {
      try {
        const data = storage.get(CONSENT_STORAGE_KEY);

        if (data) {
          // Check version - if outdated, reset
          if (data.version !== CONSENT_VERSION) {
            console.log("Consent version updated, resetting to defaults");
            initializeConsent();
            return;
          }
          setConsentState(data.preferences);
          setConsentShown(true);
        } else {
          // First visit - show banner
          setConsentState(consentDefaults);
          setConsentShown(false);
        }
      } catch (error) {
        console.error("Error loading consent preferences:", error);
        initializeConsent();
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  // Save consent to localStorage and update trackers
  const saveConsent = useCallback((preferences) => {
    try {
      const consentData = {
        version: CONSENT_VERSION,
        preferences,
        timestamp: new Date().toISOString(),
      };

      storage.set(CONSENT_STORAGE_KEY, consentData);
      setConsentState(preferences);
      setConsentShown(true);

      // Apply consent to analytics services
      applyConsentToServices(preferences);

      // Notify external systems (Google Analytics, etc.)
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: preferences.analytics ? "granted" : "denied",
          ad_storage: preferences.marketing ? "granted" : "denied",
        });
      }
    } catch (error) {
      console.error("Error saving consent preferences:", error);
    }
  }, []);

  // Accept all (necessary + optional)
  const acceptAll = useCallback(() => {
    const allConsents = {
      [consentTypes.NECESSARY]: true,
      [consentTypes.ANALYTICS]: true,
      [consentTypes.HEALTH_DATA]: false, // Don't auto-enable health data
      [consentTypes.MARKETING]: true,
    };
    saveConsent(allConsents);
  }, [saveConsent]);

  // Reject all (keep necessary)
  const rejectAll = useCallback(() => {
    const minimalConsents = {
      [consentTypes.NECESSARY]: true,
      [consentTypes.ANALYTICS]: false,
      [consentTypes.HEALTH_DATA]: false,
      [consentTypes.MARKETING]: false,
    };
    saveConsent(minimalConsents);
  }, [saveConsent]);

  // Update specific consent
  const updateConsent = useCallback(
    (consentType, value) => {
      if (consentType === consentTypes.NECESSARY) {
        console.warn("Cannot disable necessary cookies");
        return;
      }

      const updated = {
        ...consentState,
        [consentType]: value,
      };

      saveConsent(updated);
    },
    [consentState, saveConsent]
  );

  // Reset consent (show banner again)
  const resetConsent = useCallback(() => {
    storage.remove(CONSENT_STORAGE_KEY);
    setConsentState(consentDefaults);
    setConsentShown(false);
    clearAllCookies();
  }, []);

  // Check if specific consent is granted
  const hasConsent = useCallback(
    (consentType) => {
      if (consentType === consentTypes.NECESSARY) {
        return consentState?.[consentTypes.NECESSARY] === true;
      }
      return consentState?.[consentType] === true;
    },
    [consentState]
  );

  // Get all current preferences
  const getPreferences = useCallback(() => {
    return consentState || consentDefaults;
  }, [consentState]);

  return {
    // State
    consentState,
    consentShown,
    isLoading,

    // Actions
    acceptAll,
    rejectAll,
    updateConsent,
    resetConsent,
    saveConsent,

    // Queries
    hasConsent,
    getPreferences,

    // Helpers
    canTrack: consentState?.[consentTypes.ANALYTICS] === true,
    canShowAds: consentState?.[consentTypes.MARKETING] === true,
    canUseHealthData: consentState?.[consentTypes.HEALTH_DATA] === true,
  };
}

/**
 * Internal: Apply consent to analytics services
 */
function applyConsentToServices(preferences) {
  // Disable analytics if not consented
  if (!preferences.analytics) {
    clearCookies(cookiesToClear.analytics);
    if (window.gtag) {
      window["ga-disable-G-W8MHL50PHX"] = true;
    }
  } else {
    if (window["ga-disable-G-W8MHL50PHX"]) {
      delete window["ga-disable-G-W8MHL50PHX"];
    }
  }

  // Disable ads if not consented
  if (!preferences.marketing) {
    clearCookies(cookiesToClear.marketing);
  }
}

/**
 * Internal: Clear specific cookies
 */
function clearCookies(cookieNames) {
  cookieNames.forEach((name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  });
}

/**
 * Internal: Clear all analytics/marketing cookies
 */
function clearAllCookies() {
  clearCookies(cookiesToClear.all);
}

/**
 * Initialize consent with defaults
 */
function initializeConsent() {
  setConsentState(consentDefaults);
}

export default useConsent;
