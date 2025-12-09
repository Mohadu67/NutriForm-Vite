const sanitizeHtml = require('sanitize-html');

// Whitelist des domaines autorisés pour les images
const ALLOWED_IMAGE_DOMAINS = [
  'harmonith.fr',
  'res.cloudinary.com',
  'i.imgur.com',
  'images.unsplash.com'
];

/**
 * Configuration stricte pour sanitize-html
 * Permet seulement du texte basique avec formatage minimal
 */
const strictOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  allowedSchemes: [],
  allowProtocolRelative: false
};

/**
 * Configuration permissive pour descriptions longues
 * Permet listes, liens, et formatage de base
 */
const permissiveOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
    'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre'
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto']
  },
  allowProtocolRelative: false,
  transformTags: {
    // Forcer target="_blank" et rel="noopener noreferrer" sur tous les liens
    'a': (tagName, attribs) => {
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      };
    }
  }
};

/**
 * Sanitize un champ texte court (nom, titre, etc.)
 * Supprime tout HTML et limite la longueur
 */
function sanitizeShortText(text, maxLength = 200) {
  if (!text || typeof text !== 'string') return '';

  // Supprimer tout HTML
  const cleaned = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });

  // Trim whitespace
  const trimmed = cleaned.trim();

  // Limiter la longueur
  return trimmed.slice(0, maxLength);
}

/**
 * Sanitize une description longue avec formatage minimal autorisé
 */
function sanitizeLongText(text, maxLength = 5000) {
  if (!text || typeof text !== 'string') return '';

  // Autoriser formatage de base
  const cleaned = sanitizeHtml(text, permissiveOptions);

  // Limiter la longueur
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitize des instructions (peut contenir listes)
 */
function sanitizeInstructions(text, maxLength = 3000) {
  if (!text || typeof text !== 'string') return '';

  const cleaned = sanitizeHtml(text, permissiveOptions);
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitize des tips/conseils (formatage basique)
 */
function sanitizeTips(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';

  const cleaned = sanitizeHtml(text, strictOptions);
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitize un tableau de strings (tags, muscle groups, equipment)
 */
function sanitizeArray(arr, maxItems = 20, maxLength = 50) {
  if (!Array.isArray(arr)) return [];

  return arr
    .slice(0, maxItems)
    .map(item => sanitizeShortText(String(item), maxLength))
    .filter(item => item.length > 0);
}

/**
 * Sanitize un objet programme complet
 */
function sanitizeProgram(data) {
  const sanitized = {};

  // Champs courts
  if (data.name) sanitized.name = sanitizeShortText(data.name, 100);
  if (data.type) sanitized.type = sanitizeShortText(data.type, 30);
  if (data.difficulty) sanitized.difficulty = sanitizeShortText(data.difficulty, 30);

  // Champs longs
  if (data.description) sanitized.description = sanitizeLongText(data.description, 5000);
  if (data.instructions) sanitized.instructions = sanitizeInstructions(data.instructions, 3000);
  if (data.tips) sanitized.tips = sanitizeTips(data.tips, 1000);

  // Tableaux
  if (data.tags) sanitized.tags = sanitizeArray(data.tags, 10, 30);
  if (data.muscleGroups) sanitized.muscleGroups = sanitizeArray(data.muscleGroups, 15, 30);
  if (data.equipment) sanitized.equipment = sanitizeArray(data.equipment, 10, 50);

  // Nombres (pas de sanitization HTML mais validation)
  if (data.estimatedDuration !== undefined) {
    sanitized.estimatedDuration = Math.max(0, Math.min(300, Number(data.estimatedDuration) || 0));
  }
  if (data.estimatedCalories !== undefined) {
    sanitized.estimatedCalories = Math.max(0, Math.min(2000, Number(data.estimatedCalories) || 0));
  }

  // URL d'image (validation stricte avec whitelist de domaines)
  if (data.coverImage) {
    const cleaned = sanitizeShortText(data.coverImage, 500);

    // Vérifier que c'est une URL valide (http/https ou chemin relatif)
    if (cleaned.match(/^(https?:\/\/|\/)/)) {
      // Si c'est une URL absolue, vérifier le domaine
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        try {
          const url = new URL(cleaned);
          const domain = url.hostname;

          // Vérifier si le domaine est dans la whitelist
          const isAllowed = ALLOWED_IMAGE_DOMAINS.some(allowedDomain => {
            return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
          });

          if (isAllowed) {
            sanitized.coverImage = cleaned;
          }
        } catch (e) {
          // URL invalide, on ne l'assigne pas
        }
      } else {
        // Chemin relatif, autorisé
        sanitized.coverImage = cleaned;
      }
    }
  }

  // Cycles (sanitize nom d'exercice seulement)
  if (Array.isArray(data.cycles)) {
    sanitized.cycles = data.cycles.map(cycle => {
      const sanitizedCycle = { ...cycle };

      if (cycle.exerciseName) {
        sanitizedCycle.exerciseName = sanitizeShortText(cycle.exerciseName, 100);
      }

      if (cycle.notes) {
        sanitizedCycle.notes = sanitizeTips(cycle.notes, 500);
      }

      return sanitizedCycle;
    });
  }

  return sanitized;
}

module.exports = {
  sanitizeShortText,
  sanitizeLongText,
  sanitizeInstructions,
  sanitizeTips,
  sanitizeArray,
  sanitizeProgram
};
