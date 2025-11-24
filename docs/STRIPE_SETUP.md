# 🎯 Guide de Configuration Stripe pour NutriForm

Ce guide vous accompagne pas à pas pour configurer Stripe et activer le système d'abonnement Premium (3,99€/mois avec 7 jours d'essai gratuit).

---

## 📋 Prérequis

- Compte Stripe (gratuit) : https://dashboard.stripe.com/register
- Accès au backend NutriForm
- Variables d'environnement configurables

---

## 🚀 Étape 1 : Créer un compte Stripe

1. Allez sur https://dashboard.stripe.com/register
2. Créez un compte avec votre email professionnel
3. Remplissez les informations de votre entreprise (NutriForm)
4. **Mode Test** sera activé par défaut (parfait pour débuter)

---

## 🔑 Étape 2 : Récupérer les clés API

### 2.1 Clé secrète (Secret Key)

1. Dans le dashboard Stripe, allez dans **Developers** → **API Keys**
2. Copiez la **Secret key** (commence par `sk_test_...` en mode test)
3. Ajoutez-la dans votre `.env` backend :

```env
STRIPE_SECRET_KEY=sk_test_51abc...xyz
```

⚠️ **Important** : Ne committez JAMAIS cette clé dans Git !

---

## 💰 Étape 3 : Créer le produit Premium

### 3.1 Créer le produit

1. Dans le dashboard Stripe, allez dans **Products** → **Add product**
2. Remplissez les informations :
   - **Name** : `NutriForm Premium`
   - **Description** : `Accès complet au dashboard, sauvegarde illimitée des séances et statistiques avancées`
   - **Image** : (optionnel) Ajoutez le logo NutriForm

### 3.2 Créer le prix récurrent

1. Dans la section **Pricing** du produit :
   - **Pricing model** : `Standard pricing`
   - **Price** : `3.99`
   - **Currency** : `EUR (€)`
   - **Billing period** : `Monthly` (mensuel)

2. Dans **Additional options** :
   - **Free trial** : Activez et mettez `7 days`
   - **Usage type** : `Licensed` (un utilisateur = un abonnement)

3. Cliquez sur **Add pricing**

### 3.3 Récupérer le Price ID

1. Une fois le prix créé, cliquez dessus
2. Copiez le **Price ID** (commence par `price_...`)
3. Ajoutez-le dans votre `.env` backend :

```env
STRIPE_PRICE_ID=price_1abc...xyz
```

---

## 🔔 Étape 4 : Configurer les Webhooks

Les webhooks permettent à Stripe de notifier votre backend des événements (paiement réussi, abonnement annulé, etc.).

### 4.1 Créer le endpoint webhook

1. Dans le dashboard Stripe, allez dans **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. Remplissez :
   - **Endpoint URL** : `https://api.harmonith.fr/api/subscriptions/webhook`
     - ⚠️ En développement local, utilisez **Stripe CLI** (voir section 6)
   - **Description** : `NutriForm subscription events`

### 4.2 Sélectionner les événements

Cochez les événements suivants :
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

4. Cliquez sur **Add endpoint**

### 4.3 Récupérer le Webhook Secret

1. Cliquez sur le webhook que vous venez de créer
2. Dans la section **Signing secret**, cliquez sur **Reveal**
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans votre `.env` backend :

```env
STRIPE_WEBHOOK_SECRET=whsec_abc...xyz
```

---

## 🌐 Étape 5 : Configurer les URLs

Ajoutez l'URL frontend dans votre `.env` backend :

```env
FRONTEND_URL=https://harmonith.fr
```

En développement :
```env
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Étape 6 : Tester en local avec Stripe CLI

Pour tester les webhooks en local, utilisez Stripe CLI :

### 6.1 Installer Stripe CLI

**macOS (Homebrew)** :
```bash
brew install stripe/stripe-cli/stripe
```

**Linux** :
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin
```

**Windows** :
Téléchargez depuis https://github.com/stripe/stripe-cli/releases

### 6.2 Se connecter

```bash
stripe login
```

### 6.3 Transférer les webhooks vers votre serveur local

