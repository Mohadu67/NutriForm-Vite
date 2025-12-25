const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../../frontend/src/components/Exercice/DynamiChoice/BodyPicker/body.svg');
const outputDir = path.join(__dirname, '../src/components/BodyPicker');
const outputFrontPath = path.join(outputDir, 'bodyPathsFront.js');
const outputBackPath = path.join(outputDir, 'bodyPathsBack.js');

const svg = fs.readFileSync(svgPath, 'utf8');

// Les deux corps sont cote a cote dans le SVG original:
// - Corps de face (FRONT): X de ~25 a ~230
// - Corps de dos (BACK): X de ~330 a ~520
const FRONT_MAX_X = 260;  // Tout path avec X < 260 est front
const BACK_MIN_X = 310;   // Tout path avec X > 310 est back

// Offset pour translater le corps de dos vers l'origine (meme position que front)
const BACK_TRANSLATE_X = -295; // Decale de 295px vers la gauche

// Fonction pour obtenir la position X d'un path
function getPathX(d) {
  const mMatch = d.match(/M\s*([\d.]+),([\d.]+)/);
  if (mMatch) {
    return parseFloat(mMatch[1]);
  }
  return 0;
}

// Fonction pour translater toutes les coordonnees X d'un path
function translatePathX(d, offsetX) {
  // Les coordonnees viennent en paires x,y
  // On doit translater uniquement les X (position impaire dans chaque paire)
  let result = '';
  let isXCoord = true; // Alterne entre X et Y
  let i = 0;

  while (i < d.length) {
    const char = d[i];

    // Si c'est une lettre de commande, on reset pour le prochain X
    if (/[MLCSQTAZ]/i.test(char)) {
      result += char;
      isXCoord = true; // Apres une commande, la prochaine valeur est X
      i++;
      continue;
    }

    // Si c'est le debut d'un nombre (chiffre ou signe moins)
    if (/[\d.-]/.test(char)) {
      // Extraire le nombre complet
      let numStr = '';
      while (i < d.length && /[\d.e-]/i.test(d[i]) && !(d[i] === '-' && numStr.length > 0 && !numStr.endsWith('e'))) {
        numStr += d[i];
        i++;
      }

      const num = parseFloat(numStr);
      if (isXCoord && !isNaN(num)) {
        // C'est une coordonnee X, on la translate
        result += (num + offsetX).toFixed(2);
      } else {
        // C'est une coordonnee Y ou autre, on garde tel quel
        result += numStr;
      }
      isXCoord = !isXCoord; // Alterner
      continue;
    }

    // Espaces, virgules, etc.
    result += char;
    i++;
  }

  return result;
}

// Extraire tous les paths
const frontPaths = {};
const backPaths = {};
const regex = /<path[^>]+>/g;
let pathMatch;

while ((pathMatch = regex.exec(svg)) !== null) {
  const pathTag = pathMatch[0];
  const elemMatch = pathTag.match(/data-elem="([^"]+)"/);
  const dMatch = pathTag.match(/d="([^"]+)"/);
  const fillMatch = pathTag.match(/fill="([^"]+)"/);
  const idMatch = pathTag.match(/id="([^"]+)"/);

  if (dMatch) {
    const d = dMatch[1];
    const fill = fillMatch ? fillMatch[1] : '#E8E8E8';
    const id = idMatch ? idMatch[1] : null;
    const strokeMatch = pathTag.match(/stroke="([^"]+)"/);
    const stroke = strokeMatch ? strokeMatch[1] : null;
    const strokeWidthMatch = pathTag.match(/stroke-width="([^"]+)"/);
    const strokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : null;
    const x = getPathX(d);

    if (elemMatch) {
      // Paths avec data-elem = zones musculaires cliquables
      const elem = elemMatch[1];

      // Front: X < FRONT_MAX_X (garder les coordonnees originales)
      if (x < FRONT_MAX_X) {
        if (!frontPaths[elem]) frontPaths[elem] = [];
        frontPaths[elem].push({ d, fill, id, stroke, strokeWidth });
      }

      // Back: X > BACK_MIN_X (translater vers l'origine)
      if (x > BACK_MIN_X) {
        if (!backPaths[elem]) backPaths[elem] = [];
        const translatedD = translatePathX(d, BACK_TRANSLATE_X);
        backPaths[elem].push({ d: translatedD, fill, id, stroke, strokeWidth });
      }
    } else if (id !== 'path14') {
      // Paths decoratifs (tete, mains, pieds) - pas le outline global (path14)
      // Front decorative
      if (x < FRONT_MAX_X) {
        if (!frontPaths['DECORATIVE']) frontPaths['DECORATIVE'] = [];
        frontPaths['DECORATIVE'].push({ d, fill, id, stroke, strokeWidth });
      }
      // Back decorative (translater)
      if (x > BACK_MIN_X) {
        if (!backPaths['DECORATIVE']) backPaths['DECORATIVE'] = [];
        const translatedD = translatePathX(d, BACK_TRANSLATE_X);
        backPaths['DECORATIVE'].push({ d: translatedD, fill, id, stroke, strokeWidth });
      }
    }
  }
}

