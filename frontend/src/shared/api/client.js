import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({
  baseURL,
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.dispatchEvent(new Event('storage'));
      // Ne rediriger que depuis les pages protégées (dashboard, admin, etc.)
      const protectedRoutes = ['/dashboard', '/admin', '/profile/setup'];
      const currentPath = window.location.pathname;
      const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

      if (isProtectedRoute) {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default client;