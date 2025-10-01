export function safeLocalStorage(operation, key, value = null) {
  try {
    if (operation === 'get') {
      return localStorage.getItem(key);
    } else if (operation === 'set') {
      localStorage.setItem(key, value);
      return true;
    } else if (operation === 'remove') {
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`localStorage ${operation} failed for key "${key}":`, error);
    }
    return operation === 'get' ? null : false;
  }
}

export function safeSessionStorage(operation, key, value = null) {
  try {
    if (operation === 'get') {
      return sessionStorage.getItem(key);
    } else if (operation === 'set') {
      sessionStorage.setItem(key, value);
      return true;
    } else if (operation === 'remove') {
      sessionStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`sessionStorage ${operation} failed for key "${key}":`, error);
    }
    return operation === 'get' ? null : false;
  }
}

export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('JSON.parse failed:', error);
    }
    return fallback;
  }
}

export function safeJsonStringify(obj, fallback = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('JSON.stringify failed:', error);
    }
    return fallback;
  }
}