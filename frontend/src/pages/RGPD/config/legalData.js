/**
 * CENTRALIZED LEGAL DATA
 * Single source of truth for all legal/company information
 * Avoid repetition across pages
 */

export const companyInfo = {
  name: "Harmonith",
  editor: "Mohammed HAMIANI",
  email: "contact.harmonith@gmail.com",
  phone: "+33 7 83 33 06 94",
  address: "Strasbourg, France",
  website: "https://harmonith.fr",
};

export const hosting = {
  provider: "OVH SAS",
  type: "VPS (Virtual Private Server)",
  location: "Union Européenne",
  website: "https://www.ovh.com/fr/",
  compliance: "RGPD-compliant, data centers in EU",
  updatedDate: "2026-02-04",
  reason: "Migration from Netlify (frontend) and Render (backend) to unified OVH VPS infrastructure",
};

export const payment = {
  provider: "Stripe Inc.",
  website: "https://stripe.com",
  certification: "PCI-DSS Level 1",
  currency: "EUR",
  vat: "Non-applicable (article 293 B du CGI)",
  businessType: "SaaS - Premium subscription",
};

export const legalFramework = {
  applicableLaw: "French law",
  competentCourts: "Tribunals of Strasbourg, France",
  regulations: [
    "RGPD (Regulation EU 2016/679)",
    "Loi Informatique et Libertés (Law 78-17)",
    "Loi Hamon (Consumer rights)",
    "eCommerce Directive (2000/31/EC)",
  ],
  cnil: {
    name: "Commission Nationale de l'Informatique et des Libertés (CNIL)",
    address: "3 Place de Fontenoy, 75334 PARIS CEDEX 07, France",
    phone: "01 53 73 22 22",
    website: "https://www.cnil.fr",
    complaintForm: "https://www.cnil.fr/fr/vous-souhaitez-nous-signaler-un-probleme",
  },
  mediation: {
    name: "MEDICYS",
    website: "https://www.medicys.fr",
    purpose: "Free mediation for consumer disputes",
  },
};

export const features = {
  free: [
    "BMI/Calorie calculators",
    "Public programs and recipes",
    "Basic profile setup",
    "Community features (read-only)",
  ],
  premium: [
    "Personalized training programs",
    "Advanced matching algorithm",
    "Exclusive recipes and content",
    "Detailed progress analytics",
    "Priority customer support",
    "Ad-free experience",
  ],
};

export const versions = {
  mentionsLegales: {
    date: "2026-02-04",
    changes: "OVH hosting update",
  },
  privacyPolicy: {
    date: "2026-02-04",
    changes: "Complete RGPD audit and refactoring",
  },
  terms: {
    date: "2026-02-04",
    changes: "Merged CGV + Terms, updated all sections",
  },
  cookies: {
    date: "2026-02-04",
    changes: "New cookie banner and consent system",
  },
};

export const minorAgeRequirements = {
  minimumAge: 13,
  countries: {
    france: { age: 13, requireParentalConsent: false },
    eu: { age: 16, requireParentalConsent: false },
  },
  reportMinor: "contact.harmonith@gmail.com",
};

export const responsePolicy = {
  gdprRequestResponseTime: "30 days",
  extensionMaxDays: 60,
  dataExportFormat: "Structured, commonly-used, machine-readable format (JSON/CSV)",
};
