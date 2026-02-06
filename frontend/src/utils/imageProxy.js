/**
 * Utilitaire pour gérer le proxy d'images et éviter les erreurs CORS
 */

import { API_BASE_URL } from '../shared/config/api';

const CLOUDINARY_DOMAINS = ['res.cloudinary.com', 'cloudinary.com'];
const API_URL = API_BASE_URL || '/api';

/**
 * Vérifie si une URL d'image doit utiliser le proxy
 * @param {string} imageUrl - URL de l'image
 * @returns {boolean}
 */
function shouldUseProxy(imageUrl) {
  if (!imageUrl) return false;

  try {
    const url = new URL(imageUrl);

    // Ne pas proxier les images Cloudinary (déjà CORS-friendly)
    if (CLOUDINARY_DOMAINS.some(domain => url.hostname.includes(domain))) {
      return false;
    }

    // Ne pas proxier les images locales ou relatives
    if (url.protocol === 'data:' || url.protocol === 'blob:') {
      return false;
    }

    // Proxier toutes les autres images externes
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    // URL invalide, ne pas proxier
    return false;
  }
}

/**
 * Retourne l'URL de l'image, via le proxy si nécessaire
 * @param {string} imageUrl - URL originale de l'image
 * @returns {string} - URL finale (directe ou via proxy)
 */
export function getProxiedImageUrl(imageUrl) {
  if (!imageUrl) return '';

  // Si l'image doit être proxiée
  if (shouldUseProxy(imageUrl)) {
    const encodedUrl = encodeURIComponent(imageUrl);
    return `${API_URL}/image-proxy?url=${encodedUrl}`;
  }

  // Sinon retourner l'URL directe
  return imageUrl;
}

/**
 * Props à ajouter à une balise <img> pour une meilleure gestion
 * @param {string} imageUrl - URL de l'image
 * @param {string} alt - Texte alternatif
 * @returns {object} Props pour <img>
 */
export function getImageProps(imageUrl, alt = '') {
  return {
    src: getProxiedImageUrl(imageUrl),
    alt,
    loading: 'lazy',
    onError: (e) => {
      // Fallback: masquer l'image si elle ne charge pas
      e.target.style.display = 'none';
      e.target.setAttribute('aria-hidden', 'true');
    }
  };
}
