require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const MatchMessage = require('../models/MatchMessage');
const User = require('../models/User');

async function checkDeletedMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const conversationId = '694e6a74fe2286516e9b8ec6';

    // Trouver les users
    const nono = await User.findOne({ pseudo: 'nono' }).select('_id pseudo');
    const moha = await User.findOne({ pseudo: 'moha' }).select('_id pseudo');

    console.log(`👤 nono ID: ${nono._id}`);
    console.log(`👤 moha ID: ${moha._id}\n`);

    // Compter tous les messages
    const totalMessages = await MatchMessage.countDocuments({
      conversationId,
      isDeleted: false
    });
    console.log(`📨 Messages totaux (isDeleted=false): ${totalMessages}\n`);

    // Vérifier pour nono
    const messagesForNono = await MatchMessage.countDocuments({
      conversationId,
      isDeleted: false,
      deletedBy: { $ne: nono._id }
    });
    console.log(`📨 Messages visibles pour nono: ${messagesForNono}`);

    const messagesDeletedByNono = await MatchMessage.find({
      conversationId,
      deletedBy: nono._id
    }).select('_id content deletedBy').lean();
    console.log(`🗑️  Messages supprimés par nono: ${messagesDeletedByNono.length}`);
    if (messagesDeletedByNono.length > 0) {
      console.log('   IDs:', messagesDeletedByNono.map(m => m._id.toString()));
    }

    // Vérifier pour moha
    const messagesForMoha = await MatchMessage.countDocuments({
      conversationId,
      isDeleted: false,
      deletedBy: { $ne: moha._id }
    });
    console.log(`\n📨 Messages visibles pour moha: ${messagesForMoha}`);

    const messagesDeletedByMoha = await MatchMessage.find({
      conversationId,
      deletedBy: moha._id
    }).select('_id content deletedBy').lean();
    console.log(`🗑️  Messages supprimés par moha: ${messagesDeletedByMoha.length}`);
    if (messagesDeletedByMoha.length > 0) {
      console.log('   IDs:', messagesDeletedByMoha.map(m => m._id.toString()));
    }

    // Afficher quelques messages avec leur deletedBy
    console.log('\n📋 Détails des 5 derniers messages:\n');
    const recentMessages = await MatchMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    for (const msg of recentMessages) {
      console.log(`   Message ${msg._id}:`);
      console.log(`      Content: ${msg.content.substring(0, 20)}`);
      console.log(`      isDeleted: ${msg.isDeleted}`);
      console.log(`      deletedBy: ${JSON.stringify(msg.deletedBy || [])}`);
      console.log('');
    }

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkDeletedMessages();