```bash
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

Copiez le **webhook signing secret** affiché et ajoutez-le dans votre `.env` :
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎨 Étape 7 : Personnaliser Stripe Checkout (optionnel)

1. Dans **Settings** → **Branding**
2. Ajoutez :
   - **Brand icon** : Logo NutriForm
   - **Brand color** : Couleur principale de NutriForm
   - **Business name** : `NutriForm`

---

## 🧪 Étape 8 : Tester le flux complet

### 8.1 Cartes de test

Stripe fournit des cartes de test pour simuler des paiements :

**Paiement réussi** :
- Numéro : `4242 4242 4242 4242`
- Date d'expiration : N'importe quelle date future (ex: 12/25)
- CVC : N'importe quel code à 3 chiffres (ex: 123)

**Paiement refusé** :
- Numéro : `4000 0000 0000 0002`

**3D Secure requis** :
- Numéro : `4000 0025 0000 3155`

### 8.2 Scénario de test

1. Démarrez votre backend : `npm run dev` (dans `/backend`)
2. Démarrez votre frontend : `npm run dev` (dans `/frontend`)
3. Créez un compte utilisateur sur NutriForm
4. Allez sur `/pricing`
5. Cliquez sur **Essayer 7 jours gratuits**
6. Remplissez avec une carte de test
7. Vérifiez que :
   - ✅ Vous êtes redirigé vers `/dashboard?success=true`
   - ✅ Le Dashboard s'affiche (plus de paywall)
   - ✅ Dans Stripe Dashboard → **Customers**, votre utilisateur apparaît
   - ✅ Dans Stripe Dashboard → **Subscriptions**, l'abonnement est "Trialing"

### 8.3 Vérifier les webhooks

1. Dans Stripe Dashboard → **Developers** → **Webhooks**
2. Cliquez sur votre endpoint
3. Vérifiez que les événements sont bien reçus (status 200)

---

## 🔄 Étape 9 : Passer en mode Production

⚠️ **Ne faites cela QUE lorsque vous êtes prêt à accepter de vrais paiements !**

### 9.1 Activer le compte Stripe

1. Dans Stripe Dashboard, cliquez sur **Activate account**
2. Remplissez toutes les informations légales et bancaires
3. Soumettez pour validation (peut prendre 1-2 jours)

### 9.2 Obtenir les clés de production

1. Dans **Developers** → **API Keys**
2. Basculez de **Test mode** à **Live mode** (switch en haut à droite)
3. Copiez la nouvelle **Secret key** (commence par `sk_live_...`)
4. Mettez à jour votre `.env` de production :

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_... # Créez un nouveau prix en mode live
STRIPE_WEBHOOK_SECRET=whsec_... # Créez un nouveau webhook en mode live
```

### 9.3 Créer le produit en mode Live

Répétez l'étape 3 mais en mode **Live** :
- Créez le produit `NutriForm Premium`
- Créez le prix 3,99€/mois avec trial 7 jours
- Récupérez le nouveau `STRIPE_PRICE_ID`

### 9.4 Créer le webhook en mode Live

Répétez l'étape 4 mais en mode **Live** :
- URL : `https://api.harmonith.fr/api/subscriptions/webhook`
- Mêmes événements
- Récupérez le nouveau `STRIPE_WEBHOOK_SECRET`

---

## 📊 Étape 10 : Monitoring

### Dans Stripe Dashboard

- **Payments** : Voir tous les paiements
- **Customers** : Voir tous les clients
- **Subscriptions** : Voir tous les abonnements actifs
- **Webhooks** : Vérifier que les événements sont bien reçus

### Dans votre backend

Vérifiez les logs :
```bash
# Les webhooks loguent automatiquement
✅ Abonnement créé pour user 123abc
✅ Paiement réussi pour user 123abc
❌ Abonnement annulé pour user 456def
```

---

## 🐛 Dépannage

### Problème : Les webhooks ne sont pas reçus

**Solution** :
- Vérifiez que l'URL du webhook est correcte
- Vérifiez que le `STRIPE_WEBHOOK_SECRET` est correct
- En local, utilisez Stripe CLI avec `stripe listen`

### Problème : Erreur "Invalid signature"

**Solution** :
- Le `STRIPE_WEBHOOK_SECRET` est incorrect
- Régénérez un nouveau secret dans Stripe Dashboard

### Problème : L'abonnement ne passe pas à "active" après le trial

**Solution** :
- Vérifiez que la carte de test est valide
- Attendez que le trial se termine (vous pouvez forcer avec Stripe CLI)
- Vérifiez les webhooks `invoice.payment_succeeded`

### Problème : L'utilisateur reste "free" après paiement

**Solution** :
- Vérifiez que le webhook `checkout.session.completed` est bien reçu
- Vérifiez les logs backend pour voir si la DB est mise à jour
- Vérifiez que `userId` est bien dans les metadata Stripe

---

## 🎉 C'est terminé !

Votre système d'abonnement Stripe est configuré ! 🚀

**Checklist finale** :
- ✅ Compte Stripe créé
- ✅ Clés API récupérées et en `.env`
- ✅ Produit Premium créé (3,99€/mois)
- ✅ Prix avec trial 7 jours créé
- ✅ Webhooks configurés
- ✅ Tests réussis avec cartes de test
- ✅ Frontend affiche bien le paywall
- ✅ Flux de paiement fonctionne
- ✅ Dashboard débloqué après abonnement

---

## 📚 Ressources

- **Documentation Stripe** : https://stripe.com/docs
- **Stripe CLI** : https://stripe.com/docs/stripe-cli
- **Testing cards** : https://stripe.com/docs/testing
- **Webhooks guide** : https://stripe.com/docs/webhooks

---

## 🆘 Support

En cas de problème, vérifiez :
1. Les logs backend (webhooks)
2. Stripe Dashboard → Webhooks → Events
3. Stripe Dashboard → Logs

Pour plus d'aide, contactez le support Stripe : https://support.stripe.com
