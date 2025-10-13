// Durée de session par défaut : 24 heures (en millisecondes)
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const DEBUG_MODE = import.meta.env.DEV; // Logs uniquement en développement

// Fonction de log conditionnelle
function log(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[SessionManager] ${message}`, data || '');
  }
}

// Met à jour le timestamp de dernière activité
export function updateActivity() {
  const rememberMe = localStorage.getItem("rememberMe");
  // Ne pas gérer le timestamp si "remember me" est activé
  if (rememberMe === "true") {
    log("Activity update skipped (remember me active)");
    return;
  }

  const user = localStorage.getItem("user");
  if (user) {
    const now = Date.now();
    localStorage.setItem("lastActivity", now.toString());
    log("Activity updated", new Date(now).toLocaleString());
  }
}

// Vérifie si la session est encore valide
export function checkSession() {
  // Vérifier si l'utilisateur est connecté via les données user (pas le token qui est en cookie)
  const user = localStorage.getItem("user");
  if (!user) {
    log("No user data found - session invalid");
    return false;
  }

  const rememberMe = localStorage.getItem("rememberMe");
  // Si "remember me" est activé, la session est toujours valide
  if (rememberMe === "true") {
    log("Session valid (remember me active)");
    return true;
  }

  const lastActivity = localStorage.getItem("lastActivity");
  if (!lastActivity) {
    // Pas de timestamp : probablement une ancienne session, on la valide mais on crée le timestamp
    const now = Date.now();
    localStorage.setItem("lastActivity", now.toString());
    log("No lastActivity found - creating timestamp", new Date(now).toLocaleString());
    return true;
  }

  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const elapsed = now - lastActivityTime;
  const remainingTime = SESSION_DURATION - elapsed;

  // Si plus de SESSION_DURATION d'inactivité, déconnecter
  if (elapsed > SESSION_DURATION) {
    const hoursInactive = (elapsed / (60 * 60 * 1000)).toFixed(1);
    log(`Session expired - inactive for ${hoursInactive}h`, {
      lastActivity: new Date(lastActivityTime).toLocaleString(),
      now: new Date(now).toLocaleString()
    });
    return false;
  }

  // Avertissement si session proche de l'expiration (< 1h restante)
  if (remainingTime < 60 * 60 * 1000) {
    const minutesRemaining = Math.floor(remainingTime / (60 * 1000));
    log(`Session will expire in ${minutesRemaining} minutes`);
  }

  // Sinon, mettre à jour le timestamp
  localStorage.setItem("lastActivity", now.toString());
  return true;
}

// Déconnecte l'utilisateur
export async function logout(reason = "manual") {
  log(`Logout triggered - reason: ${reason}`);

  // Utiliser le service d'authentification pour logout
  try {
    const { logout: secureLogout } = await import('./authService.js');
    await secureLogout();
  } catch (error) {
    log("Fallback to local logout");
    // Fallback manuel si le module ne charge pas
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("cachedDisplayName");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userId");
  }

  log("All session data cleared");
}

// Nouvelle fonction pour gérer la redirection après déconnexion
export function logoutAndRedirect(reason = "session_expired") {
  logout(reason);

  // Sauvegarder l'URL actuelle pour rediriger après reconnexion (optionnel)
  const currentPath = window.location.pathname;
  if (currentPath !== '/' && reason === "session_expired") {
    sessionStorage.setItem("redirectAfterLogin", currentPath);
    log(`Will redirect to ${currentPath} after re-login`);
  }

  // Attendre un tick pour permettre au localStorage de se synchroniser
  setTimeout(() => {
    window.location.href = '/';
  }, 100);
}

// Initialise les listeners d'activité
export function initActivityListeners() {
  log("Initializing activity listeners");

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

  log("Activity listeners registered for events:", events.join(", "));

  // Vérifier la session au chargement et à chaque visibilité
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      log("Tab became visible - checking session");
      if (!checkSession()) {
        logoutAndRedirect("session_expired_visibility");
      }
    }
  });

  // Vérification périodique toutes les 5 minutes
  setInterval(() => {
    log("Periodic session check (5min interval)");
    if (!checkSession()) {
      logoutAndRedirect("session_expired_periodic");
    }
  }, 5 * 60 * 1000);

  log("Session manager fully initialized");
}

// Fonction pour obtenir le temps restant avant expiration (en minutes)
export function getSessionTimeRemaining() {
  const rememberMe = localStorage.getItem("rememberMe");
  if (rememberMe === "true") {
    return Infinity; // Session illimitée
  }

  const lastActivity = localStorage.getItem("lastActivity");
  if (!lastActivity) {
    return Math.floor(SESSION_DURATION / (60 * 1000)); // Durée complète
  }

  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const elapsed = now - lastActivityTime;
  const remaining = SESSION_DURATION - elapsed;

  return Math.max(0, Math.floor(remaining / (60 * 1000)));
}
