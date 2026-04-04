const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const { ScannedIngredient } = require('../models/ScanHistory');

// All barcode routes require authentication (needed to save scan history)
router.use(authMiddleware);

// GET /api/barcode/:barcode
// Lookup produit via Open Food Facts (gratuit, sans clé API)
router.get('/:barcode', async (req, res) => {
  const { barcode } = req.params;

  if (!/^\d{8,14}$/.test(barcode)) {
    return res.status(400).json({ success: false, message: 'Code-barres invalide (8 à 14 chiffres attendus)' });
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,quantity,image_front_url,nutriments`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Harmonith/1.0 (contact@harmonith.fr)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Erreur lors de la communication avec la base de données alimentaire' });
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable. Vérifiez le code-barres ou entrez les valeurs manuellement.' });
    }

    const { product } = data;
    const n = product.nutriments || {};

    // Calories : préférer kcal, sinon convertir depuis kJ
    const caloriesPer100g = n['energy-kcal_100g'] != null
      ? Math.round(n['energy-kcal_100g'])
      : n['energy_100g'] != null
        ? Math.round(n['energy_100g'] / 4.184)
        : 0;

    const result = {
      name: product.product_name || '',
      brand: product.brands || '',
      quantity: product.quantity || '',
      imageUrl: product.image_front_url || '',
      per: '100g',
      nutrition: {
        calories: caloriesPer100g,
        proteins: Math.round((n['proteins_100g'] || 0) * 10) / 10,
        carbs:    Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
        fats:     Math.round((n['fat_100g'] || 0) * 10) / 10,
        fiber:    Math.round((n['fiber_100g'] || 0) * 10) / 10,
      },
    };

    // Sauvegarder dans l'historique des scans
    if (req.user?._id) {
      ScannedIngredient.findOneAndUpdate(
        { userId: req.user._id, barcode },
        {
          userId: req.user._id,
          barcode,
          name: result.name,
          brand: result.brand,
          imageUrl: result.imageUrl,
          quantity: result.quantity,
          nutritionPer100g: result.nutrition,
        },
        { upsert: true, new: true }
      ).catch(err => logger.error('Failed to save ingredient scan:', err.message));
    }

    return res.json({ success: true, product: result });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ success: false, message: 'La recherche a pris trop de temps. Réessayez.' });
    }
    logger.error('[BARCODE] Erreur recherche produit:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la recherche du produit' });
  }
});

module.exports = router;
