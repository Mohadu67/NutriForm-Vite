/**
 * Logger centralisé pour l'application
 * Remplace les console.log dispersés dans le code
 */

const isDev = import.meta.env.DEV;

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
