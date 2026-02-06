/**
 * Centralized API exports for React Native
 */

// Export client and token storage
export { default as client, API_URL, tokenStorage } from './client';

// Export endpoints
export { default as endpoints } from './endpoints';

// Export auth API (both named exports and default service)
export * from './auth';
export { default as authService } from './auth';

// Export profile API
export * from './profile';

// Export matching API
export * from './matching';

// Export match chat API
export * from './matchChat';

// Re-export with namespaced imports for convenience
import * as authAPI from './auth';
import * as profileAPI from './profile';
import * as matchingAPI from './matching';
import * as matchChatAPI from './matchChat';

export const api = {
  auth: authAPI,
  profile: profileAPI,
  matching: matchingAPI,
  matchChat: matchChatAPI,
};

export default api;
