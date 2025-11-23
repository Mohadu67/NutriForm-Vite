#!/usr/bin/env node
/**
 * Vérifie que le fichier _headers contient bien la bonne CSP
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const headersPath = join(__dirname, '../dist/_headers');

console.log('🔍 Vérification du fichier _headers...');

if (!existsSync(headersPath)) {
  console.error('❌ ERREUR: Le fichier dist/_headers n\'existe pas !');
  console.error('   Le fichier public/_headers n\'a pas été copié lors du build.');
  process.exit(1);
}

const content = readFileSync(headersPath, 'utf8');

// Vérifier que api.harmonith.fr est présent
if (content.includes('https://api.harmonith.fr')) {
  console.log('✅ CSP correcte : api.harmonith.fr est autorisé');
} else {
  console.error('❌ ERREUR: api.harmonith.fr n\'est PAS dans la CSP !');
  console.error('   Contenu actuel:', content.substring(0, 500));
  process.exit(1);
}

// Vérifier que nutriform-vite.onrender.com n'est PAS présent
if (content.includes('nutriform-vite.onrender.com')) {
  console.error('⚠️  ATTENTION: L\'ancienne URL nutriform-vite.onrender.com est toujours présente !');
  process.exit(1);
}

console.log('✅ Fichier _headers validé avec succès !');
