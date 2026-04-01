import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { createCheckoutSession, getSubscriptionStatus } from '../../shared/api/subscription';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './Pricing.module.css';
import logger from '../../shared/utils/logger.js';

const FAQ_DATA = [
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'Vous bénéficiez de 7 jours d\'accès complet à Premium. Aucun paiement ne sera effectué pendant cette période. Vous pouvez annuler à tout moment avant la fin de l\'essai.',
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer: 'Oui, vous pouvez annuler à tout moment depuis votre Dashboard. Vous garderez l\'accès Premium jusqu\'à la fin de votre période payée.',
  },
  {
    question: 'Que se passe-t-il si j\'annule ?',
    answer: 'Vous repasserez au plan Gratuit. Vos données sauvegardées restent accessibles si vous vous réabonnez plus tard.',
  },
  {
    question: 'Le paiement est-il sécurisé ?',
    answer: 'Absolument. Nous utilisons Stripe pour traiter tous les paiements. Vos données bancaires ne transitent jamais par nos serveurs.',
  },
];

const COMPARISON_DATA = [
  { feature: 'Bibliothèque d\'exercices', free: 'check', premium: 'check' },
  { feature: 'Suivi de séance en direct', free: 'check', premium: 'check' },
  { feature: 'Calculateurs (IMC, Calories, 1RM)', free: 'check', premium: 'check' },
  { feature: 'Leaderboard', free: 'Lecture', premium: 'check' },
  { feature: 'Sauvegarde des séances', free: 'cross', premium: 'check' },
  { feature: 'Dashboard & Statistiques', free: 'cross', premium: 'check' },
  { feature: 'Historique complet', free: 'cross', premium: 'check' },
  { feature: 'Heatmap 12 semaines', free: 'cross', premium: 'check' },
  { feature: 'Badges & Gamification', free: 'cross', premium: 'check' },
  { feature: 'Export CSV', free: 'cross', premium: 'check' },
  { feature: 'Support prioritaire', free: 'cross', premium: 'check' },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
      <button
        className={styles.faqQuestion}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      <div className={`${styles.faqAnswerWrapper} ${open ? styles.faqAnswerWrapperOpen : ''}`}>
        <div className={styles.faqAnswerInner}>
          <p className={styles.faqAnswer}>{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);

  const canceled = searchParams.get('canceled');
  const success = searchParams.get('success');

  const isAuth = !authLoading && isLoggedIn;

  useEffect(() => {
    if (isAuth) {
      getSubscriptionStatus()
        .then(setSubscriptionStatus)
        .catch((err) => logger.error('Erreur récupération statut:', err));
    }
  }, [isAuth]);

  const handleUpgrade = async () => {
    if (!isAuth) {
      window.location.hash = '#signup';
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
      <Helmet>
        <title>Tarifs Premium - Harmonith | Abonnement Fitness</title>
        <meta name="description" content="Decouvrez les offres Harmonith : gratuit ou Premium. Acces illimite aux programmes, recettes, GymBro et fonctionnalites exclusives." />
        <meta property="og:title" content="Tarifs Premium - Harmonith" />
        <meta property="og:description" content="Offres Harmonith : gratuit ou Premium avec acces illimite." />
      </Helmet>
      <Navbar />

      <div className={styles.scene}>
        {/* Ambient floating orbs */}
        <div className={styles.ambientLayer}>
          <div className={`${styles.orb} ${styles.orbPeach}`} />
          <div className={`${styles.orb} ${styles.orbMint}`} />
          <div className={`${styles.orb} ${styles.orbSage}`} />
        </div>

        <div className={styles.container}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroLabel}>
              <span className={styles.heroLabelDot} />
              Tarifs
            </div>
            <h1 className={styles.heroTitle}>
              Passez au niveau{' '}
              <span className={styles.heroTitleAccent}>supérieur</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Débloquez tout le potentiel d'Harmonith. Statistiques avancées,
              sauvegarde illimitée et bien plus encore.
            </p>
          </div>

          {/* Alerts */}
          {canceled && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              Paiement annulé. Vous pouvez réessayer quand vous voulez !
            </div>
          )}
          {success && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              Bienvenue dans Premium ! Votre essai gratuit de 7 jours a commencé.
            </div>
          )}

          {/* Plans */}
          <div className={styles.plansGrid}>
            {/* Free Plan */}
            <div className={`${styles.planCard} ${styles.planCardFree}`}>
              <div className={styles.planHeader}>
                <div className={`${styles.planIcon} ${styles.planIconFree}`}>
                  <span role="img" aria-label="free">&#x1F331;</span>
                </div>
                <h2 className={styles.planName}>Gratuit</h2>
                <p className={styles.planDescription}>
                  L'essentiel pour commencer votre parcours fitness
                </p>
                <div className={styles.price}>
                  <span className={styles.amount}>0</span>
                  <span className={styles.currency}>€</span>
                  <span className={styles.period}>/mois</span>
                </div>
              </div>

              <ul className={styles.featuresList}>
                {[
                  'Bibliothèque d\'exercices complète',
                  'Suivi de séance en direct',
                  'Calculateurs (IMC, Calories, 1RM)',
                  'Leaderboard (lecture seule)',
                ].map((feat) => (
                  <li key={feat} className={styles.featureItem}>
                    <span className={`${styles.featureIcon} ${styles.featureIconCheck}`}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {feat}
                  </li>
                ))}
                {[
                  'Sauvegarde des séances',
                  'Dashboard & Statistiques',
                  'Historique complet',
                  'Participation Leaderboard',
                ].map((feat) => (
                  <li key={feat} className={`${styles.featureItem} ${styles.featureDisabled}`}>
                    <span className={`${styles.featureIcon} ${styles.featureIconCross}`}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={`${styles.planButton} ${styles.secondaryButton}`} disabled>
                <span className={styles.buttonText}>Plan actuel</span>
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`${styles.planCard} ${styles.planCardPremium}`}>
              <div className={styles.premiumShimmer} />

              {!isPremium && (
                <div className={styles.badge}>
                  <span className={styles.badgeIcon}>&#x2728;</span>
                  7 jours gratuits
                </div>
              )}

              <div className={styles.planHeader}>
                <div className={`${styles.planIcon} ${styles.planIconPremium}`}>
                  <span role="img" aria-label="premium">&#x1F451;</span>
                </div>
                <h2 className={styles.planName}>Premium</h2>
                <p className={styles.planDescription}>
                  L'expérience complète pour atteindre vos objectifs
                </p>
                <div className={styles.price}>
                  <span className={`${styles.amount} ${styles.amountPremium}`}>3,99</span>
                  <span className={styles.currency}>€</span>
                  <span className={styles.period}>/mois</span>
                </div>
              </div>

              <ul className={styles.featuresList}>
                {[
                  { text: 'Tout du plan Gratuit', highlight: false },
                  { text: 'Sauvegarde illimitée des séances', highlight: true },
                  { text: 'Dashboard complet avec analytics', highlight: true },
                  { text: 'Historique illimité', highlight: true },
                  { text: 'Statistiques détaillées & graphs', highlight: true },
                  { text: 'Heatmap 12 semaines', highlight: true },
                  { text: 'Badges & Gamification', highlight: true },
                  { text: 'Participation Leaderboard', highlight: true },
                  { text: 'Export CSV de vos données', highlight: true },
                  { text: 'Support prioritaire', highlight: true },
                ].map(({ text, highlight }) => (
                  <li key={text} className={styles.featureItem}>
                    <span className={`${styles.featureIcon} ${styles.featureIconCheck}`}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {highlight ? (
                      <span className={styles.featureHighlight}>{text}</span>
                    ) : text}
                  </li>
                ))}
              </ul>

              {error && (
                <div className={styles.error}>{error}</div>
              )}

              <button
                className={`${styles.planButton} ${styles.primaryButton}`}
                onClick={handleUpgrade}
                disabled={loading || isPremium}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner} />
                    <span className={styles.buttonText}>Chargement...</span>
                  </>
                ) : isPremium ? (
                  <span className={styles.buttonText}>Abonné</span>
                ) : isAuth ? (
                  <span className={styles.buttonText}>Essayer 7 jours gratuits</span>
                ) : (
                  <span className={styles.buttonText}>Se connecter pour essayer</span>
                )}
              </button>

              {!isPremium && (
                <p className={styles.trialNotice}>
                  <span className={styles.trialNoticeIcon}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M5 3V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <circle cx="5" cy="7" r="0.5" fill="currentColor"/>
                    </svg>
                  </span>
                  Sans engagement · Annulez quand vous voulez
                </p>
              )}
            </div>
          </div>

          {/* Social Proof */}
          <div className={styles.socialProof}>
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>500+</span>
              <span className={styles.proofLabel}>Utilisateurs</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>10K+</span>
              <span className={styles.proofLabel}>Séances trackées</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofValue}>4.8</span>
              <span className={styles.proofLabel}>Note moyenne</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className={styles.comparisonSection}>
            <h3 className={styles.comparisonTitle}>Comparatif détaillé</h3>
            <div className={styles.comparisonTable}>
              <div className={styles.comparisonHeader}>
                <span className={styles.comparisonHeaderLabel}>Fonctionnalité</span>
                <span className={styles.comparisonHeaderLabel}>Gratuit</span>
                <span className={styles.comparisonHeaderLabel}>Premium</span>
              </div>
              {COMPARISON_DATA.map(({ feature, free, premium }) => (
                <div key={feature} className={styles.comparisonRow}>
                  <span className={styles.comparisonFeature}>{feature}</span>
                  <span>
                    {free === 'check' ? (
                      <span className={styles.comparisonCheck}>
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : free === 'cross' ? (
                      <span className={styles.comparisonCross}>—</span>
                    ) : (
                      <span className={styles.comparisonLimit}>{free}</span>
                    )}
                  </span>
                  <span>
                    {premium === 'check' ? (
                      <span className={styles.comparisonCheck}>
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : (
                      <span className={styles.comparisonCross}>—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className={styles.faq}>
            <h3 className={styles.faqTitle}>Questions fréquentes</h3>
            <div className={styles.faqList}>
              {FAQ_DATA.map(({ question, answer }) => (
                <FaqItem key={question} question={question} answer={answer} />
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className={styles.ctaBottom}>
            <h3 className={styles.ctaTitle}>Prêt à transformer vos entraînements ?</h3>
            <p className={styles.ctaSubtitle}>
              Commencez votre essai gratuit de 7 jours, sans engagement.
            </p>
            <button
              className={styles.ctaButton}
              onClick={handleUpgrade}
              disabled={loading || isPremium}
            >
              {isPremium ? 'Déjà abonné' : 'Commencer gratuitement'}
              <span className={styles.ctaArrow}>&#8594;</span>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