// Generer le fichier JS
// Les deux corps utilisent maintenant le MEME viewBox car le dos a ete translate
// ViewBox centree: X de 0 a 250 (width 250), height 462 pour centrer le corps
const COMMON_VIEWBOX = "0 0 250 462";

let output = `// Auto-generated from body.svg
// Les paths du dos ont ete translates pour avoir les memes coordonnees que le front

export const SVG_VIEWBOX = "${COMMON_VIEWBOX}";
export const SVG_VIEWBOX_FRONT = "${COMMON_VIEWBOX}";
export const SVG_VIEWBOX_BACK = "${COMMON_VIEWBOX}";

// Mapping des elements SVG vers les zone IDs
export const ELEM_TO_ZONE = {
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'avant-bras',
  CHEST: 'pectoraux',
  SHOULDERS: 'epaules',
  ABDOMINALS: 'abdos-centre',
  OBLIQUES: 'abdos-lateraux',
  TRAPS: 'dos-superieur',
  BACK: 'dos-inferieur',
  GLUTES: 'fessiers',
  QUADRICEPS: 'cuisses-externes',
  HAMSTRINGS: 'cuisses-internes',
  CALVES: 'mollets',
};

// Paths de la vue de face (FRONT)
export const FRONT_PATHS = {
`;

Object.entries(frontPaths).forEach(([elem, pathList]) => {
  output += `  ${elem}: [\n`;
  pathList.forEach((p) => {
    const escapedD = p.d.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    const attrs = [`d: \`${escapedD}\``, `fill: '${p.fill}'`];
    if (p.stroke) attrs.push(`stroke: '${p.stroke}'`);
    if (p.strokeWidth) attrs.push(`strokeWidth: '${p.strokeWidth}'`);
    output += `    { ${attrs.join(', ')} },\n`;
  });
  output += `  ],\n`;
});

output += `};

// Paths de la vue de dos (BACK)
export const BACK_PATHS = {
`;

Object.entries(backPaths).forEach(([elem, pathList]) => {
  output += `  ${elem}: [\n`;
  pathList.forEach((p) => {
    const escapedD = p.d.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    const attrs = [`d: \`${escapedD}\``, `fill: '${p.fill}'`];
    if (p.stroke) attrs.push(`stroke: '${p.stroke}'`);
    if (p.strokeWidth) attrs.push(`strokeWidth: '${p.strokeWidth}'`);
    output += `    { ${attrs.join(', ')} },\n`;
  });
  output += `  ],\n`;
});

output += `};

// Tous les paths combinés (pour compatibilité)
export const BODY_PATHS = { ...FRONT_PATHS, ...BACK_PATHS };
`;

// Ecrire dans un seul fichier pour l'instant (on peut separer plus tard si necessaire)
const outputPath = path.join(outputDir, 'bodyPaths.js');
fs.writeFileSync(outputPath, output);
console.log('Generated:', outputPath);
console.log('Front elements:', Object.keys(frontPaths).join(', '));
console.log('Back elements:', Object.keys(backPaths).join(', '));
