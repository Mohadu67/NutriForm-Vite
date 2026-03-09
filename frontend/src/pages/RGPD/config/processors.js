/**
 * DATA PROCESSORS REGISTRY
 * Article 28 GDPR - All third parties processing personal data
 * Each has Data Processing Agreement (DPA) in place
 */

export const dataProcessors = [
  {
    id: "stripe",
    name: "Stripe Inc.",
    category: "Payment Processing",
    website: "https://stripe.com",
    dataProcessed: [
      "Email address",
      "Payment information (tokenized, never full card)",
      "Transaction amount & frequency",
      "Billing address (optional)",
    ],
    purpose: "Process Premium subscription payments securely",
    legalBasis: "Contract (subscription agreement)",
    dpaLink: "https://stripe.com/en-fr/privacy",
    subProcessors: ["Stripe's payment infrastructure partners"],
    dataTransfer: "Potentially international (USA)",
    transferMechanism: "Standard Contractual Clauses (SCCs)",
    retentionPeriod: "Transaction records: 10 years (legal obligation)",
    userRights: "Can view/export payments via Stripe dashboard",
  },
  {
    id: "expo-push",
    name: "Expo (EAS) - Expo Notifications",
    category: "Push Notifications",
    website: "https://expo.dev",
    dataProcessed: ["Device push token", "User ID", "Notification preferences"],
    purpose: "Send push notifications for app updates and user messages",
    legalBasis: "Consent (user enables notifications)",
    dpaLink: "https://expo.dev/privacy",
    subProcessors: ["AWS (Expo uses AWS infrastructure)"],
    dataTransfer: "International (USA)",
    transferMechanism: "SCCs via Expo",
    retentionPeriod: "While notifications enabled, deleted upon app uninstall",
    userRights: "Can disable notifications in OS settings",
  },
  {
    id: "google-analytics",
    name: "Google Analytics (GA4)",
    category: "Analytics & Tracking",
    website: "https://analytics.google.com",
    trackingId: "G-W8MHL50PHX",
    dataProcessed: [
      "Pages visited",
      "Time on page",
      "Interactions (clicks, scrolls)",
      "Device type, OS, browser",
      "Approximate location (city-level)",
      "Anonymized user behavior",
    ],
    purpose: "Understand user behavior, improve platform UX, measure performance",
    legalBasis: "Consent (cookie consent management)",
    dpaLink: "https://support.google.com/analytics/answer/3379043",
    subProcessors: ["Google Ads, Google Cloud"],
    dataTransfer: "International (USA)",
    transferMechanism: "SCCs + Privacy Shield adequacy decisions",
    retentionPeriod: "14 months (configurable, default auto-delete after 14 months)",
    userRights: "Opt-out via Google Analytics Opt-out Browser Add-on",
    note: "⚠️ International transfer subject to Schrems II implications",
  },
  {
    id: "microsoft-clarity",
    name: "Microsoft Clarity",
    category: "Analytics & Session Recording",
    website: "https://clarity.microsoft.com",
    trackingId: "thd0hih6t5",
    dataProcessed: [
      "Session recordings (user interactions)",
      "Mouse movements, clicks, scrolls",
      "Form interactions",
      "Device/browser info",
    ],
    purpose: "Analyze user interactions, identify UX issues, session debugging",
    legalBasis: "Consent (cookie consent management)",
    dpaLink: "https://clarity.microsoft.com/privacy",
    subProcessors: ["Microsoft Azure"],
    dataTransfer: "International (USA)",
    transferMechanism: "SCCs",
    retentionPeriod: "13 months (auto-deletion after inactivity)",
    userRights: "Can be disabled via browser settings",
    note: "⚠️ Session recording may capture sensitive data - users should be aware",
  },
  {
    id: "apple-healthkit",
    name: "Apple Health / HealthKit",
    category: "Health Data Integration",
    website: "https://www.apple.com/privacy/",
    dataProcessed: [
      "Activity data (steps, distance, calories)",
      "Heart rate data",
      "Workout records",
    ],
    purpose: "Allow users to import personal health data from Apple Health",
    legalBasis: "Explicit consent (Article 9 - sensitive data)",
    dpaLink: "https://www.apple.com/privacy/",
    subProcessors: "None - local device processing only",
    dataTransfer: "Local device (no transfer to cloud unless user exports)",
    retentionPeriod: "While app installed; deleted upon app removal",
    userRights: "Users control what data is shared via iOS Health app settings",
    note: "✓ Data stays local on device, Harmonith acts as processor only",
  },
  {
    id: "google-healthconnect",
    name: "Google Health Connect",
    category: "Health Data Integration",
    website: "https://health.google/",
    dataProcessed: [
      "Activity data (steps, distance, calories)",
      "Heart rate",
      "Sleep records",
      "Nutrition info",
    ],
    purpose: "Allow users to import health data from Android Health Connect",
    legalBasis: "Explicit consent (Article 9 - sensitive data)",
    dpaLink: "https://policies.google.com/privacy",
    subProcessors: "None - local device processing only",
    dataTransfer: "Local device (no transfer unless user exports)",
    retentionPeriod: "While app installed; deleted upon app removal",
    userRights: "Users control permissions via Android settings",
    note: "✓ Data stays local on device, Harmonith acts as processor only",
  },
  {
    id: "google-signin",
    name: "Google OAuth / Sign-In",
    category: "Authentication",
    website: "https://developers.google.com/identity",
    dataProcessed: ["Email", "Name", "Profile picture (if shared)", "Google ID"],
    purpose: "Alternative authentication method (sign-up/login with Google)",
    legalBasis: "Consent (user chooses Google sign-in)",
    dpaLink: "https://policies.google.com/privacy",
    subProcessors: ["Google Cloud"],
    dataTransfer: "International (USA)",
    transferMechanism: "SCCs",
    retentionPeriod: "Until account deletion",
    userRights: "Can revoke access via Google Account settings",
  },
  {
    id: "apple-signin",
    name: "Apple Sign-In",
    category: "Authentication",
    website: "https://developer.apple.com/sign-in-with-apple/",
    dataProcessed: [
      "Email (optional, can be hidden)",
      "Name (optional)",
      "Apple ID",
    ],
    purpose: "Alternative authentication method (sign-up/login with Apple)",
    legalBasis: "Consent (user chooses Apple sign-in)",
    dpaLink: "https://www.apple.com/privacy/",
    subProcessors: "None - Apple manages auth locally",
    dataTransfer: "Minimal - Apple ID only",
    retentionPeriod: "Until account deletion",
    userRights: "Can revoke via Apple Account settings",
    note: "✓ Apple offers privacy-focused sign-in option (hidden email)",
  },
  {
    id: "google-ads",
    name: "Google AdSense",
    category: "Advertising (Free users only)",
    website: "https://adsense.google.com",
    dataProcessed: [
      "Behavior data",
      "Device info",
      "Approximate location",
      "Cookie data",
    ],
    purpose: "Display targeted ads to generate platform revenue (free users only)",
    legalBasis: "Consent (cookie consent) + Legitimate Interest",
    dpaLink: "https://policies.google.com/privacy",
    subProcessors: ["Google Ads, Google Analytics"],
    dataTransfer: "International (USA)",
    transferMechanism: "SCCs",
    retentionPeriod: "As per Google's retention policy",
    userRights: "Premium users: ad-free; All users can opt-out via Google Ads Settings",
    note: "❌ Premium users see NO ads - can be important feature to highlight",
  },
  {
    id: "ovh-hosting",
    name: "OVH SAS",
    category: "Infrastructure & Hosting",
    website: "https://www.ovh.com/fr/",
    dataProcessed: "All personal data (processed by Harmonith backend)",
    purpose: "Host application, store user data securely",
    legalBasis: "Contract (service provision)",
    dpaLink: "https://www.ovh.com/fr/protection-donnees-personnelles/",
    subProcessors: ["OVH infrastructure partners"],
    dataTransfer: "EU (data centers in European Union)",
    transferMechanism: "✓ No international transfer (EU-based)",
    retentionPeriod: "Per Harmonith retention policy",
    userRights: "Data portability, erasure requests processed by Harmonith",
  },
];

/**
 * Helper function to get processor by ID
 */
export const getProcessor = (id) => {
  return dataProcessors.find((p) => p.id === id);
};

/**
 * Get all processors requiring international data transfer
 */
export const getInternationalTransferProcessors = () => {
  return dataProcessors.filter((p) => p.dataTransfer?.includes("International"));
};

/**
 * Get all processors with health data (Article 9)
 */
export const getHealthDataProcessors = () => {
  return dataProcessors.filter((p) => {
    if (!Array.isArray(p.dataProcessed)) {
      return false;
    }
    return (
      p.dataProcessed.some((d) => d.toLowerCase().includes("health")) ||
      p.dataProcessed.some((d) => d.toLowerCase().includes("activity"))
    );
  });
};

export default dataProcessors;
