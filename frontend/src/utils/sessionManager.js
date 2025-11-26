import { storage } from '../shared/utils/storage';

// Durée de session par défaut : 24 heures (en millisecondes)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Met à jour le timestamp de dernière activité
export function updateActivity() {
  const rememberMe = storage.get("rememberMe");
  // Ne pas gérer le timestamp si "remember me" est activé
  if (rememberMe === "true") return;

  const token = storage.get("token");
  if (token) {
    storage.set("lastActivity", Date.now().toString());
  }
}

// Vérifie si la session est encore valide
export function checkSession() {
  const token = storage.get("token");
  // Sans jeton, on considère la session comme "neutre" pour éviter les redirections intempestives
  if (!token) return true;

  const rememberMe = storage.get("rememberMe");
  // Si "remember me" est activé, la session est toujours valide
  if (rememberMe === "true") return true;

  const lastActivity = storage.get("lastActivity");
  if (!lastActivity) {
    // Pas de timestamp : probablement une ancienne session, on la valide mais on crée le timestamp
    storage.set("lastActivity", Date.now().toString());
    return true;
  }

  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const elapsed = now - lastActivityTime;

  // Si plus de SESSION_DURATION d'inactivité, déconnecter
  if (elapsed > SESSION_DURATION) {
    return false;
  }

  // Sinon, mettre à jour le timestamp
  storage.set("lastActivity", now.toString());
  return true;
}

// Déconnecte l'utilisateur
export function logout() {
  storage.remove("token");
  storage.remove("user");
  storage.remove("userId"); // Important pour réafficher le message d'invitation
  storage.remove("lastActivity");
  storage.remove("rememberMe");
  storage.remove("cachedDisplayName");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");
}

// Initialise les listeners d'activité
export function initActivityListeners() {
  // Mettre à jour l'activité lors d'interactions utilisateur
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  let lastUpdate = Date.now();
  const throttleMs = 60000; // Mettre à jour max toutes les 60 secondes

  const throttledUpdate = () => {
    const now = Date.now();
    if (now - lastUpdate > throttleMs) {
      updateActivity();
      lastUpdate = now;
    }
  };

  events.forEach(event => {
    window.addEventListener(event, throttledUpdate, { passive: true });
  });

  // Vérifier la session au chargement et à chaque visibilité
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !checkSession()) {
      logout();
      window.location.href = '/';
    }
  });

  // Vérification périodique toutes les 5 minutes
  setInterval(() => {
    if (!checkSession()) {
      logout();
      window.location.href = '/';
    }
  }, 5 * 60 * 1000);
}
