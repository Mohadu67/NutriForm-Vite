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
  },
  subscription: {
    create: "/subscriptions/create-checkout-session",
    status: "/subscriptions/status",
    cancel: "/subscriptions/cancel",
    portal: "/subscriptions/customer-portal",
  },
  chat: {
    send: "/chat/send",
    history: "/chat/history",
    escalate: "/chat/escalate",
    aiConversations: "/chat/ai-conversations",
    deleteAiConversation: (conversationId) => `/chat/ai-conversation/${conversationId}`,
  },
  supportTickets: {
    list: "/admin/support-tickets",
    byId: (ticketId) => `/admin/support-tickets/${ticketId}`,
    reply: (ticketId) => `/admin/support-tickets/${ticketId}/reply`,
    resolve: (ticketId) => `/admin/support-tickets/${ticketId}/resolve`,
    reopen: (ticketId) => `/admin/support-tickets/${ticketId}/reopen`,
    assign: (ticketId) => `/admin/support-tickets/${ticketId}/assign`,
    stats: "/admin/support-tickets/stats",
  }
};
export default endpoints;