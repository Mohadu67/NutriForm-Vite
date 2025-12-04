const crypto = require('crypto');
const logger = require('./logger');

// Algorithme de chiffrement : AES-256-GCM (sécurisé et performant)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Générer une clé de chiffrement depuis une passphrase
 * Utilise PBKDF2 pour dériver une clé de 256 bits
 */
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET;

  if (!secret) {
    logger.error('❌ ENCRYPTION_SECRET non défini dans .env');
    throw new Error('ENCRYPTION_SECRET manquant');
  }

  // Utiliser une salt fixe dérivée du secret pour la consistance
  // En production, on pourrait utiliser une salt par environnement
  const salt = crypto.createHash('sha256').update(secret).digest('hex').substring(0, 16);

  // Dériver une clé de 256 bits avec PBKDF2
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Chiffrer un message
 * @param {string} text - Texte à chiffrer
 * @returns {object} { encrypted, iv, authTag } - Données chiffrées
 */
function encrypt(text) {
  if (!text) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Erreur lors du chiffrement:', error);
    throw new Error('Échec du chiffrement');
  }
}

/**
 * Déchiffrer un message
 * @param {string} encrypted - Texte chiffré (hex)
 * @param {string} ivHex - IV en hexadécimal
 * @param {string} authTagHex - Auth tag en hexadécimal
 * @returns {string} - Texte déchiffré
 */
function decrypt(encrypted, ivHex, authTagHex) {
  if (!encrypted || !ivHex || !authTagHex) return null;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Erreur lors du déchiffrement:', error);
    // Retourner un message d'erreur au lieu de crash
    return '[Message chiffré - impossible de déchiffrer]';
  }
}

/**
 * Tester le chiffrement/déchiffrement
 */
function testEncryption() {
  try {
    const testMessage = 'Hello World! 🔒';
    logger.info('Test chiffrement/déchiffrement...');

    const { encrypted, iv, authTag } = encrypt(testMessage);
    logger.info('✅ Chiffrement OK');

    const decrypted = decrypt(encrypted, iv, authTag);
    logger.info('✅ Déchiffrement OK');

    if (decrypted === testMessage) {
      logger.info('✅ Test de chiffrement réussi!');
      return true;
    } else {
      logger.error('❌ Le message déchiffré ne correspond pas');
      return false;
    }
  } catch (error) {
    logger.error('❌ Test de chiffrement échoué:', error);
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  testEncryption
};
