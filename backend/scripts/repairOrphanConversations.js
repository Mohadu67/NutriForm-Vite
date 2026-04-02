/**
 * Script de réparation : conversations orphelines post-migration BDD
 *
 * Problème : lors de la fusion de 2 BDD, des documents Match ont été perdus
 * mais les Conversations et Messages sont restés. Résultat :
 * - Des conversations existent sans Match correspondant
 * - Les users voient les conv mais pas les matchs
 * - Re-liker risque de créer des doublons
 *
 * Ce script :
 * 1. Trouve les conversations avec un matchId qui n'existe plus
 * 2. Fusionne les doublons de conversations entre mêmes participants
 * 3. Recréé/met à jour un Match mutuel pour chaque conversation orpheline
 * 4. Rattache la conversation au Match
 *
 * Usage : node scripts/repairOrphanConversations.js [--dry-run]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const MatchMessage = require('../models/MatchMessage');
const UserProfile = require('../models/UserProfile');

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  console.log(`\n🔧 Réparation des conversations orphelines ${DRY_RUN ? '(DRY RUN)' : ''}\n`);

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('✅ Connecté à MongoDB\n');

  // ── Étape 1 : Fusionner les doublons de conversations ──────────────

  console.log('=== ÉTAPE 1 : Fusion des doublons de conversations ===\n');

  const allConvs = await Conversation.find({ isActive: true });
  const convsByPair = {};

  for (const conv of allConvs) {
    if (conv.participants.length !== 2) continue;
    const key = conv.participants.map(p => p.toString()).sort().join('-');
    if (!convsByPair[key]) convsByPair[key] = [];
    convsByPair[key].push(conv);
  }

  let mergedCount = 0;
  for (const [key, convList] of Object.entries(convsByPair)) {
    if (convList.length <= 1) continue;

    // Garder la conversation la plus récente (dernier message le plus récent)
    // Prioriser les convs avec des messages, puis par date du dernier message
    convList.sort((a, b) => {
      const aHasMsg = a.lastMessage?.content ? 1 : 0;
      const bHasMsg = b.lastMessage?.content ? 1 : 0;
      if (aHasMsg !== bHasMsg) return bHasMsg - aHasMsg; // convs avec messages en premier
      const dateA = a.lastMessage?.timestamp || a.createdAt;
      const dateB = b.lastMessage?.timestamp || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    const keeper = convList[0];
    const toMerge = convList.slice(1);

    console.log(`📎 Doublon: ${key}`);
    console.log(`   Gardée: ${keeper._id} (dernier msg: ${keeper.lastMessage?.content?.substring(0, 30) || '(vide)'})`);

    for (const dup of toMerge) {
      console.log(`   Fusionnée: ${dup._id} (dernier msg: ${dup.lastMessage?.content?.substring(0, 30) || '(vide)'})`);

      if (!DRY_RUN) {
        // Déplacer les messages de la conv dupliquée vers la gardée
        const moved = await MatchMessage.updateMany(
          { conversationId: dup._id },
          { $set: { conversationId: keeper._id } }
        );
        console.log(`   → ${moved.modifiedCount} messages déplacés`);

        // Désactiver la conv dupliquée et retirer matchId (sparse unique index)
        await Conversation.updateOne(
          { _id: dup._id },
          { $set: { isActive: false }, $unset: { matchId: '' } }
        );
      }
      mergedCount++;
    }
  }

  console.log(`\n✅ ${mergedCount} conversations fusionnées\n`);

  // ── Étape 2 : Réparer les conversations orphelines ─────────────────

  console.log('=== ÉTAPE 2 : Réparation des conversations orphelines ===\n');

  // Re-fetch après fusion pour ne traiter que les convs encore actives
  const activeConvs = await Conversation.find({ isActive: true, matchId: { $ne: null } });
  let orphanCount = 0;
  let repairedCount = 0;

  for (const conv of activeConvs) {
    const match = await Match.findById(conv.matchId);
    if (match) continue; // Match existe, OK

    orphanCount++;
    const [user1Id, user2Id] = conv.participants;

    console.log(`❌ Orpheline: ${conv._id} (participants: ${user1Id} ↔ ${user2Id})`);

    // Chercher un match existant entre ces deux users
    const existingMatch = await Match.findOne({
      $or: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id }
      ]
    });

    if (existingMatch) {
      console.log(`   Match existant: ${existingMatch._id} (status: ${existingMatch.status})`);

      if (!DRY_RUN) {
        // Mettre le match en mutual avec les 2 likes
        existingMatch.status = 'mutual';
        existingMatch.rejectedBy = null;
        existingMatch.likedBy = [existingMatch.user1Id, existingMatch.user2Id];
        existingMatch.conversationId = conv._id;
        await existingMatch.save();

        conv.matchId = existingMatch._id;
        await conv.save();

        console.log(`   ✅ Match mis à jour en mutual + conv rattachée`);
      }
      repairedCount++;
    } else {
      // Créer un nouveau match mutuel
      console.log(`   Aucun match existant, création...`);

      if (!DRY_RUN) {
        const { calculateMatchScore } = require('../services/matchingAlgorithm.service');
        const [profile1, profile2] = await Promise.all([
          UserProfile.findOne({ userId: user1Id }),
          UserProfile.findOne({ userId: user2Id })
        ]);

        let matchScore = 50;
        let scoreBreakdown = {};
        let distance = 0;

        if (profile1 && profile2) {
          const score = calculateMatchScore(profile1, profile2);
          matchScore = score.total;
          scoreBreakdown = score.breakdown;
          try {
            const d = profile1.distanceTo(profile2);
            if (d !== null) distance = parseFloat(d.toFixed(2));
          } catch (e) { /* pas de coordonnées */ }
        }

        const newMatch = new Match({
          user1Id,
          user2Id,
          matchScore,
          scoreBreakdown,
          distance,
          likedBy: [user1Id, user2Id],
          status: 'mutual',
          conversationId: conv._id
        });
        await newMatch.save();

        conv.matchId = newMatch._id;
        await conv.save();

        console.log(`   ✅ Nouveau Match: ${newMatch._id} (score: ${matchScore})`);
      }
      repairedCount++;
    }
  }

  // ── Résumé ─────────────────────────────────────────────────────────

  console.log(`\n📊 Résumé:`);
  console.log(`   Conversations actives analysées: ${activeConvs.length}`);
  console.log(`   Doublons fusionnés: ${mergedCount}`);
  console.log(`   Orphelines trouvées: ${orphanCount}`);
  console.log(`   Réparées: ${repairedCount}`);

  if (DRY_RUN) {
    console.log(`\n⚠️  Mode DRY RUN — aucune modification appliquée`);
    console.log(`   Relancez sans --dry-run pour appliquer les corrections\n`);
  }

  // Vérification finale
  if (!DRY_RUN) {
    const finalMutual = await Match.countDocuments({ status: 'mutual' });
    const finalOrphans = await Conversation.find({ isActive: true, matchId: { $ne: null } });
    let stillOrphan = 0;
    for (const c of finalOrphans) {
      const m = await Match.findById(c.matchId);
      if (!m) stillOrphan++;
    }
    console.log(`\n✅ Vérification finale:`);
    console.log(`   Matches mutuels: ${finalMutual}`);
    console.log(`   Conversations encore orphelines: ${stillOrphan}`);
  }

  await mongoose.disconnect();
  console.log('✅ Déconnecté de MongoDB\n');
}

run().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
