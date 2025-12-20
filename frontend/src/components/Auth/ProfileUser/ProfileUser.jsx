import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import ProfilePhoto from "./ProfilePhoto/ProfilePhoto.jsx";
import NotificationSettings from "../../Notifications/NotificationSettings.jsx";
import { secureApiCall, logout, isAuthenticated, invalidateAuthCache } from "../../../utils/authService.js";
import { getSubscriptionStatus, createCustomerPortalSession } from "../../../shared/api/subscription.js";
import { getMyProfile, updateProfile } from "../../../shared/api/profile.js";
import { redeemXpForPremium, getXpRedemptionHistory } from "../../../shared/api/xpRedemption.js";
import RedeemXpModal from "../../RedeemXpModal/RedeemXpModal.jsx";
import { UserIcon, DiamondIcon, HeartIcon, SettingsIcon, LockIcon, InfoIcon } from '../../Icons/GlobalIcons';
import { storage } from "../../../shared/utils/storage";
import logger from '../../../shared/utils/logger.js';
import { LEAGUE_INFO, getLeagueForXP, getProgressToNextLeague } from '../../../pages/Leaderboard/hooks/useChallenges';
import { useNotification } from '../../../hooks/useNotification.jsx';

const WORKOUT_TYPES = [
  { value: 'musculation', label: 'Musculation', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' },
  { value: 'crossfit', label: 'CrossFit', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'pilates', label: 'Pilates', icon: '🤸' },
  { value: 'running', label: 'Course', icon: '👟' },
  { value: 'cycling', label: 'Vélo', icon: '🚴' },
  { value: 'swimming', label: 'Natation', icon: '🏊' },
  { value: 'boxing', label: 'Boxe', icon: '🥊' },
  { value: 'dance', label: 'Danse', icon: '💃' },
  { value: 'functional', label: 'Functional', icon: '⚡' },
  { value: 'hiit', label: 'HIIT', icon: '🔥' }
];

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' }
];

