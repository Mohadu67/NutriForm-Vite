const axios = require('axios');
const logger = require('../utils/logger.js');


async function verifyCaptcha(req, res, next) {
  const { captchaToken } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (process.env.RECAPTCHA_DISABLED === 'true') {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️ reCAPTCHA désactivé via RECAPTCHA_DISABLED=true');
    }
    return next();
  }

  
  if (!secretKey) {
    logger.warn('⚠️ RECAPTCHA_SECRET_KEY manquante dans .env');
    
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Configuration serveur incorrecte'
      });
    }
    
    logger.info('🔓 Mode dev: reCAPTCHA bypass');
    return next();
  }

  
  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'Token reCAPTCHA manquant'
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: captchaToken
        }
      }
    );

    const { success, score, action } = response.data;

    
    if (!success) {
      return res.status(403).json({
        success: false,
        message: 'Échec de la vérification reCAPTCHA'
      });
    }

    
    
    if (score < 0.5) {
      logger.warn(`⚠️ Score reCAPTCHA faible: ${score} pour action: ${action}`);
      return res.status(403).json({
        success: false,
        message: 'Activité suspecte détectée'
      });
    }

    
    req.recaptchaScore = score;
    next();
  } catch (error) {
    logger.error('Erreur vérification reCAPTCHA:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification anti-bot'
    });
  }
}

module.exports = verifyCaptcha;
