const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Créer une session Stripe Checkout avec trial de 7 jours
 * POST /api/subscriptions/create-checkout-session
 */
async function createCheckoutSession(req, res) {
  console.log('🎯 createCheckoutSession appelé pour userId:', req.userId);
  console.log('🔑 Stripe Secret Key:', process.env.STRIPE_SECRET_KEY?.slice(0, 20) + '...' + process.env.STRIPE_SECRET_KEY?.slice(-4));
  console.log('💰 Stripe Price ID:', process.env.STRIPE_PRICE_ID);
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    console.log('👤 User trouvé:', user ? user.email : 'NON TROUVÉ');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(400).json({
        error: 'Vous avez déjà un abonnement actif.',
        subscription: existingSubscription
      });
    }

    // Créer ou récupérer le customer Stripe
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId.toString(),
          pseudo: user.pseudo || '',
          prenom: user.prenom || ''
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Prix ID de Stripe (à configurer dans l'env)
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({
        error: 'Configuration Stripe manquante. Contactez le support.'
      });
    }

    // Créer la session Checkout avec trial de 7 jours
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7, // 7 jours d'essai gratuit
        metadata: {
          userId: userId.toString()
        }
      },
      success_url: `${process.env.FRONTEND_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId.toString()
      }
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Erreur createCheckoutSession:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de la session de paiement.',
      details: error.message
    });
  }
}

/**
 * Gérer les webhooks Stripe
 * POST /api/subscriptions/webhook
 */
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Erreur signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter les événements
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
}

/**
 * Handler: Checkout session complétée
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    console.error('Métadonnées manquantes dans checkout.session.completed');
    return;
  }

  // Récupérer les détails de la subscription depuis Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Créer ou mettre à jour la subscription en DB
  await upsertSubscription(userId, stripeSubscription);

  // Mettre à jour le User tier
  await User.findByIdAndUpdate(userId, {
    subscriptionTier: 'premium',
    trialEndsAt: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null
  });

  console.log(`✅ Abonnement créé pour user ${userId}`);
}

/**
 * Handler: Subscription mise à jour
 */
async function handleSubscriptionUpdated(stripeSubscription) {
  const userId = stripeSubscription.metadata.userId;

  if (!userId) {
    console.error('Métadonnées userId manquantes dans subscription');
    return;
  }

  await upsertSubscription(userId, stripeSubscription);

  // Mettre à jour le tier du User selon le statut
  const tier = ['active', 'trialing'].includes(stripeSubscription.status)
    ? 'premium'
    : 'free';

  await User.findByIdAndUpdate(userId, {
    subscriptionTier: tier,
    trialEndsAt: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null
  });

  console.log(`✅ Abonnement mis à jour pour user ${userId} - Tier: ${tier}`);
}

/**
 * Handler: Subscription supprimée/annulée
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  const userId = stripeSubscription.metadata.userId;

  if (!userId) {
    console.error('Métadonnées userId manquantes');
    return;
  }

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSubscription.id },
    {
      status: 'canceled',
      canceledAt: new Date()
    }
  );

  await User.findByIdAndUpdate(userId, {
    subscriptionTier: 'free'
  });

  console.log(`❌ Abonnement annulé pour user ${userId}`);
}

/**
 * Handler: Paiement réussi
 */
async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = stripeSubscription.metadata.userId;

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      subscriptionTier: 'premium'
    });
    console.log(`✅ Paiement réussi pour user ${userId}`);
  }
}

/**
 * Handler: Paiement échoué
 */
async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = stripeSubscription.metadata.userId;

  if (userId) {
    // Mettre le statut à jour mais ne pas downgrade immédiatement
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { status: 'past_due' }
    );
    console.log(`⚠️ Paiement échoué pour user ${userId}`);
  }
}

/**
 * Créer ou mettre à jour une Subscription en DB
 */
async function upsertSubscription(userId, stripeSubscription) {
  const subscriptionData = {
    userId,
    stripeCustomerId: stripeSubscription.customer,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: stripeSubscription.items.data[0].price.id,
    status: stripeSubscription.status,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    trialStart: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null,
    canceledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : null
  };

  await Subscription.findOneAndUpdate(
    { userId },
    subscriptionData,
    { upsert: true, new: true }
  );
}

/**
 * Récupérer le statut d'abonnement de l'utilisateur
 * GET /api/subscriptions/status
 */
async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(200).json({
        tier: user.subscriptionTier || 'free',
        hasSubscription: false,
        trialEndsAt: user.trialEndsAt || null
      });
    }

    res.status(200).json({
      tier: user.subscriptionTier || 'free',
      hasSubscription: true,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      isInTrial: subscription.isInTrial(),
      trialEnd: subscription.trialEnd
    });
  } catch (error) {
    console.error('Erreur getSubscriptionStatus:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut.' });
  }
}

/**
 * Annuler l'abonnement (à la fin de la période)
 * POST /api/subscriptions/cancel
 */
async function cancelSubscription(req, res) {
  try {
    const userId = req.userId;
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé.' });
    }

    // Annuler sur Stripe (cancel_at_period_end = true)
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Mettre à jour en DB
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.status(200).json({
      message: 'Abonnement annulé. Vous gardez l\'accès Premium jusqu\'à la fin de la période.',
      currentPeriodEnd: subscription.currentPeriodEnd
    });
  } catch (error) {
    console.error('Erreur cancelSubscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation.' });
  }
}

/**
 * Créer un lien vers le Stripe Customer Portal
 * POST /api/subscriptions/customer-portal
 */
async function createCustomerPortalSession(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        error: 'Aucun compte client Stripe trouvé.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_BASE_URL}/dashboard`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erreur createCustomerPortalSession:', error);
    res.status(500).json({ error: 'Erreur lors de la création du portail client.' });
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  createCustomerPortalSession
};
