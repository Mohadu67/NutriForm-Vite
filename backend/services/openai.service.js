const OpenAI = require('openai');
const logger = require('../utils/logger');
const { SYSTEM_PROMPT } = require('../constants/chatPrompts');

// Instance OpenAI (null si pas de cle API)
let openaiClient = null;

/**
 * Initialiser le client OpenAI
 * @returns {boolean} - true si initialise avec succes
 */
function initializeOpenAI() {
  if (openaiClient) return true;

  if (!process.env.OPENAI_API_KEY) {
    logger.info('OpenAI API key not configured - using fallback responses');
    return false;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    logger.info('OpenAI client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize OpenAI client:', error.message);
    return false;
  }
}

/**
 * Verifier si OpenAI est disponible
 * @returns {boolean}
 */
function isAvailable() {
  return !!openaiClient;
}

/**
 * Generer une reponse avec OpenAI
 * @param {string} userMessage - Message de l'utilisateur
 * @param {Array} conversationHistory - Historique de la conversation (optionnel)
 * @returns {Promise<{content: string, confidence: number}>}
 */
async function generateResponse(userMessage, conversationHistory = []) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    // Construire les messages pour l'API
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Ajouter l'historique de conversation (limite aux 10 derniers messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'bot' ? 'assistant' : msg.role,
        content: msg.content
      });
    }

    // Ajouter le message actuel
    messages.push({ role: 'user', content: userMessage });

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';

    // Calculer un score de confiance base sur la longueur et la coherence
    const confidence = calculateConfidence(response, userMessage);

    return {
      content: response,
      confidence
    };
  } catch (error) {
    logger.error('OpenAI API error:', error.message);
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

  // Verifier si la reponse mentionne l'escalade
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
initializeOpenAI();

module.exports = {
  initializeOpenAI,
  isAvailable,
  generateResponse,
  shouldEscalate
};
