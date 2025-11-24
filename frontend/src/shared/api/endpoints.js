export const endpoints = {
  system: {
    health: "/api/health",
  },
  auth: {
    register: "/api/register",
    login: "/api/login",
    me: "/api/me",
    refresh: "/api/refresh",
    logout: "/api/logout",
    verify: "/api/verify-email",
    forgot: "/api/forgot-password",
    reset: "/api/reset-password",
  },
  contact: {
    create: "/api/contact",
  },
  history: {
    list: "/api/history",
    add: "/api/history",
  },
  profile: {
    me: "/api/profile/me",
    update: "/api/profile",
    location: "/api/profile/location",
    availability: "/api/profile/availability",
    preferences: "/api/profile/preferences",
    byId: (userId) => `/api/profile/${userId}`,
  },
  matching: {
    suggestions: "/api/matching/suggestions",
    like: "/api/matching/like",
    reject: "/api/matching/reject",
    mutual: "/api/matching/mutual",
    block: "/api/matching/block",
  },
  subscription: {
    create: "/api/subscriptions/create-checkout-session",
    status: "/api/subscriptions/status",
    cancel: "/api/subscriptions/cancel",
    portal: "/api/subscriptions/customer-portal",
  },
  chat: {
    send: "/api/chat/send",
    history: "/api/chat/history",
    escalate: "/api/chat/escalate",
  }
};
export default endpoints;