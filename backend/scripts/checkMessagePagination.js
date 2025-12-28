require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const MatchMessage = require('../models/MatchMessage');

async function checkPagination() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const messageId = '694e9a14fe2286516e9b90c5';
    const conversationId = '694e6a74fe2286516e9b8ec6';

    // Vérifier si le message existe
    const msg = await MatchMessage.findById(messageId);
    console.log('Message exists:', !!msg);
    if (msg) {
      console.log('ConversationId:', msg.conversationId.toString());
      console.log('Created:', msg.createdAt);
      console.log('IsDeleted:', msg.isDeleted);
    } else {
      console.log('❌ Message not found - il a été supprimé!');
    }

    // Compter les messages plus anciens
    const olderMessages = await MatchMessage.countDocuments({
      conversationId,
      _id: { $lt: messageId },
      isDeleted: false
    });
    console.log('\nMessages plus anciens que', messageId, ':', olderMessages);

    // Compter tous les messages de la conversation
    const allMessages = await MatchMessage.countDocuments({
      conversationId,
      isDeleted: false
    });
    console.log('Messages totaux dans la conversation:', allMessages);

    mongoose.connection.close();

  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkPagination();
