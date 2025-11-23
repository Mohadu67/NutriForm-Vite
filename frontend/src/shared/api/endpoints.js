export const endpoints = {
  system: {
    health: "/health",
  },
  auth: {
    register: "/register",
    login: "/login",
    me: "/me",
    refresh: "/refresh",
    logout: "/logout",
    verify: "/verify-email",
    forgot: "/forgot-password",
    reset: "/reset-password",
  },
  contact: {
    create: "/contact",
  },
  history: {
    list: "/history",
    add: "/history",
  },
  profile: {
    me: "/profile/me",
    update: "/profile",
    location: "/profile/location",
    availability: "/profile/availability",
    preferences: "/profile/preferences",
    byId: (userId) => `/profile/${userId}`,
  },
  matching: {
    suggestions: "/matching/suggestions",
    like: "/matching/like",
    reject: "/matching/reject",
    mutual: "/matching/mutual",
    block: "/matching/block",
  }
};
export default endpoints;