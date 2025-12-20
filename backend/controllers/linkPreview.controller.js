const axios = require('axios');
const logger = require('../utils/logger');

// Lazy load JSDOM pour éviter de bloquer le démarrage du serveur
let JSDOM = null;
const getJSDOM = () => {
  if (!JSDOM) {
    JSDOM = require('jsdom').JSDOM;
  }
  return JSDOM;
};

// Cache simple en mémoire pour éviter de refetch les mêmes URLs
const previewCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Récupère les métadonnées Open Graph d'une URL
 */
exports.getLinkPreview = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    // Valider l'URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'URL invalide' });
      }
    } catch {
      return res.status(400).json({ error: 'URL invalide' });
    }

    // Vérifier le cache
    const cached = previewCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Fetch la page
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HarmonithBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr,en;q=0.9'
      },
      validateStatus: (status) => status < 400
    });

    const html = response.data;
    if (typeof html !== 'string') {
      return res.status(400).json({ error: 'Contenu non HTML' });
    }

    // Parser le HTML (lazy load JSDOM)
    const JSDOMClass = getJSDOM();
    const dom = new JSDOMClass(html);
    const document = dom.window.document;

    // Extraire les métadonnées Open Graph
    const getMeta = (property) => {
      const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return meta?.getAttribute('content') || null;
    };

    // Chercher le favicon
    const getFavicon = () => {
      // Chercher les différents formats de favicon
      const iconSelectors = [
        'link[rel="icon"][type="image/png"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"]',
        'link[rel="shortcut icon"]'
      ];

      for (const selector of iconSelectors) {
        const icon = document.querySelector(selector);
        if (icon?.getAttribute('href')) {
          return icon.getAttribute('href');
        }
      }
      return '/favicon.ico';
    };

    const preview = {
      title: getMeta('og:title') || getMeta('twitter:title') || document.title || null,
      description: getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || null,
      image: getMeta('og:image') || getMeta('twitter:image') || null,
      siteName: getMeta('og:site_name') || null,
      type: getMeta('og:type') || null,
      themeColor: getMeta('theme-color') || getMeta('msapplication-TileColor') || null,
      favicon: getFavicon()
    };

    // Résoudre les URLs relatives
    const resolveUrl = (relativeUrl) => {
      if (!relativeUrl) return null;
      if (relativeUrl.startsWith('http')) return relativeUrl;
      try {
        return new URL(relativeUrl, url).href;
      } catch {
        return null;
      }
    };

    preview.image = resolveUrl(preview.image);
    preview.favicon = resolveUrl(preview.favicon);

    // Ne retourner que si on a au moins un titre ou une description
    if (!preview.title && !preview.description) {
      return res.status(404).json({ error: 'Pas de métadonnées trouvées' });
    }

    // Mettre en cache
    previewCache.set(url, { data: preview, timestamp: Date.now() });

    // Nettoyer le cache périodiquement (garder max 500 entrées)
    if (previewCache.size > 500) {
      const entries = Array.from(previewCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 100).forEach(([key]) => previewCache.delete(key));
    }

    res.json(preview);
  } catch (error) {
    logger.error('Erreur link preview:', error.message);
    res.status(500).json({ error: 'Impossible de récupérer l\'aperçu' });
  }
};
