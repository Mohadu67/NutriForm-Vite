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
  } catch {
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
  } catch {
    return operation === 'get' ? null : false;
  }
}

export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(obj, fallback = '{}') {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}