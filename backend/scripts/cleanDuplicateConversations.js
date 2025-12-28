require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const MatchMessage = require('../models/MatchMessage');

/**
 * Script pour nettoyer les conversations en double
 * Garde la plus récente et supprime l'ancienne
 */
async function cleanDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les conversations
    const conversations = await Conversation.find({})
      .lean();

    console.log(`\n📊 Total conversations: ${conversations.length}\n`);

    // Grouper les conversations par paires de participants
    const conversationsByParticipants = new Map();

    for (const conv of conversations) {
      if (!conv.participants || conv.participants.length !== 2) {
        continue;
      }

      // Créer une clé unique pour cette paire (ordre alphabétique)
      const [p1, p2] = conv.participants
        .map(p => p._id.toString())
        .sort();
      const key = `${p1}-${p2}`;

      if (!conversationsByParticipants.has(key)) {
        conversationsByParticipants.set(key, []);
      }

      conversationsByParticipants.get(key).push(conv);
    }

    // Traiter les doublons
    let cleaned = 0;
    for (const [key, convs] of conversationsByParticipants.entries()) {
      if (convs.length > 1) {
        console.log(`\n🔧 Traitement du doublon pour la paire ${key}:`);
        console.log(`   ${convs.length} conversations trouvées\n`);

        // Trier par date de dernière activité (ou création si pas d'activité)
        const sorted = convs.sort((a, b) => {
          const dateA = new Date(a.lastMessage?.timestamp || a.createdAt);
          const dateB = new Date(b.lastMessage?.timestamp || b.createdAt);
          return dateB - dateA;
        });

        // Garder la première (la plus récente)
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);

        console.log(`   ✅ GARDER: ${toKeep._id} (créée le ${toKeep.createdAt})`);
        console.log(`      - Match ID: ${toKeep.matchId || 'N/A'}`);
        console.log(`      - Dernière activité: ${toKeep.lastMessage?.timestamp || toKeep.createdAt}\n`);

        for (const conv of toDelete) {
          console.log(`   🗑️  SUPPRIMER: ${conv._id} (créée le ${conv.createdAt})`);
          console.log(`      - Match ID: ${conv.matchId || 'N/A'}`);
          console.log(`      - Dernière activité: ${conv.lastMessage?.timestamp || conv.createdAt}`);

          // Compter les messages dans cette conversation
          const messageCount = await MatchMessage.countDocuments({ conversationId: conv._id });
          console.log(`      - Messages: ${messageCount}`);

          // Supprimer la conversation
          await Conversation.findByIdAndDelete(conv._id);
          console.log(`      ✅ Conversation supprimée`);

          // Si elle avait des messages, les supprimer aussi
          if (messageCount > 0) {
            const deleteResult = await MatchMessage.deleteMany({ conversationId: conv._id });
            console.log(`      ✅ ${deleteResult.deletedCount} messages supprimés\n`);
          } else {
            console.log('');
          }

          cleaned++;
        }
      }
    }

    if (cleaned === 0) {
      console.log('✅ Aucun doublon trouvé\n');
    } else {
      console.log(`\n✅ Nettoyage terminé: ${cleaned} conversation(s) en double supprimée(s)\n`);
    }

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanDuplicates();
