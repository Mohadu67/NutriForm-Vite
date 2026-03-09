/**
 * CONSENT TYPES & CONFIGURATION
 * Defines what consents users need to provide
 * Used by CookieBanner and ConsentModal
 */

export const consentTypes = {
  NECESSARY: "necessary",
  ANALYTICS: "analytics",
  HEALTH_DATA: "health_data",
  MARKETING: "marketing",
};

export const consents = {
  [consentTypes.NECESSARY]: {
    id: consentTypes.NECESSARY,
    label: "Cookies essentiels",
    description:
      "Requied for the site to function properly. Session management, theme preferences, security.",
    required: true,
    canBeDisabled: false,
    processors: ["session", "theme"],
    cookies: [
      { name: "user_session", duration: "Session", purpose: "User authentication" },
      { name: "theme_preference", duration: "1 year", purpose: "Dark/light mode" },
    ],
    legalBasis: "Legitimate interest (Article 6(1)(f))",
    icon: "🔒",
  },

  [consentTypes.ANALYTICS]: {
    id: consentTypes.ANALYTICS,
    label: "Cookies d'analyse",
    description:
      "Help us understand how you use the site to improve features. Google Analytics & Microsoft Clarity.",
    required: false,
    canBeDisabled: true,
    processors: ["google-analytics", "microsoft-clarity"],
    cookies: [
      { name: "_ga", duration: "2 years", purpose: "Google Analytics tracking" },
      { name: "_gid", duration: "24 hours", purpose: "Google Analytics session" },
      { name: "_clck", duration: "1 year", purpose: "Microsoft Clarity tracking" },
      { name: "_clsk", duration: "1 year", purpose: "Microsoft Clarity session" },
    ],
    legalBasis: "Consent (Article 6(1)(a) + Article 7)",
    icon: "📊",
  },

  [consentTypes.HEALTH_DATA]: {
    id: consentTypes.HEALTH_DATA,
    label: "Données de santé (Article 9)",
    description:
      "Explicit consent to process sensitive health data (activity, heart rate, etc.). Required to use health features.",
    required: false, // But required to USE health features, not to visit site
    canBeDisabled: true,
    processors: ["apple-healthkit", "google-healthconnect"],
    purpose: "Import and process personal health data from Apple Health or Google Health Connect",
    legalBasis: "Explicit consent (Article 9(2)(a) GDPR)",
    icon: "❤️",
    note: "⚠️ This is MANDATORY if you want to use health tracking features, but optional for the site itself",
    triggered: "On-demand when user tries to enable health features",
  },

  [consentTypes.MARKETING]: {
    id: consentTypes.MARKETING,
    label: "Publicités personnalisées",
    description:
      "Personalized ads based on your behavior. Not applicable to Premium users (ad-free). We recommend declining unless you want ads.",
    required: false,
    canBeDisabled: true,
    processors: ["google-ads"],
    purpose: "Display targeted advertisements",
    legalBasis: "Consent (Article 6(1)(a))",
    icon: "📢",
    note: "ℹ️ Premium users are automatically ad-free regardless of this setting",
  },
};

/**
 * Consent management defaults
 */
export const consentDefaults = {
  [consentTypes.NECESSARY]: true, // Always enabled
  [consentTypes.ANALYTICS]: false, // Opt-in by default
  [consentTypes.HEALTH_DATA]: false, // Opt-in by default
  [consentTypes.MARKETING]: false, // Opt-in by default
};

/**
 * Get consent by ID
 */
export const getConsent = (consentId) => {
  return consents[consentId];
};

/**
 * Get all consent requirements
 */
export const getAllConsents = () => {
  return Object.values(consents);
};

/**
 * Get required consents (those that cannot be disabled)
 */
export const getRequiredConsents = () => {
  return Object.values(consents).filter((c) => c.required);
};

/**
 * Get optional consents (those user can disable)
 */
export const getOptionalConsents = () => {
  return Object.values(consents).filter((c) => !c.required);
};

/**
 * Cookie management (for reset)
 */
export const cookiesToClear = {
  analytics: ["_ga", "_gid", "_gat", "_clck", "_clsk"],
  marketing: [],
  all: ["_ga", "_gid", "_gat", "_clck", "_clsk"],
};

/**
 * Validation: ensure user has given NECESSARY consent
 */
export const isConsentValid = (consentState) => {
  return consentState?.[consentTypes.NECESSARY] === true;
};

/**
 * Validation: check if consent is given for a specific category
 */
export const hasConsentFor = (consentState, consentType) => {
  if (consentType === consentTypes.NECESSARY) {
    return consentState?.[consentTypes.NECESSARY] === true;
  }
  return consentState?.[consentType] === true;
};

/**
 * Text for different consent scenarios
 */
export const consentMessages = {
  initialBanner: {
    title: "Nous respectons votre vie privée",
    description:
      "Nous utilisons des cookies essentiels pour le fonctionnement du site, et des cookies optionnels pour améliorer votre expérience.",
    acceptAll: "Accepter tout",
    rejectAll: "Rejeter tout",
    customize: "Personnaliser",
  },
  modal: {
    title: "Gestion des cookies et consentements",
    description:
      "Personnalisez vos préférences. Les cookies essentiels ne peuvent pas être désactivés.",
    necessary: "Ces cookies sont nécessaires - ils ne peuvent pas être désactivés",
    optional: "Ces cookies sont optionnels - à vous de choisir",
    save: "Enregistrer mes préférences",
    saveAndClose: "Enregistrer et fermer",
  },
};

export default {
  consentTypes,
  consents,
  consentDefaults,
  getConsent,
  getAllConsents,
  getRequiredConsents,
  getOptionalConsents,
  hasConsentFor,
  isConsentValid,
};
