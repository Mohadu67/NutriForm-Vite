const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const logger = require('../utils/logger.js');

// Configurer jsdom pour simuler un environnement navigateur
if (typeof window === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };

  // Copier les propriétés essentielles de window vers global
  Object.keys(dom.window).forEach((key) => {
    if (!(key in global)) {
      global[key] = dom.window[key];
    }
  });

  logger.info('✅ jsdom configuré pour SSR');
}

// Chemin vers le build frontend
const clientDistPath = path.join(__dirname, '../../frontend/dist');
const serverDistPath = path.join(__dirname, '../../frontend/dist/server');
const templatePath = path.join(clientDistPath, 'index.html');

let template;
let render;

// Charger le template HTML et la fonction de rendu SSR
async function initSSR() {
  try {
    // Lire le template HTML
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
      logger.info('✅ Template HTML chargé');
    } else {
      logger.warn('⚠️  Template HTML non trouvé, SSR désactivé');
      return false;
    }

    // Charger le module SSR
    const serverEntryPath = path.join(serverDistPath, 'entry-server.js');
    if (fs.existsSync(serverEntryPath)) {
      logger.info(`📍 Chargement du module SSR depuis: ${serverEntryPath}`);
      const { render: renderFn } = await import(serverEntryPath);
      render = renderFn;
      logger.info('✅ Module SSR chargé');
      return true;
    } else {
      logger.warn('⚠️  Module SSR non trouvé, SSR désactivé');
      return false;
    }
  } catch (error) {
    logger.error('❌ Erreur lors du chargement SSR:', error.message);
    logger.error('Stack:', error.stack);
    return false;
  }
}

// Middleware SSR
function ssrMiddleware() {
  // Routes qui doivent être rendues côté serveur
  const ssrRoutes = [
    '/',
    '/imc',
    '/calorie',
    '/exo',
    '/outils',
    '/about',
    '/contact',
    '/leaderboard',
    '/recettes'
  ];

  return async (req, res, next) => {
    // Vérifier si la route doit être rendue côté serveur
    const isSSRRoute = ssrRoutes.some(route => {
      if (route === '/') {
        return req.path === '/';
      }
      return req.path.startsWith(route);
    });

    if (!isSSRRoute) {
      return next();
    }

    // Si SSR n'est pas initialisé, servir le template de base
    if (!template || !render) {
      if (template) {
        return res.send(template);
      }
      return next();
    }

    try {
      // Context pour react-helmet
      const context = { helmet: {} };

      // Rendre l'application React côté serveur
      const { html, helmet } = render(req.url, context);

      // Injecter le HTML et les meta tags dans le template
      let finalHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>`
      );

      // Injecter les balises helmet si disponibles
      if (helmet) {
        if (helmet.title) {
          finalHtml = finalHtml.replace(
            /<title>.*?<\/title>/,
            helmet.title.toString()
          );
        }
        if (helmet.meta) {
          finalHtml = finalHtml.replace(
            '</head>',
            `${helmet.meta.toString()}</head>`
          );
        }
        if (helmet.link) {
          finalHtml = finalHtml.replace(
            '</head>',
            `${helmet.link.toString()}</head>`
          );
        }
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(finalHtml);
    } catch (error) {
      logger.error('❌ Erreur SSR:', error.message);
      // En cas d'erreur, servir le template de base
      if (template) {
        res.send(template);
      } else {
        next(error);
      }
    }
  };
}

module.exports = { initSSR, ssrMiddleware };
