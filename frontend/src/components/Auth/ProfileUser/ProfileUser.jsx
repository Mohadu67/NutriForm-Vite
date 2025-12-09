import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import ProfilePhoto from "./ProfilePhoto/ProfilePhoto.jsx";
import NotificationSettings from "../../Notifications/NotificationSettings.jsx";
import { secureApiCall, logout, isAuthenticated } from "../../../utils/authService.js";
import { getSubscriptionStatus, createCustomerPortalSession } from "../../../shared/api/subscription.js";
import { getMyProfile, updateProfile } from "../../../shared/api/profile.js";
import { UserIcon, DiamondIcon, HeartIcon, SettingsIcon } from '../../Icons/GlobalIcons';
import { storage } from "../../../shared/utils/storage";
import logger from '../../../shared/utils/logger.js';

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

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserData();
      fetchSubscriptionInfo();
      fetchMatchingProfile();
    } else {
      setLoading(false);
    }
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

  const fetchUserData = async () => {
    try {
      const res = await secureApiCall('/me');

      if (!res.ok) {
        if (res.status === 401) {
          const weeklyGoal = storage.get('weeklyGoal');
          const dynamiPrefs = {
            dynamiStep: storage.get('dynamiStep'),
            dynamiType: storage.get('dynamiType'),
            dynamiEquip: storage.get('dynamiEquip'),
            dynamiMuscle: storage.get('dynamiMuscle'),
          };

          await logout();
          storage.clear();
          sessionStorage.clear();

          if (weeklyGoal) storage.set('weeklyGoal', weeklyGoal);
          Object.entries(dynamiPrefs).forEach(([key, value]) => {
            if (value) storage.set(key, value);
          });

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

                    {subscriptionInfo.tier === 'premium' && subscriptionInfo.isInTrial && subscriptionInfo.trialEnd && (
                      <div className={styles.premiumInfo}>
                        <p>Période d'essai expire le {new Date(subscriptionInfo.trialEnd).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}

                    {subscriptionInfo.tier === 'premium' && !subscriptionInfo.isInTrial && subscriptionInfo.currentPeriodEnd && (
                      <div className={styles.premiumInfo}>
                        <p>
                          {subscriptionInfo.cancelAtPeriodEnd ? 'Annulé - ' : 'Renouvellement le '}
                          {new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={styles.premiumActions}>
                    {subscriptionInfo.tier === 'free' ? (
                      <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                        🚀 Passer à Premium
                      </button>
                    ) : (
                      <button
                        className={styles.manageBtn}
                        onClick={handleManageSubscription}
                        disabled={loadingSubscription}
                      >
                        {loadingSubscription ? 'Chargement...' : 'Gérer mon abonnement'}
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
                  🔒 Changer mon mot de passe
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
