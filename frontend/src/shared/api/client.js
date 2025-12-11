import axios from "axios";
import { storage } from "../utils/storage";

// Protection contre import.meta.env undefined
const baseURL = (() => {
  try {
    return import.meta.env?.VITE_API_URL || "";
  } catch {
    return "";
  }
})();

const client = axios.create({
  baseURL,
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // NE PAS supprimer les données utilisateur automatiquement
      // Le 401 peut être temporaire (problème réseau, timing, etc.)
      // La déconnexion explicite doit passer par logout()

      // On dispatche l'événement mais sans supprimer les données
      window.dispatchEvent(new Event('storage'));

      // Ne rediriger que depuis les pages protégées (dashboard, admin, etc.)
      // ET seulement si on n'a pas de données utilisateur en cache
      const hasLocalUser = storage.get('user');
      if (!hasLocalUser) {
        const protectedRoutes = ['/dashboard', '/admin', '/profile/setup'];
        const currentPath = window.location.pathname;
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

        if (isProtectedRoute) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default client;