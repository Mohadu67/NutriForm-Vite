const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

/**
 * Setup global avant tous les tests
 * Démarre un serveur MongoDB en mémoire
 */
beforeAll(async () => {
  try {
    // Créer instance MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Déconnecter si déjà connecté
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connecter à MongoDB en mémoire
    await mongoose.connect(mongoUri, {
      dbName: 'nutriform-test',
    });

    console.log('✅ MongoDB Memory Server connecté');
  } catch (error) {
    console.error('❌ Erreur lors du setup MongoDB Memory Server:', error);
    throw error;
  }
}, 60000); // Timeout de 60 secondes pour le setup

/**
 * Cleanup global après tous les tests
 * Ferme les connexions et arrête le serveur
 */
afterAll(async () => {
  try {
    // Fermer la connexion Mongoose
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Arrêter MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ MongoDB Memory Server arrêté');
  } catch (error) {
    console.error('❌ Erreur lors du cleanup MongoDB Memory Server:', error);
    throw error;
  }
}, 60000);

/**
 * Cleanup après chaque test
 * Nettoie toutes les collections pour isolation des tests
 */
afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;

      // Nettoyer toutes les collections
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du cleanup des collections:', error);
    // Ne pas throw pour ne pas bloquer les autres tests
  }
});

// Configuration Jest globale
jest.setTimeout(30000); // 30 secondes par test

// Désactiver les logs pendant les tests (optionnel)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(), // Mock console.log
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Garder error pour le debugging
    error: console.error,
  };
}

module.exports = {
  mongoServer
};
