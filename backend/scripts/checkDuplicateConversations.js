require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Match = require('../models/Match');
const User = require('../models/User');

/**
 * Script pour détecter les conversations en double
 */
async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les conversations
    const conversations = await Conversation.find({})
      .populate('participants', 'pseudo')
      .populate('matchId')
      .lean();

    console.log(`\n📊 Total conversations: ${conversations.length}\n`);

    // Grouper les conversations par paires de participants
    const conversationsByParticipants = new Map();

    for (const conv of conversations) {
      if (!conv.participants || conv.participants.length !== 2) {
        console.log(`⚠️  Conversation ${conv._id} a ${conv.participants?.length || 0} participants`);
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

    // Trouver les doublons
    let duplicatesFound = false;
    for (const [key, convs] of conversationsByParticipants.entries()) {
      if (convs.length > 1) {
        duplicatesFound = true;
        console.log(`\n🔴 DOUBLON TROUVÉ pour la paire ${key}:`);
        console.log(`   ${convs.length} conversations trouvées:\n`);

        for (const conv of convs) {
          console.log(`   📝 Conversation ID: ${conv._id}`);
          console.log(`      Match ID: ${conv.matchId?._id || 'N/A'}`);
          console.log(`      Participants: ${conv.participants.map(p => p.pseudo).join(' <-> ')}`);
          console.log(`      Active: ${conv.isActive}`);
          console.log(`      Hidden by: ${conv.hiddenBy?.length || 0} users`);
          console.log(`      Derniere activité: ${conv.lastMessage?.timestamp || conv.createdAt}`);
          console.log(`      Créée le: ${conv.createdAt}`);
          console.log('');
        }

        // Suggestion de résolution
        const sortedByDate = convs.sort((a, b) =>
          new Date(b.lastMessage?.timestamp || b.createdAt) -
          new Date(a.lastMessage?.timestamp || a.createdAt)
        );

        console.log(`   💡 Suggestion: Garder la conversation ${sortedByDate[0]._id} (la plus récente)`);
        console.log(`      et supprimer les autres:\n`);
        for (let i = 1; i < sortedByDate.length; i++) {
          console.log(`      - ${sortedByDate[i]._id}`);
        }
        console.log('');
      }
    }

    if (!duplicatesFound) {
      console.log('✅ Aucun doublon détecté\n');
    }

    // Vérifier aussi les matchs en double pour la même paire
    console.log('\n📊 Vérification des Matches...\n');
    const matches = await Match.find({ status: 'mutual' })
      .lean();

    const matchesByParticipants = new Map();
    for (const match of matches) {
      const [p1, p2] = [match.user1Id.toString(), match.user2Id.toString()].sort();
      const key = `${p1}-${p2}`;

      if (!matchesByParticipants.has(key)) {
        matchesByParticipants.set(key, []);
      }
      matchesByParticipants.get(key).push(match);
    }

    let matchDuplicatesFound = false;
    for (const [key, mtchs] of matchesByParticipants.entries()) {
      if (mtchs.length > 1) {
        matchDuplicatesFound = true;
        console.log(`\n🔴 MATCHES EN DOUBLE pour la paire ${key}:`);
        console.log(`   ${mtchs.length} matches trouvés:\n`);

        for (const m of mtchs) {
          console.log(`   Match ID: ${m._id}, créé le ${m.createdAt}`);
        }
      }
    }

    if (!matchDuplicatesFound) {
      console.log('✅ Aucun match en double\n');
    }

    mongoose.connection.close();
    console.log('\n✅ Analyse terminée');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkDuplicates();
