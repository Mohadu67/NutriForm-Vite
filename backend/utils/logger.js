/**
 * Logger centralisé pour le backend
 * Remplace les console.log dispersés dans le code
 */

const isDev = process.env.NODE_ENV !== 'production';
const isDebug = process.env.DEBUG === 'true';

class Logger {
  constructor(namespace = 'app') {
    this.namespace = namespace;
  }

  /**
   * Fonction interne pour logger avec un niveau spécifique
   */
  log(level, message, ...args) {
    if (!isDev && !isDebug) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}]`;

    console[level](prefix, message, ...args);

    // En production, envoyer les erreurs à un service de monitoring
    if (level === 'error' && !isDev) {
      this.sendToMonitoring({ level, message, args, timestamp });
    }
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
    if (isDebug) {
      this.log('debug', message, ...args);
    }
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
  }
}

// Instance par défaut
const logger = new Logger('backend');

// Loggers spécialisés pour différentes parties du backend
const apiLogger = new Logger('api');
const authLogger = new Logger('auth');
const dbLogger = new Logger('database');
const emailLogger = new Logger('email');

module.exports = logger;
module.exports.apiLogger = apiLogger;
module.exports.authLogger = authLogger;
module.exports.dbLogger = dbLogger;
module.exports.emailLogger = emailLogger;
module.exports.Logger = Logger;
