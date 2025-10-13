
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const DEBUG_MODE = import.meta.env.DEV; 


function log(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[SessionManager] ${message}`, data || '');
  }
}


export function updateActivity() {
  const rememberMe = localStorage.getItem("rememberMe");
  
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


export function checkSession() {
  
  const user = localStorage.getItem("user");
  if (!user) {
    log("No user data found - session invalid");
    return false;
  }

  const rememberMe = localStorage.getItem("rememberMe");
  
  if (rememberMe === "true") {
    log("Session valid (remember me active)");
    return true;
  }

  const lastActivity = localStorage.getItem("lastActivity");
  if (!lastActivity) {
    
    const now = Date.now();
    localStorage.setItem("lastActivity", now.toString());
    log("No lastActivity found - creating timestamp", new Date(now).toLocaleString());
    return true;
  }

  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const elapsed = now - lastActivityTime;
  const remainingTime = SESSION_DURATION - elapsed;

  
  if (elapsed > SESSION_DURATION) {
    const hoursInactive = (elapsed / (60 * 60 * 1000)).toFixed(1);
    log(`Session expired - inactive for ${hoursInactive}h`, {
      lastActivity: new Date(lastActivityTime).toLocaleString(),
      now: new Date(now).toLocaleString()
    });
    return false;
  }

  
  if (remainingTime < 60 * 60 * 1000) {
    const minutesRemaining = Math.floor(remainingTime / (60 * 1000));
    log(`Session will expire in ${minutesRemaining} minutes`);
  }

  
  localStorage.setItem("lastActivity", now.toString());
  return true;
}


export async function logout(reason = "manual") {
  log(`Logout triggered - reason: ${reason}`);

  
  try {
    const { logout: secureLogout } = await import('./authService.js');
    await secureLogout();
  } catch (error) {
    log("Fallback to local logout");
    
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


export function logoutAndRedirect(reason = "session_expired") {
  logout(reason);

  
  const currentPath = window.location.pathname;
  if (currentPath !== '/' && reason === "session_expired") {
    sessionStorage.setItem("redirectAfterLogin", currentPath);
    log(`Will redirect to ${currentPath} after re-login`);
  }

  
  setTimeout(() => {
    window.location.href = '/';
  }, 100);
}


export function initActivityListeners() {
  log("Initializing activity listeners");

  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  let lastUpdate = Date.now();
  const throttleMs = 60000; 

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

  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      log("Tab became visible - checking session");
      
      
      
      
    }
  });

  
  
  
  
  
  
  

  log("Session manager fully initialized");
}


export function getSessionTimeRemaining() {
  const rememberMe = localStorage.getItem("rememberMe");
  if (rememberMe === "true") {
    return Infinity; 
  }

  const lastActivity = localStorage.getItem("lastActivity");
  if (!lastActivity) {
    return Math.floor(SESSION_DURATION / (60 * 1000)); 
  }

  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  const elapsed = now - lastActivityTime;
  const remaining = SESSION_DURATION - elapsed;

  return Math.max(0, Math.floor(remaining / (60 * 1000)));
}
