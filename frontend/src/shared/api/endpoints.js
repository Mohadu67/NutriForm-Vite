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
  }
};
export default endpoints;