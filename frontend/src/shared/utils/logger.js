/**
 * Logger centralisé pour l'application
 * Remplace les console.log dispersés dans le code
 */

// Détection sûre du mode développement — compatible avec Node (CI) et navigateur
function getIsDev() {
  // 1) check Node/CI
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    return true
  }

  // 2) try to read import.meta.env if available (wrapped in try/catch to avoid static analysis/runtime issues)
  try {
    // import.meta may not exist in some environments; accessing it can throw in certain parsers — guard with try/catch
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return true
    }
  } catch (e) {
    // ignore
  }

  // 3) fallback to a VITE_ flag exposed via process.env (after loadEnv)
  if (typeof process !== 'undefined' && process.env && process.env.VITE_DEV === 'true') {
    return true
  }

  return false
}

const isDev = getIsDev()

class Logger {
  constructor(namespace = 'app') {
    this.namespace = namespace;
  }

  /**
   * Vérifie si le mode debug est activé
   */
  isDebugEnabled() {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Fonction interne pour logger avec un niveau spécifique
   */
  log(level, message, ...args) {
    // Seulement logger si debug est explicitement activé
    if (!this.isDebugEnabled()) {
      // En production, envoyer les erreurs à un service de monitoring
      if (level === 'error' && !isDev) {
        this.sendToMonitoring({ level, message, args, timestamp: new Date().toISOString() });
      }
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.namespace}] [${level}]`;

    console[level](prefix, message, ...args);
  }

  /**
   * Log informatif
   */
  info(message, ...args) {
    this.log('log', message, ...args);
  }

  /**
   * Log d'avertissement
   */
  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Log d'erreur
   */
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Log de debug (uniquement si debug activé)
   */
  debug(message, ...args) {
    if (this.isDebugEnabled()) {
      this.log('debug', message, ...args);
    }
  }

  /**
   * Log de succès (avec style)
   */
  success(message, ...args) {
    if (!this.isDebugEnabled()) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.namespace}] [SUCCESS]`;
    console.log(`%c${prefix} ${message}`, 'color: #10b981; font-weight: bold', ...args);
  }

  /**
   * Créer un logger avec un namespace spécifique
   */
  create(namespace) {
    return new Logger(namespace);
  }

  /**
   * Envoyer les erreurs à un service de monitoring (à implémenter)
   */
  sendToMonitoring(data) {
    // TODO: Intégration avec Sentry, LogRocket, etc.
    // Exemple:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(data.message, {
    //     level: data.level,
    //     extra: data.args
    //   });
    // }
  }
}

// Instance par défaut
const logger = new Logger('app');

// Loggers spécialisés pour différentes parties de l'app
export const apiLogger = new Logger('api');
export const authLogger = new Logger('auth');
export const dashboardLogger = new Logger('dashboard');
export const exerciseLogger = new Logger('exercise');

export default logger;