export default function ProfileUser({ onLogout }) {
  const navigate = useNavigate();
  const notify = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // profile, premium, matching, settings
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editingMatching, setEditingMatching] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");

  // Matching profile data
  const [matchingProfile, setMatchingProfile] = useState(null);
  const [matchingData, setMatchingData] = useState({
    bio: '',
    age: '',
    gender: '',
    fitnessLevel: '',
    workoutTypes: [],
    city: ''
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Subscription state
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // XP state
  const [xpData, setXpData] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchRedemptionHistory = async () => {
    try {
      const result = await getXpRedemptionHistory();
      if (result.success) {
        setRedemptionHistory(result.redemptions || []);
      }
    } catch (err) {
      logger.error('Erreur récupération historique rachats:', err);
    }
  };

  useEffect(() => {
    // Invalider le cache auth pour forcer un appel frais
    invalidateAuthCache();
    // Toujours essayer (cookie httpOnly détermine l'auth)
    fetchUserData();
    fetchSubscriptionInfo();
    fetchMatchingProfile();
    fetchXpData();
    fetchRedemptionHistory();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionInfo(status);
    } catch (err) {
      logger.error('Erreur récupération subscription:', err);
    }
  };

  const fetchMatchingProfile = async () => {
    try {
      const { profile } = await getMyProfile();
      setMatchingProfile(profile);
      setMatchingData({
        bio: profile.bio || '',
        age: profile.age || '',
        gender: profile.gender || 'prefer_not_say',
        fitnessLevel: profile.fitnessLevel || 'beginner',
        workoutTypes: profile.workoutTypes || [],
        city: profile.location?.city || ''
      });
    } catch (err) {
      logger.error('Erreur récupération profil matching:', err);
    }
  };

  const fetchXpData = async () => {
    try {
      const response = await secureApiCall('/leaderboard/status', { method: 'GET' });
      const data = await response.json();

      if (data.success && data.data) {
        const xp = data.data.xp || 0;
        const league = getLeagueForXP(xp);
        const progress = getProgressToNextLeague(xp);
        setXpData({
          xp,
          league,
          leagueInfo: LEAGUE_INFO[league],
          progress,
          isOptedIn: data.isOptedIn,
          challengeStats: data.data.challengeStats || {}
        });
      } else {
        // User not in leaderboard yet, show 0 XP
        setXpData({
          xp: 0,
          league: 'starter',
          leagueInfo: LEAGUE_INFO.starter,
          progress: getProgressToNextLeague(0),
          isOptedIn: false,
          challengeStats: {}
        });
      }
    } catch (err) {
      logger.error('Erreur récupération XP:', err);
      // Set default values on error
      setXpData({
        xp: 0,
        league: 'starter',
        leagueInfo: LEAGUE_INFO.starter,
        progress: getProgressToNextLeague(0),
        isOptedIn: false,
        challengeStats: {}
      });
    }
  };

  const handleRedeemXp = async (months) => {
    setRedeemLoading(true);
    try {
      const result = await redeemXpForPremium(months);
      if (result.success) {
        // Rafraichir les donnees
        await fetchXpData();
        await fetchSubscriptionInfo();
        await fetchRedemptionHistory();
        setShowRedeemModal(false);
        // Afficher animation de celebration
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        // Toast de succes
        notify.success(`${months} mois Premium activé ! Profitez de vos avantages.`);
      }
    } catch (err) {
      logger.error('Erreur rachat XP:', err);
      notify.error(err.response?.data?.error || 'Erreur lors de la conversion');
    } finally {
      setRedeemLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await secureApiCall('/me');

      if (!res.ok) {
        if (res.status === 401) {
          // logout() gère déjà le nettoyage localStorage proprement
          await logout();
          if (onLogout) onLogout();
          window.location.href = '/';
          return;
        }

        setError("Impossible de charger les données. Réessayez plus tard.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data);
      setPrenom(data.prenom || "");
      setPseudo(data.pseudo || "");
      setEmail(data.email || "");
      setLoading(false);
    } catch (err) {
      logger.error('Erreur fetchUserData:', err);
      setError("Erreur de connexion. Vérifiez votre connexion internet.");
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await secureApiCall('/update-profile', {
        method: "PUT",
        body: JSON.stringify({ prenom, pseudo, email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur de mise à jour");
      }

      setMessage("Informations mises à jour avec succès");
      setEditing(false);
      fetchUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const res = await secureApiCall('/change-password', {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur de changement de mot de passe");
      }

      setMessage("Mot de passe modifié avec succès");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMatchingProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const updateData = {
        bio: matchingData.bio,
        age: matchingData.age,
        gender: matchingData.gender,
        fitnessLevel: matchingData.fitnessLevel,
        workoutTypes: matchingData.workoutTypes,
        location: {
          city: matchingData.city
        }
      };

      await updateProfile(updateData);
      setMessage("Profil de matching mis à jour avec succès");
      setEditingMatching(false);
      fetchMatchingProfile();
    } catch (err) {
      setError(err.message || "Erreur de mise à jour du profil");
    }
  };

  const toggleWorkoutType = (type) => {
    setMatchingData(prev => ({
      ...prev,
      workoutTypes: prev.workoutTypes.includes(type)
        ? prev.workoutTypes.filter(t => t !== type)
        : [...prev.workoutTypes, type]
    }));
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleManageSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const { url } = await createCustomerPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'accès au portail');
      setLoadingSubscription(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("userLogout"));
    onLogout?.();
    navigate('/');
  };

  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  if (loading) {
    return (
      <div className={styles.body}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={styles.body}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      {/* Hero Header avec Photo */}
      <div className={styles.hero}>
        <div className={styles.heroGradient}></div>
        <div className={styles.heroContent}>
          <div className={styles.photoContainer}>
            <ProfilePhoto user={user} />
          </div>
          <h2 className={styles.userName}>{user?.pseudo || user?.prenom || 'Utilisateur'}</h2>
          <p className={styles.userEmail}>{user?.email}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon size={20} />
          <span>Profil</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'premium' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          <DiamondIcon size={20} />
          <span>Premium</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'matching' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          <HeartIcon size={20} />
          <span>Matching</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={20} />
          <span>Réglages</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* TAB: PROFILE */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            {!editing ? (
              <>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Informations personnelles</h3>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Prénom</span>
                      <span className={styles.dataValue}>{user?.prenom || "Non renseigné"}</span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Pseudo</span>
                      <span className={styles.dataValue}>{user?.pseudo || "Non renseigné"}</span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Email</span>
                      <span className={styles.dataValue}>{user?.email || "Non renseigné"}</span>
                    </div>
                  </div>
                  <button
                    className={styles.editBtn}
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Modifier mes informations
                  </button>
                </div>

                {/* Section XP */}
                {xpData && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Mes Points d'Expérience</h3>
                    <div className={styles.xpContainer}>
                      <div className={styles.xpHeader}>
                        <div className={styles.xpLeagueIcon} style={{ color: xpData.leagueInfo.color }}>
                          {xpData.leagueInfo.icon}
                        </div>
                        <div className={styles.xpInfo}>
                          <span className={styles.xpLeagueName} style={{ color: xpData.leagueInfo.color }}>
                            {xpData.leagueInfo.name}
                          </span>
                          <span className={styles.xpTotal}>{xpData.xp} XP</span>
                        </div>
                      </div>

                      {/* Progress bar vers prochaine ligue */}
                      {xpData.progress.nextLeague && (
                        <div className={styles.xpProgress}>
                          <div className={styles.xpProgressBar}>
                            <div
                              className={styles.xpProgressFill}
                              style={{
                                width: `${xpData.progress.percentage}%`,
                                background: `linear-gradient(90deg, ${xpData.leagueInfo.color}, ${LEAGUE_INFO[xpData.progress.nextLeague].color})`
                              }}
                            />
                          </div>
                          <div className={styles.xpProgressInfo}>
                            <span>{xpData.progress.remaining} XP pour atteindre</span>
                            <span className={styles.xpNextLeague}>
                              {LEAGUE_INFO[xpData.progress.nextLeague].icon} {LEAGUE_INFO[xpData.progress.nextLeague].name}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Comment gagner des XP */}
                      <div className={styles.xpEarnSection}>
                        <h4 className={styles.xpEarnTitle}>Comment gagner des XP</h4>
                        <div className={styles.xpEarnList}>
                          <div className={styles.xpEarnItem}>
                            <span className={styles.xpEarnIcon}>🍳</span>
                            <span className={styles.xpEarnText}>Créer une recette</span>
                            <span className={styles.xpEarnValue}>+50 XP</span>
                          </div>
                          <div className={styles.xpEarnItem}>
                            <span className={styles.xpEarnIcon}>✅</span>
                            <span className={styles.xpEarnText}>Recette approuvée</span>
                            <span className={styles.xpEarnValue}>+100 XP</span>
                          </div>
                          <div className={styles.xpEarnItem}>
                            <span className={styles.xpEarnIcon}>🏋️</span>
                            <span className={styles.xpEarnText}>Créer un programme</span>
                            <span className={styles.xpEarnValue}>+75 XP</span>
                          </div>
                          <div className={styles.xpEarnItem}>
                            <span className={styles.xpEarnIcon}>✅</span>
                            <span className={styles.xpEarnText}>Programme approuvé</span>
                            <span className={styles.xpEarnValue}>+150 XP</span>
                          </div>
                          <div className={styles.xpEarnItem}>
                            <span className={styles.xpEarnIcon}>⚔️</span>
                            <span className={styles.xpEarnText}>Gagner un défi</span>
                            <span className={styles.xpEarnValue}>+25-100 XP</span>
                          </div>
                        </div>
                      </div>

                      {/* Utilisation des XP pour Premium */}
                      <div
                        className={styles.xpRewardsSection}
                        onClick={() => navigate('/rewards')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.xpRewardsTitleRow}>
                          <h4 className={styles.xpRewardsTitle}>Utiliser mes XP</h4>
                          <span className={styles.xpRewardsArrow}>→</span>
                        </div>

                        <div className={styles.xpRewardsPreview}>
                          <span className={styles.xpRewardsPreviewIcon}>🎁</span>
                          <div className={styles.xpRewardsPreviewText}>
                            <span className={styles.xpRewardsPreviewTitle}>Decouvre nos recompenses</span>
                            <span className={styles.xpRewardsPreviewSub}>Premium, codes promo partenaires...</span>
                          </div>
                        </div>
                      </div>

                      {/* Historique des rachats */}
                      {redemptionHistory.length > 0 && (
                        <div className={styles.xpHistorySection}>
                          <h4 className={styles.xpHistoryTitle}>Historique des conversions</h4>
                          <div className={styles.xpHistoryList}>
                            {redemptionHistory.slice(0, 5).map((redemption) => (
                              <div key={redemption._id} className={styles.xpHistoryItem}>
                                <div className={styles.xpHistoryInfo}>
                                  <span className={styles.xpHistoryIcon}>✨</span>
                                  <div className={styles.xpHistoryDetails}>
                                    <span className={styles.xpHistoryMonths}>
                                      {redemption.monthsRedeemed} mois Premium
                                    </span>
                                    <span className={styles.xpHistoryDate}>
                                      {new Date(redemption.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <span className={styles.xpHistoryCost}>
                                  -{redemption.xpSpent.toLocaleString()} XP
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Animation de celebration */}
                      {showCelebration && (
                        <div className={styles.celebrationOverlay}>
                          <div className={styles.celebrationContent}>
                            <span className={styles.celebrationIcon}>🎉</span>
                            <h3 className={styles.celebrationTitle}>Félicitations !</h3>
                            <p className={styles.celebrationText}>Vous êtes maintenant Premium</p>
                            <div className={styles.confetti}>
                              {[...Array(20)].map((_, i) => (
                                <span
                                  key={i}
                                  className={styles.confettiPiece}
                                  style={{
                                    '--delay': `${Math.random() * 0.5}s`,
                                    '--x': `${Math.random() * 100 - 50}vw`,
                                    '--rotation': `${Math.random() * 360}deg`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Modal de rachat XP */}
                      <RedeemXpModal
                        isOpen={showRedeemModal}
                        onClose={() => setShowRedeemModal(false)}
                        onConfirm={handleRedeemXp}
                        xpBalance={xpData.xp}
                        loading={redeemLoading}
                      />
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className={styles.section}>
                    <button
                      className={styles.adminBtn}
                      onClick={handleAdminClick}
                    >
                      🛡️ Accès Administrateur
                    </button>
                  </div>
                )}

                <div className={styles.section}>
                  <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                  >
                    Se déconnecter
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Modifier mon profil</h3>
                <form onSubmit={handleUpdateInfo} className={styles.form}>
                  <div className={styles.formField}>
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Pseudo</label>
                    <input
                      type="text"
                      value={pseudo}
                      onChange={(e) => setPseudo(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn}>
                      Enregistrer
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className={styles.cancelBtn}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB: PREMIUM */}
        {activeTab === 'premium' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Mon abonnement</h3>
              {subscriptionInfo ? (
                <>
                  <div className={styles.premiumCard}>
                    <div className={styles.premiumBadge}>
                      {subscriptionInfo.tier === 'premium' ? (
                        <span className={styles.badgePremium}>✨ Premium</span>
                      ) : (
                        <span className={styles.badgeFree}>Gratuit</span>
                      )}
                    </div>

                    {/* Premium via XP */}
                    {subscriptionInfo.hasXpPremium && subscriptionInfo.xpPremiumExpiresAt && (
                      <div className={styles.xpPremiumBox}>
                        <div className={styles.xpPremiumHeader}>
                          <span className={styles.xpPremiumIcon}>🎁</span>
                          <span className={styles.xpPremiumTitle}>Premium via XP</span>
                        </div>
                        <p className={styles.xpPremiumExpiry}>
                          Actif jusqu'au <strong>{new Date(subscriptionInfo.xpPremiumExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </p>
                        <p className={styles.xpPremiumNote}>
                          Aucun paiement requis pendant cette période
                        </p>
                      </div>
                    )}

                    {/* Abonnement Stripe actif */}
                    {subscriptionInfo.hasSubscription && (
                      <div className={styles.stripePremiumBox}>
                        <div className={styles.stripePremiumHeader}>
                          <span className={styles.stripePremiumIcon}>💳</span>
                          <span className={styles.stripePremiumTitle}>Abonnement mensuel</span>
                        </div>

                        {subscriptionInfo.isInTrial && subscriptionInfo.trialEnd && (
                          <p className={styles.stripePremiumInfo}>
                            Essai gratuit jusqu'au <strong>{new Date(subscriptionInfo.trialEnd).toLocaleDateString('fr-FR')}</strong>
                          </p>
                        )}

                        {!subscriptionInfo.isInTrial && subscriptionInfo.currentPeriodEnd && (
                          <p className={styles.stripePremiumInfo}>
                            {subscriptionInfo.cancelAtPeriodEnd
                              ? `Annulé - Accès jusqu'au ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                              : `Prochain paiement le ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                            }
                          </p>
                        )}
                      </div>
                    )}

                    {/* Premium XP + Stripe : expliquer la combinaison */}
                    {subscriptionInfo.hasXpPremium && subscriptionInfo.hasSubscription && (
                      <div className={styles.combinedPremiumNote}>
                        <InfoIcon size={16} />
                        <span>Ton Premium XP s'applique en premier. Le paiement Stripe reprendra après expiration.</span>
                      </div>
                    )}

                    {/* Aucun premium */}
                    {!subscriptionInfo.hasXpPremium && !subscriptionInfo.hasSubscription && subscriptionInfo.tier === 'free' && (
                      <div className={styles.noPremiumInfo}>
                        <p>Tu n'as pas d'abonnement Premium actif.</p>
                        <p className={styles.noPremiumHint}>Utilise tes XP ou souscris à un abonnement pour débloquer toutes les fonctionnalités.</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.premiumActions}>
                    {subscriptionInfo.tier === 'free' && !subscriptionInfo.hasXpPremium ? (
                      <>
                        <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                          🚀 S'abonner à Premium
                        </button>
                        <button className={styles.xpBtn} onClick={() => navigate('/rewards')}>
                          🎁 Utiliser mes XP
                        </button>
                      </>
                    ) : subscriptionInfo.hasSubscription ? (
                      <button
                        className={styles.manageBtn}
                        onClick={handleManageSubscription}
                        disabled={loadingSubscription}
                      >
                        {loadingSubscription ? 'Chargement...' : 'Gérer mon abonnement Stripe'}
                      </button>
                    ) : (
                      <button className={styles.xpBtn} onClick={() => navigate('/rewards')}>
                        🎁 Prolonger avec des XP
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className={styles.loadingText}>Chargement...</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: MATCHING */}
        {activeTab === 'matching' && (
          <div className={styles.tabContent}>
            {!editingMatching && matchingProfile ? (
              <>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Profil de matching</h3>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Bio</span>
                      <span className={styles.dataValue}>{matchingProfile.bio || 'Non renseignée'}</span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Âge</span>
                      <span className={styles.dataValue}>{matchingProfile.age || 'Non renseigné'}</span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Niveau</span>
                      <span className={styles.dataValue}>
                        {FITNESS_LEVELS.find(l => l.value === matchingProfile.fitnessLevel)?.label || 'Non renseigné'}
                      </span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Ville</span>
                      <span className={styles.dataValue}>{matchingProfile.location?.city || 'Non renseignée'}</span>
                    </div>
                    <div className={styles.dataItemFull}>
                      <span className={styles.dataLabel}>Activités</span>
                      <div className={styles.badgeList}>
                        {matchingProfile.workoutTypes?.length > 0 ? (
                          matchingProfile.workoutTypes.map(type => {
                            const workoutType = WORKOUT_TYPES.find(w => w.value === type);
                            return workoutType ? (
                              <span key={type} className={styles.badge}>
                                {workoutType.icon} {workoutType.label}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className={styles.dataValue}>Aucune</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className={styles.editBtn}
                    onClick={() => setEditingMatching(true)}
                  >
                    ✏️ Modifier mon profil matching
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Modifier mon profil matching</h3>
                <form onSubmit={handleUpdateMatchingProfile} className={styles.form}>
                  <div className={styles.formField}>
                    <label>Bio</label>
                    <textarea
                      value={matchingData.bio}
                      onChange={(e) => setMatchingData({ ...matchingData, bio: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                      placeholder="Présentez-vous en quelques mots..."
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>Âge</label>
                      <input
                        type="number"
                        value={matchingData.age}
                        onChange={(e) => setMatchingData({ ...matchingData, age: e.target.value })}
                        className={styles.input}
                        min={13}
                        max={120}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Genre</label>
                      <select
                        value={matchingData.gender}
                        onChange={(e) => setMatchingData({ ...matchingData, gender: e.target.value })}
                        className={styles.input}
                      >
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                        <option value="prefer_not_say">Ne pas préciser</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label>Niveau de fitness</label>
                    <select
                      value={matchingData.fitnessLevel}
                      onChange={(e) => setMatchingData({ ...matchingData, fitnessLevel: e.target.value })}
                      className={styles.input}
                    >
                      {FITNESS_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label>Ville</label>
                    <input
                      type="text"
                      value={matchingData.city}
                      onChange={(e) => setMatchingData({ ...matchingData, city: e.target.value })}
                      className={styles.input}
                      placeholder="Votre ville"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Types d'entraînement ({matchingData.workoutTypes.length})</label>
                    <div className={styles.workoutGrid}>
                      {WORKOUT_TYPES.map(type => (
                        <span
                          key={type.value}
                          className={`${styles.workoutBadge} ${matchingData.workoutTypes.includes(type.value) ? styles.selected : ''}`}
                          onClick={() => toggleWorkoutType(type.value)}
                        >
                          {type.icon} {type.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn}>
                      Enregistrer
                    </button>
                    <button type="button" onClick={() => setEditingMatching(false)} className={styles.cancelBtn}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Notifications</h3>
              <NotificationSettings />
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Sécurité</h3>
              {!changingPassword ? (
                <button
                  className={styles.editBtn}
                  onClick={() => setChangingPassword(true)}
                >
                  <LockIcon size={16} /> Changer mon mot de passe
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className={styles.form}>
                  <div className={styles.formField}>
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn}>
                      Changer le mot de passe
                    </button>
                    <button type="button" onClick={() => setChangingPassword(false)} className={styles.cancelBtn}>
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
