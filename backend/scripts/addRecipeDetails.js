const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
require('dotenv').config();

async function addRecipeDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update the Smoothie Bowl recipe
    const smoothieBowl = await Recipe.findOne({ slug: 'smoothie-bowl-energetique' });

    if (smoothieBowl) {
      smoothieBowl.ingredients = [
        { name: 'Banane congelée', quantity: 1, unit: 'pièce', optional: false },
        { name: 'Fraises congelées', quantity: 100, unit: 'g', optional: false },
        { name: 'Lait d\'amande', quantity: 100, unit: 'ml', optional: false },
        { name: 'Protéine en poudre vanille', quantity: 30, unit: 'g', optional: false },
        { name: 'Graines de chia', quantity: 1, unit: 'c. à soupe', optional: false },
        { name: 'Fruits frais (fraises, myrtilles)', quantity: 50, unit: 'g', optional: false },
        { name: 'Granola', quantity: 30, unit: 'g', optional: false },
        { name: 'Beurre d\'amande', quantity: 1, unit: 'c. à soupe', optional: true },
        { name: 'Noix de coco râpée', quantity: 10, unit: 'g', optional: true },
      ];

      smoothieBowl.instructions = [
        'Dans un blender, mixez la banane congelée, les fraises congelées, le lait d\'amande et la protéine en poudre jusqu\'à obtenir une texture lisse et crémeuse.',
        'Versez le smoothie dans un bol.',
        'Disposez harmonieusement les fruits frais, le granola, les graines de chia et la noix de coco râpée sur le dessus.',
        'Ajoutez une cuillère de beurre d\'amande au centre si désiré.',
        'Dégustez immédiatement pour profiter de la texture glacée et crémeuse.',
      ];

      await smoothieBowl.save();
      console.log('✅ Smoothie Bowl updated with ingredients and instructions');
    }

    // Update the Bowl Protéiné recipe
    const proteinBowl = await Recipe.findOne({ slug: 'bowl-proteine-champion' });

    if (proteinBowl) {
      proteinBowl.ingredients = [
        { name: 'Quinoa cuit', quantity: 150, unit: 'g', optional: false },
        { name: 'Blanc de poulet grillé', quantity: 150, unit: 'g', optional: false },
        { name: 'Avocat', quantity: 0.5, unit: 'pièce', optional: false },
        { name: 'Tomates cerises', quantity: 100, unit: 'g', optional: false },
        { name: 'Concombre', quantity: 100, unit: 'g', optional: false },
        { name: 'Pois chiches rôtis', quantity: 50, unit: 'g', optional: false },
        { name: 'Graines de sésame', quantity: 1, unit: 'c. à café', optional: false },
        { name: 'Huile d\'olive', quantity: 1, unit: 'c. à soupe', optional: false },
        { name: 'Jus de citron', quantity: 1, unit: 'c. à soupe', optional: false },
        { name: 'Sel et poivre', quantity: 1, unit: 'pincée', optional: false },
      ];

      proteinBowl.instructions = [
        'Faites cuire le quinoa selon les instructions du paquet et laissez-le refroidir.',
        'Assaisonnez le blanc de poulet avec du sel, du poivre et des herbes. Faites-le griller à la poêle pendant 6-8 minutes de chaque côté jusqu\'à cuisson complète.',
        'Pendant ce temps, coupez les tomates cerises en deux et le concombre en dés.',
        'Tranchez l\'avocat finement.',
        'Dans un bol, disposez le quinoa comme base.',
        'Ajoutez le poulet tranché, l\'avocat, les tomates, le concombre et les pois chiches rôtis.',
        'Préparez une vinaigrette en mélangeant l\'huile d\'olive, le jus de citron, le sel et le poivre.',
        'Arrosez le bowl avec la vinaigrette et saupoudrez de graines de sésame.',
        'Servez immédiatement et dégustez !',
      ];

      await proteinBowl.save();
      console.log('✅ Bowl Protéiné updated with ingredients and instructions');
    }

    // Update the Salade César recipe
    const caesar = await Recipe.findOne({ slug: 'salade-cesar-legere-proteinee' });

    if (caesar) {
      caesar.ingredients = [
        { name: 'Laitue romaine', quantity: 200, unit: 'g', optional: false },
        { name: 'Blanc de poulet grillé', quantity: 200, unit: 'g', optional: false },
        { name: 'Parmesan râpé', quantity: 30, unit: 'g', optional: false },
        { name: 'Croûtons maison', quantity: 40, unit: 'g', optional: false },
        { name: 'Yaourt grec 0%', quantity: 100, unit: 'g', optional: false },
        { name: 'Moutarde de Dijon', quantity: 1, unit: 'c. à café', optional: false },
        { name: 'Jus de citron', quantity: 1, unit: 'c. à soupe', optional: false },
        { name: 'Ail en poudre', quantity: 0.5, unit: 'c. à café', optional: false },
        { name: 'Anchois (optionnel)', quantity: 2, unit: 'filets', optional: true },
      ];

      caesar.instructions = [
        'Lavez et essorez la laitue romaine, puis coupez-la en morceaux.',
        'Grillez le blanc de poulet assaisonné pendant 6-7 minutes de chaque côté. Laissez reposer 5 minutes puis tranchez.',
        'Pour la sauce, mélangez le yaourt grec, la moutarde, le jus de citron, l\'ail en poudre et les anchois écrasés si vous en utilisez.',
        'Dans un grand bol, mélangez la laitue avec la sauce César allégée.',
        'Ajoutez le poulet tranché sur le dessus.',
        'Parsemez de parmesan râpé et de croûtons.',
        'Mélangez délicatement juste avant de servir.',
        'Dégustez immédiatement pour que les croûtons restent croustillants.',
      ];

      await caesar.save();
      console.log('✅ Salade César updated with ingredients and instructions');
    }

    console.log('\n✅ All recipes updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addRecipeDetails();
