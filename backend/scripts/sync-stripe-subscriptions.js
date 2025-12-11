/**
 * Script pour synchroniser les abonnements Stripe avec MongoDB
 * Usage: node scripts/sync-stripe-subscriptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Modèles
const Subscription = require('../models/Subscription');
const User = require('../models/User');

async function syncSubscriptions() {
  console.log('🔄 Synchronisation des abonnements Stripe...\n');

  try {
    // Connexion MongoDB - s'assurer que la DB nutriform est utilisée
    let uri = process.env.MONGODB_URI;
    if (!uri.includes('/nutriform')) {
      uri = uri.replace('mongodb.net/', 'mongodb.net/nutriform');
      if (uri.includes('?')) {
        uri = uri.replace('?', '?');
      }
    }
    await mongoose.connect(uri, { dbName: 'nutriform' });
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les subscriptions en DB
    const subscriptions = await Subscription.find({});
    console.log(`📊 ${subscriptions.length} abonnements trouvés en DB\n`);

    let updated = 0;
    let errors = 0;

    for (const sub of subscriptions) {
      try {
        console.log(`\n--- Vérification: ${sub.stripeSubscriptionId} ---`);

        // Récupérer l'état réel sur Stripe
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

        console.log(`  Stripe status: ${stripeSub.status}`);
        console.log(`  DB status: ${sub.status}`);
        console.log(`  Trial end: ${stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : 'N/A'}`);

        // Déterminer le nouveau tier
        const newTier = ['active', 'trialing'].includes(stripeSub.status) ? 'premium' : 'free';

        // Mettre à jour la subscription en DB
        sub.status = stripeSub.status;
        sub.currentPeriodStart = stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000)
          : null;
        sub.currentPeriodEnd = stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null;
        sub.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
        sub.canceledAt = stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000)
          : null;

        await sub.save();

        // Mettre à jour le User
        await User.findByIdAndUpdate(sub.userId, {
          subscriptionTier: newTier
        });

        console.log(`  ✅ Mis à jour: status=${stripeSub.status}, tier=${newTier}`);
        updated++;

      } catch (err) {
        // Si l'abonnement n'existe plus sur Stripe
        if (err.code === 'resource_missing') {
          console.log(`  ⚠️ Abonnement non trouvé sur Stripe - Passage en free`);

          sub.status = 'canceled';
          sub.canceledAt = new Date();
          await sub.save();

          await User.findByIdAndUpdate(sub.userId, {
            subscriptionTier: 'free'
          });

          updated++;
        } else {
          console.log(`  ❌ Erreur: ${err.message}`);
          errors++;
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ Synchronisation terminée`);
    console.log(`   - Mis à jour: ${updated}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('❌ Erreur fatale:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

syncSubscriptions();
