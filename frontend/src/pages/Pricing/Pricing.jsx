import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { createCheckoutSession, getSubscriptionStatus } from '../../shared/api/subscription';
import { isAuthenticated } from '../../shared/api/auth';
import styles from './Pricing.module.css';
import logger from '../../shared/utils/logger.js';

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  const canceled = searchParams.get('canceled');
  const success = searchParams.get('success');

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsAuth(auth);

      if (auth) {
        try {
          const status = await getSubscriptionStatus();
          setSubscriptionStatus(status);
        } catch (err) {
          logger.error('Erreur récupération statut:', err);
        }
      }
    };

    checkAuth();
  }, []);

  const handleUpgrade = async () => {
    if (!isAuth) {
      navigate('/');
      return;
    }

    if (subscriptionStatus?.tier === 'premium') {
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      logger.error('Erreur création checkout:', err);
      setError(err.response?.data?.error || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  const isPremium = subscriptionStatus?.tier === 'premium';

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Choisissez votre plan</h1>
          <p className={styles.subtitle}>
            Débloquez tout le potentiel d'Harmonith avec Premium
          </p>
        </div>

        {canceled && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            Paiement annulé. Vous pouvez réessayer quand vous voulez !
          </div>
        )}

        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            🎉 Bienvenue dans Premium ! Votre essai gratuit de 7 jours a commencé.
          </div>
        )}

        <div className={styles.plansGrid}>
          {/* Plan Gratuit */}
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <h2>Gratuit</h2>
              <div className={styles.price}>
                <span className={styles.amount}>0€</span>
                <span className={styles.period}>/mois</span>
              </div>
            </div>

            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                Bibliothèque d'exercices complète
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                Suivi de séance en direct
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                Calculateurs (IMC, Calories, 1RM)
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                Leaderboard (lecture seule)
              </li>
              <li className={`${styles.featureItem} ${styles.disabled}`}>
                <span className={styles.crossIcon}>✗</span>
                Sauvegarde des séances
              </li>
              <li className={`${styles.featureItem} ${styles.disabled}`}>
                <span className={styles.crossIcon}>✗</span>
                Dashboard & Statistiques
              </li>
              <li className={`${styles.featureItem} ${styles.disabled}`}>
                <span className={styles.crossIcon}>✗</span>
                Historique complet
              </li>
              <li className={`${styles.featureItem} ${styles.disabled}`}>
                <span className={styles.crossIcon}>✗</span>
                Participation Leaderboard
              </li>
            </ul>

            <button className={`${styles.planButton} ${styles.secondaryButton}`} disabled>
              Plan actuel
            </button>
          </div>

          {/* Plan Premium */}
          <div className={`${styles.planCard} ${styles.premiumPlan}`}>
            {!isPremium && (
              <div className={styles.badge}>7 jours gratuits</div>
            )}

            <div className={styles.planHeader}>
              <h2>Premium</h2>
              <div className={styles.price}>
                <span className={styles.amount}>3,99€</span>
                <span className={styles.period}>/mois</span>
              </div>
            </div>

            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                Tout du plan Gratuit
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Sauvegarde illimitée</strong> des séances
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Dashboard complet</strong> avec analytics
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Historique illimité</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Statistiques détaillées</strong> & graphs
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Heatmap 12 semaines</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Badges & Gamification</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Participation Leaderboard</strong>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Export CSV</strong> de vos données
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <strong>Support prioritaire</strong>
              </li>
            </ul>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <button
              className={`${styles.planButton} ${styles.primaryButton}`}
              onClick={handleUpgrade}
              disabled={loading || isPremium}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Chargement...
                </>
              ) : isPremium ? (
                'Abonné ✓'
              ) : isAuth ? (
                'Essayer 7 jours gratuits'
              ) : (
                'Se connecter pour essayer'
              )}
            </button>

            {!isPremium && (
              <p className={styles.trialNotice}>
                Sans engagement. Annulez quand vous voulez.
              </p>
            )}
          </div>
        </div>

        <div className={styles.faq}>
          <h3>Questions fréquentes</h3>
          <div className={styles.faqItem}>
            <h4>Comment fonctionne l'essai gratuit ?</h4>
            <p>
              Vous bénéficiez de 7 jours d'accès complet à Premium. Aucun paiement ne sera
              effectué pendant cette période. Vous pouvez annuler à tout moment.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4>Puis-je annuler mon abonnement ?</h4>
            <p>
              Oui, vous pouvez annuler à tout moment depuis votre Dashboard. Vous garderez
              l'accès Premium jusqu'à la fin de votre période payée.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h4>Que se passe-t-il si j'annule ?</h4>
            <p>
              Vous repasserez au plan Gratuit. Vos données sauvegardées restent accessibles
              si vous vous réabonnez plus tard.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
