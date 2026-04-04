const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { ScannedPlat } = require('../models/ScanHistory');

let visionModel = null;

function initVision() {
  if (visionModel) return true;
  if (!process.env.GEMINI_API_KEY) return false;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    return true;
  } catch (err) {
    logger.error('Failed to init Gemini Vision:', err.message);
    return false;
  }
}

initVision();

const PROMPT = `Tu es un expert nutritionniste. Analyse cette photo d'aliment et retourne UNIQUEMENT un JSON valide (pas de markdown, pas de texte autour).

Format attendu :
{
  "name": "nom de l'aliment en français",
  "confidence": 0.95,
  "nutrition": {
    "calories": 52,
    "proteins": 0.3,
    "carbs": 14,
    "fats": 0.2,
    "fiber": 2.4
  },
  "defaultPortionG": 150,
  "portionDescription": "1 pomme moyenne"
}

Règles :
- "nutrition" = valeurs pour 100g
- "defaultPortionG" = portion typique en grammes
- "portionDescription" = description de la portion par défaut
- "confidence" = entre 0 et 1, ta certitude sur l'identification
- Si tu ne reconnais pas l'aliment, retourne : {"error": "Aliment non reconnu", "confidence": 0}
- Retourne UNIQUEMENT le JSON, rien d'autre`;

/**
 * POST /api/food-recognize
 * Body: { image: "data:image/jpeg;base64,..." }
 */
exports.recognizeFood = async (req, res) => {
  try {
    if (!visionModel) {
      initVision();
      if (!visionModel) {
        return res.status(503).json({ success: false, error: 'Service IA non disponible' });
      }
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image requise' });
    }

    // Extract base64 data from data URL
    const match = image.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/i);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Format image invalide (data URL base64 attendu)' });
    }

    const mimeType = `image/${match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()}`;
    const base64Data = match[2];

    const result = await visionModel.generateContent([
      PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);

    if (parsed.error) {
      return res.status(404).json({ success: false, error: parsed.error });
    }

    const product = {
      name: parsed.name,
      brand: null,
      quantity: parsed.portionDescription || `${parsed.defaultPortionG || 100}g`,
      imageUrl: null,
      nutrition: parsed.nutrition,
      defaultPortionG: parsed.defaultPortionG || 100,
      confidence: parsed.confidence || 0.5,
      source: 'gemini-vision',
    };

    // Sauvegarder dans l'historique des scans
    try {
      await ScannedPlat.create({
        userId: req.user._id,
        name: parsed.name,
        source: 'ai_vision',
        confidence: parsed.confidence || 0.5,
        portionG: parsed.defaultPortionG || 100,
        portionDescription: parsed.portionDescription || null,
        nutrition: parsed.nutrition,
      });
    } catch (saveErr) {
      logger.error('Failed to save scan history:', saveErr.message);
    }

    res.json({ success: true, product });
  } catch (err) {
    logger.error('Food recognition error:', err.message);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ success: false, error: 'Erreur de parsing de la réponse IA' });
    }
    res.status(500).json({ success: false, error: 'Erreur lors de la reconnaissance' });
  }
};
