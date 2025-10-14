const TOKEN_KEY = 'token';

export const tokenService = {
  get() {
    try {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken') ||
        null
      );
    } catch {
      return null;
    }
  },

  set(token, remember = true) {
    try {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
      return true;
    } catch (e) {
      console.error('Error saving token:', e);
      return false;
    }
  },

  remove() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('Error removing token:', e);
      return false;
    }
  },

  isValid() {
    return !!this.get();
  }
};