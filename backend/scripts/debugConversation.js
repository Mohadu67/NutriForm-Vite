require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const MatchMessage = require('../models/MatchMessage');
const User = require('../models/User');

/**
 * Script pour débugger une conversation spécifique
 */
async function debugConversation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Trouver les utilisateurs nono et moha
    const nono = await User.findOne({ pseudo: 'nono' }).select('_id pseudo');
    const moha = await User.findOne({ pseudo: 'moha' }).select('_id pseudo');

    if (!nono || !moha) {
      console.log('❌ Utilisateurs non trouvés');
      return;
    }

    console.log(`👤 nono ID: ${nono._id}`);
    console.log(`👤 moha ID: ${moha._id}\n`);

    // Trouver la conversation
    const conv = await Conversation.findOne({
      participants: { $all: [nono._id, moha._id] }
    });

    if (!conv) {
      console.log('❌ Aucune conversation trouvée entre nono et moha');
      return;
    }

    console.log(`💬 Conversation trouvée: ${conv._id}`);
    console.log(`   Match ID: ${conv.matchId}`);
    console.log(`   Participants: ${conv.participants.map(p => p.toString())}`);
    console.log(`   isActive: ${conv.isActive}`);
    console.log(`   isBlocked: ${conv.isBlocked}`);
    console.log(`   hiddenBy: ${conv.hiddenBy?.length || 0} user(s) - ${JSON.stringify(conv.hiddenBy || [])}`);
    console.log(`   Créée le: ${conv.createdAt}`);
    console.log(`   Dernière MAJ: ${conv.updatedAt}\n`);

    // Vérifier si cachée pour chaque user
    console.log(`   🔍 Cachée pour nono (${nono._id})? ${conv.isHiddenForUser(nono._id)}`);
    console.log(`   🔍 Cachée pour moha (${moha._id})? ${conv.isHiddenForUser(moha._id)}\n`);

    // Compter les messages
    const totalMessages = await MatchMessage.countDocuments({ conversationId: conv._id, isDeleted: false });
    console.log(`📨 Messages totaux: ${totalMessages}`);

    const messagesFromNono = await MatchMessage.countDocuments({
      conversationId: conv._id,
      senderId: nono._id,
      isDeleted: false
    });

    const messagesFromMoha = await MatchMessage.countDocuments({
      conversationId: conv._id,
      senderId: moha._id,
      isDeleted: false
    });

    console.log(`   - De nono → moha: ${messagesFromNono}`);
    console.log(`   - De moha → nono: ${messagesFromMoha}\n`);

    // Afficher les derniers messages
    const lastMessages = await MatchMessage.find({ conversationId: conv._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`📋 Derniers messages (5):\n`);
    for (const msg of lastMessages.reverse()) {
      const sender = msg.senderId.toString() === nono._id.toString() ? 'nono' : 'moha';
      const receiver = msg.receiverId.toString() === nono._id.toString() ? 'nono' : 'moha';
      console.log(`   [${new Date(msg.createdAt).toLocaleTimeString()}] ${sender} → ${receiver}`);
      console.log(`      Content: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      console.log(`      Read: ${msg.read}`);
      console.log(`      Deleted by: ${msg.deletedBy?.length || 0} user(s)`);
      console.log('');
    }

    // Vérifier le unreadCount
    console.log(`📊 Compteurs de messages non lus:`);
    console.log(`   - Pour nono: ${conv.unreadCount?.get(nono._id.toString()) || 0}`);
    console.log(`   - Pour moha: ${conv.unreadCount?.get(moha._id.toString()) || 0}\n`);

    // Vérifier si la conversation apparaîtrait dans la liste de chaque user
    const nonoConvs = await Conversation.find({
      participants: nono._id,
      isActive: true,
      hiddenBy: { $ne: nono._id }
    }).countDocuments();

    const mohaConvs = await Conversation.find({
      participants: moha._id,
      isActive: true,
      hiddenBy: { $ne: moha._id }
    }).countDocuments();

    console.log(`📱 Conversations visibles:`);
    console.log(`   - Pour nono: ${nonoConvs} conversation(s)`);
    console.log(`   - Pour moha: ${mohaConvs} conversation(s)\n`);

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugConversation();
