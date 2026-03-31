const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { buildSystemPrompt } = require('../constants/chatPrompts');

// Instance Gemini (null si pas de cle API)
let geminiModel = null;

/**
 * Initialiser le client Gemini
 * @returns {boolean} - true si initialise avec succes
 */
function initializeAI() {
  if (geminiModel) return true;

  if (!process.env.GEMINI_API_KEY) {
    logger.info('Gemini API key not configured - using fallback responses');
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    logger.info('Gemini client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Gemini client:', error.message);
    return false;
  }
}

/**
 * Verifier si l'IA est disponible
 * @returns {boolean}
 */
function isAvailable() {
  return !!geminiModel;
}

/**
 * Generer une reponse avec Gemini
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} conversationHistory - Historique de la conversation (optionnel)
 * @param {string} userContext - Contexte utilisateur formaté (optionnel)
 * @returns {Promise<{content: string, confidence: number}>}
 */
async function generateResponse(userMessage, conversationHistory = [], userContext = '') {
  if (!geminiModel) {
    throw new Error('Gemini client not initialized');
  }

  try {
    const systemPrompt = buildSystemPrompt(userContext);

    // Construire l'historique au format Gemini
    const history = [];
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      history.push({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Démarrer un chat avec le system instruction et l'historique
    const chat = geminiModel.startChat({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    const confidence = calculateConfidence(response, userMessage);

    return {
      content: response,
      confidence
    };
  } catch (error) {
    logger.error('Gemini API error:', error.message);
    throw error;
  }
}

/**
 * Calculer un score de confiance pour la reponse
 * @param {string} response - Reponse generee
 * @param {string} userMessage - Message original
 * @returns {number} - Score entre 0 et 1
 */
function calculateConfidence(response, userMessage) {
  if (!response || response.length < 20) return 0.3;
  if (response.length < 50) return 0.5;
  if (response.length < 100) return 0.7;

  const escaladeKeywords = ['support', 'humain', 'agent', 'équipe', 'transférer'];
  const containsEscalade = escaladeKeywords.some(k =>
    response.toLowerCase().includes(k)
  );

  if (containsEscalade) return 0.4;

  return 0.85;
}

/**
 * Detecter si la reponse suggere une escalade vers un humain
 * @param {string} response - Reponse de l'IA
 * @returns {boolean}
 */
function shouldEscalate(response) {
  const escaladePatterns = [
    'mettre en contact',
    'équipe support',
    'conseiller humain',
    'un instant',
    'transférer',
    'escalader'
  ];

  const responseLower = response.toLowerCase();
  return escaladePatterns.some(pattern => responseLower.includes(pattern));
}

// Initialiser au chargement du module
initializeAI();

module.exports = {
  initializeAI,
  isAvailable,
  generateResponse,
  shouldEscalate
};
