// Protection contre import.meta.env undefined
export const API_BASE_URL = (() => {
  try {
    return (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
  } catch {
    return "";
  }
})();

export function getApiUrl(endpoint = '') {
  const base = API_BASE_URL || '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}