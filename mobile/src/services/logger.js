/**
 * Service de logging centralisé pour l'application mobile
 *
 * Remplace les console.log/error dispersés par un système structuré
 * qui peut être configuré et étendu (Sentry, Analytics, etc.)
 */

// Niveaux de log
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Configuration
const config = {
  // Activer/désactiver les logs (false en production)
  enabled: __DEV__,

  // Niveau minimum de log à afficher
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,

  // Activer les timestamps
  timestamps: true,

  // Activer les couleurs (pour debug)
  colors: true,
};

// Couleurs pour les différents niveaux (console uniquement)
const COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

// Ordre des niveaux de log (pour filtrage)
const LEVEL_ORDER = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Vérifie si un niveau de log doit être affiché
 */
function shouldLog(level) {
  if (!config.enabled) return false;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[config.minLevel];
}

/**
 * Formate un message de log
 */
function formatMessage(level, tag, message, data) {
  const parts = [];

  // Timestamp
  if (config.timestamps) {
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    parts.push(`[${time}]`);
  }

  // Niveau
  parts.push(`[${level}]`);

  // Tag
  if (tag) {
    parts.push(`[${tag}]`);
  }

  // Message
  parts.push(message);

  return parts.join(' ');
}

/**
 * Log interne (avec console)
 */
function logToConsole(level, tag, message, data) {
  if (!shouldLog(level)) return;

  const formattedMessage = formatMessage(level, tag, message, data);

  // Couleur selon le niveau (si activé)
  const coloredMessage = config.colors
    ? `${COLORS[level]}${formattedMessage}${COLORS.RESET}`
    : formattedMessage;

  // Appel console approprié
  switch (level) {
    case LogLevel.ERROR:
      console.error(coloredMessage, data || '');
      break;
    case LogLevel.WARN:
      console.warn(coloredMessage, data || '');
      break;
    case LogLevel.INFO:
      console.info(coloredMessage, data || '');
      break;
    case LogLevel.DEBUG:
    default:
      console.log(coloredMessage, data || '');
      break;
  }
}

/**
 * Logger principal
 */
class Logger {
  constructor(tag = 'APP') {
    this.tag = tag;
  }

  /**
   * Log de debug (développement uniquement)
   */
  debug(message, data) {
    logToConsole(LogLevel.DEBUG, this.tag, message, data);
  }

  /**
   * Log d'information
   */
  info(message, data) {
    logToConsole(LogLevel.INFO, this.tag, message, data);
  }

  /**
   * Log d'avertissement
   */
  warn(message, data) {
    logToConsole(LogLevel.WARN, this.tag, message, data);
  }

  /**
   * Log d'erreur
   */
  error(message, error) {
    logToConsole(LogLevel.ERROR, this.tag, message, error);

    // TODO: Envoyer vers Sentry en production
    // if (!__DEV__ && error instanceof Error) {
    //   Sentry.captureException(error, {
    //     tags: { tag: this.tag },
    //     extra: { message },
    //   });
    // }
  }

  /**
   * Crée un logger enfant avec un nouveau tag
   */
  child(childTag) {
    return new Logger(`${this.tag}:${childTag}`);
  }
}

// Loggers par catégorie (pré-configurés)
export const logger = {
  // Logger général
  app: new Logger('APP'),

  // Authentification
  auth: new Logger('AUTH'),

  // API
  api: new Logger('API'),

  // Navigation
  nav: new Logger('NAV'),

  // Workout
  workout: new Logger('WORKOUT'),

  // Matching
  matching: new Logger('MATCHING'),

  // Exercises
  exercises: new Logger('EXERCISES'),

  // Profile
  profile: new Logger('PROFILE'),

  // Chat
  chat: new Logger('CHAT'),

  // WebSocket
  websocket: new Logger('WEBSOCKET'),

  // Notifications
  notifications: new Logger('NOTIFICATIONS'),

  // Storage
  storage: new Logger('STORAGE'),
};

/**
 * Créer un logger personnalisé
 */
export function createLogger(tag) {
  return new Logger(tag);
}

/**
 * Configurer le logger
 */
export function configureLogger(options) {
  Object.assign(config, options);
}

export default logger;
