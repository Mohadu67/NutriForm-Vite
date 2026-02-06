import client from './client';
import endpoints from './endpoints';

/**
 * Authentication service for React Native
 */

/**
 * Login with email and password
 * @param {object} payload - { email, password }
 * @returns {Promise<{token: string, refreshToken: string, user: object}>}
 */
export function login(payload) {
  return client.post(endpoints.auth.login, payload);
}

/**
 * Register new user
 * @param {object} payload - User registration data
 * @returns {Promise<{token: string, refreshToken: string, user: object}>}
 */
export function register(payload) {
  return client.post(endpoints.auth.register, payload);
}

/**
 * Get current user info
 * @returns {Promise<{user: object}>}
 */
export function me() {
  return client.get(endpoints.auth.me);
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{token: string, refreshToken?: string}>}
 */
export function refresh(refreshToken) {
  return client.post(endpoints.auth.refresh, { refreshToken });
}

/**
 * Logout current user
 * @returns {Promise}
 */
export function logout() {
  return client.post(endpoints.auth.logout);
}

/**
 * Check if user is authenticated by calling /me endpoint
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    await me();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify email with token
 * @param {string} token - Email verification token
 * @returns {Promise}
 */
export function verifyEmail(token) {
  return client.post(endpoints.auth.verify, { token });
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise}
 */
export function forgotPassword(email) {
  return client.post(endpoints.auth.forgot, { email });
}

/**
 * Reset password with token
 * @param {object} payload - { token, password }
 * @returns {Promise}
 */
export function resetPassword(payload) {
  return client.post(endpoints.auth.reset, payload);
}

/**
 * Login with Apple
 * @param {object} appleCredentials - { identityToken, user }
 * @returns {Promise<{token: string, refreshToken: string, user: object}>}
 */
export function loginWithApple(appleCredentials) {
  return client.post('/auth/apple', {
    identityToken: appleCredentials.identityToken,
    user: appleCredentials.user,
  });
}

/**
 * Login with Google
 * @param {object} googleCredentials - { idToken }
 * @returns {Promise<{token: string, refreshToken: string, user: object}>}
 */
export function loginWithGoogle(googleCredentials) {
  return client.post('/auth/google', {
    idToken: googleCredentials.idToken,
  });
}

/**
 * Resend verification email
 * @returns {Promise}
 */
export function resendVerificationEmail() {
  return client.post('/auth/resend-verification');
}

// Legacy export for backward compatibility
const authService = {
  // identifier peut être email ou pseudo
  login: (identifier, password) => login({ identifier, password }).then(res => res.data),
  register: (userData) => register(userData).then(res => res.data),
  loginWithApple: (creds) => loginWithApple(creds).then(res => res.data),
  loginWithGoogle: (creds) => loginWithGoogle(creds).then(res => res.data),
  getCurrentUser: () => me().then(res => res.data),
  refreshToken: (refreshToken) => refresh(refreshToken).then(res => res.data),
  logout: () => logout(),
  forgotPassword: (email) => forgotPassword(email).then(res => res.data),
  resetPassword: (token, password) => resetPassword({ token, password }).then(res => res.data),
  verifyEmail: (token) => verifyEmail(token).then(res => res.data),
  resendVerificationEmail: () => resendVerificationEmail().then(res => res.data),
};

export default authService;
