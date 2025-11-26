#!/usr/bin/env node
/**
 * Vérifie que le fichier _headers contient bien la bonne CSP
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../src/shared/utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const headersPath = join(__dirname, '../dist/_headers');

logger.info('🔍 Vérification du fichier _headers...');

if (!existsSync(headersPath)) {
  logger.error('❌ ERREUR: Le fichier dist/_headers n\'existe pas !');
  logger.error('   Le fichier public/_headers n\'a pas été copié lors du build.');
  process.exit(1);
}

const content = readFileSync(headersPath, 'utf8');

// Vérifier que api.harmonith.fr est présent
if (content.includes('https://api.harmonith.fr')) {
  logger.info('✅ CSP correcte : api.harmonith.fr est autorisé');
} else {
  logger.error('❌ ERREUR: api.harmonith.fr n\'est PAS dans la CSP !');
  logger.error('   Contenu actuel:', content.substring(0, 500));
  process.exit(1);
}

// Vérifier que nutriform-vite.onrender.com n'est PAS présent
if (content.includes('nutriform-vite.onrender.com')) {
  logger.error('⚠️  ATTENTION: L\'ancienne URL nutriform-vite.onrender.com est toujours présente !');
  process.exit(1);
}

logger.info('✅ Fichier _headers validé avec succès !');
