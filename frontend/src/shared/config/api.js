export const API_BASE_URL = (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function getApiUrl(endpoint = '') {
  const base = API_BASE_URL || '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}