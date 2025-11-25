import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import ProfilePhoto from "./ProfilePhoto/ProfilePhoto.jsx";
import NotificationSettings from "../../Notifications/NotificationSettings.jsx";
import { secureApiCall, logout, isAuthenticated } from "../../../utils/authService.js";
import { getSubscriptionStatus, createCustomerPortalSession } from "../../../shared/api/subscription.js";
import { getMyProfile, updateProfile } from "../../../shared/api/profile.js";

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
      console.error('Erreur récupération subscription:', err);
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
      console.error('Erreur récupération profil matching:', err);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await secureApiCall('/me');

      if (!res.ok) {
        // Si 401 Unauthorized, le token est invalide - déconnecter
        if (res.status === 401) {
          const weeklyGoal = localStorage.getItem('weeklyGoal');
          const dynamiPrefs = {
            dynamiStep: localStorage.getItem('dynamiStep'),
            dynamiType: localStorage.getItem('dynamiType'),
            dynamiEquip: localStorage.getItem('dynamiEquip'),
            dynamiMuscle: localStorage.getItem('dynamiMuscle'),
          };

          await logout();
          localStorage.clear();
          sessionStorage.clear();

          if (weeklyGoal) localStorage.setItem('weeklyGoal', weeklyGoal);
          Object.entries(dynamiPrefs).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
          });

          if (onLogout) onLogout();
          window.location.href = '/';
          return;
        }

        // Pour d'autres erreurs (500, 503, etc.), afficher un message
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
      // Erreur réseau ou autre erreur inattendue
      console.error('Erreur fetchUserData:', err);
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
      // Préparer les données avec location au bon format
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
        <p className={styles.loading}>Chargement...</p>
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
      {}
      <div className={styles.header}>
        <h3 className={styles.title}>Mon Profil</h3>
        <div className={styles.photoWrapper}>
          <ProfilePhoto user={user} />
        </div>
      </div>

      {}
      <div className={styles.content}>
        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!editing && !changingPassword && !editingMatching && (
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Prénom</span>
                <span className={styles.value}>{user?.prenom || "Non renseigné"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Pseudo</span>
                <span className={styles.value}>{user?.pseudo || "Non renseigné"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{user?.email || "Non renseigné"}</span>
              </div>
            </div>

            {/* Subscription Section */}
            <div className={styles.subscriptionCard}>
              <h4 className={styles.subscriptionTitle}>Abonnement</h4>
              {subscriptionInfo ? (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Formule</span>
                    <span className={`${styles.value} ${styles.tier} ${styles[subscriptionInfo.tier]}`}>
                      {subscriptionInfo.tier === 'premium' ? '✨ Premium' : 'Gratuit'}
                    </span>
                  </div>

                  {subscriptionInfo.tier === 'premium' && subscriptionInfo.isInTrial && subscriptionInfo.trialEnd && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Période d'essai</span>
                      <span className={styles.value}>
                        Expire le {new Date(subscriptionInfo.trialEnd).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {subscriptionInfo.tier === 'premium' && !subscriptionInfo.isInTrial && subscriptionInfo.currentPeriodEnd && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Renouvellement</span>
                      <span className={styles.value}>
                        {subscriptionInfo.cancelAtPeriodEnd ? 'Annulé - ' : ''}
                        {new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  <div className={styles.subscriptionActions}>
                    {subscriptionInfo.tier === 'free' ? (
                      <BoutonAction type="button" onClick={handleUpgrade} variant="primary">
                        🚀 Passer à Premium
                      </BoutonAction>
                    ) : (
                      <BoutonAction
                        type="button"
                        onClick={handleManageSubscription}
                        variant="secondary"
                        disabled={loadingSubscription}
                      >
                        {loadingSubscription ? 'Chargement...' : 'Gérer mon abonnement'}
                      </BoutonAction>
                    )}
                  </div>
                </>
              ) : (
                <p className={styles.loadingText}>Chargement...</p>
              )}
            </div>

            {/* Notifications Section */}
            <NotificationSettings />

            {/* Matching Profile Section */}
            {matchingProfile && (
              <div className={styles.matchingCard}>
                <div className={styles.matchingHeader}>
                  <h4 className={styles.subscriptionTitle}>Profil de matching</h4>
                  {!editingMatching && (
                    <button
                      className={styles.editMatchingBtn}
                      onClick={() => setEditingMatching(true)}
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>

                {!editingMatching ? (
                  <div className={styles.matchingInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Bio</span>
                      <span className={styles.value}>{matchingProfile.bio || 'Non renseignée'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Âge</span>
                      <span className={styles.value}>{matchingProfile.age || 'Non renseigné'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Niveau</span>
                      <span className={styles.value}>
                        {FITNESS_LEVELS.find(l => l.value === matchingProfile.fitnessLevel)?.label || 'Non renseigné'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Ville</span>
                      <span className={styles.value}>{matchingProfile.location?.city || 'Non renseignée'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Activités</span>
                      <span className={styles.value}>
                        {matchingProfile.workoutTypes?.length > 0
                          ? matchingProfile.workoutTypes
                              .map(type => WORKOUT_TYPES.find(w => w.value === type)?.label || type)
                              .join(', ')
                          : 'Aucune'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form className={styles.form} onSubmit={handleUpdateMatchingProfile}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Bio</label>
                      <textarea
                        className={styles.textarea}
                        value={matchingData.bio}
                        onChange={(e) => setMatchingData({ ...matchingData, bio: e.target.value })}
                        rows={3}
                        placeholder="Présentez-vous en quelques mots..."
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Âge</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={matchingData.age}
                          onChange={(e) => setMatchingData({ ...matchingData, age: e.target.value })}
                          min={13}
                          max={120}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Genre</label>
                        <select
                          className={styles.input}
                          value={matchingData.gender}
                          onChange={(e) => setMatchingData({ ...matchingData, gender: e.target.value })}
                        >
                          <option value="male">Homme</option>
                          <option value="female">Femme</option>
                          <option value="other">Autre</option>
                          <option value="prefer_not_say">Ne pas préciser</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Niveau de fitness</label>
                      <select
                        className={styles.input}
                        value={matchingData.fitnessLevel}
                        onChange={(e) => setMatchingData({ ...matchingData, fitnessLevel: e.target.value })}
                      >
                        {FITNESS_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Ville</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={matchingData.city}
                        onChange={(e) => setMatchingData({ ...matchingData, city: e.target.value })}
                        placeholder="Votre ville"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Types d'entraînement ({matchingData.workoutTypes.length})</label>
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

                    <div className={styles.actions}>
                      <BoutonAction type="submit">
                        Enregistrer
                      </BoutonAction>
                      <BoutonAction type="button" onClick={() => setEditingMatching(false)} variant="secondary">
                        Annuler
                      </BoutonAction>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className={styles.actions}>
              {isAdmin && (
                <BoutonAction type="button" onClick={handleAdminClick} variant="admin">
                  🛡️ Administrateur
                </BoutonAction>
              )}
              <BoutonAction type="button" onClick={() => setEditing(true)} variant="secondary">
                Modifier mes informations
              </BoutonAction>
              <BoutonAction type="button" onClick={() => setChangingPassword(true)} variant="secondary">
                Changer mon mot de passe
              </BoutonAction>
              <BoutonAction type="button" onClick={handleLogout} variant="logout">
                Se déconnecter
              </BoutonAction>
            </div>
          </div>
        )}

        {editing && (
          <form className={styles.form} onSubmit={handleUpdateInfo}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prenom">Prénom</label>
              <input
                id="prenom"
                type="text"
                className={styles.input}
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="pseudo">Pseudo</label>
              <input
                id="pseudo"
                type="text"
                className={styles.input}
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <BoutonAction type="submit">
                Enregistrer
              </BoutonAction>
              <BoutonAction type="button" onClick={() => setEditing(false)} variant="secondary">
                Annuler
              </BoutonAction>
            </div>
          </form>
        )}

        {changingPassword && (
          <form className={styles.form} onSubmit={handleChangePassword}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                id="currentPassword"
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                id="newPassword"
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.actions}>
              <BoutonAction type="submit">
                Changer le mot de passe
              </BoutonAction>
              <BoutonAction type="button" onClick={() => setChangingPassword(false)} variant="secondary">
                Annuler
              </BoutonAction>
            </div>
          </form>
        )}

        {editingMatching && (
          <form className={styles.form} onSubmit={handleUpdateMatchingProfile}>
            <h4 className={styles.formTitle}>Modifier mon profil de matching</h4>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Bio</label>
              <textarea
                className={styles.textarea}
                value={matchingData.bio}
                onChange={(e) => setMatchingData({ ...matchingData, bio: e.target.value })}
                rows={3}
                placeholder="Présentez-vous en quelques mots..."
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Âge</label>
                <input
                  type="number"
                  className={styles.input}
                  value={matchingData.age}
                  onChange={(e) => setMatchingData({ ...matchingData, age: e.target.value })}
                  min={13}
                  max={120}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Genre</label>
                <select
                  className={styles.input}
                  value={matchingData.gender}
                  onChange={(e) => setMatchingData({ ...matchingData, gender: e.target.value })}
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_say">Ne pas préciser</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Niveau de fitness</label>
              <select
                className={styles.input}
                value={matchingData.fitnessLevel}
                onChange={(e) => setMatchingData({ ...matchingData, fitnessLevel: e.target.value })}
              >
                {FITNESS_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Ville</label>
              <input
                type="text"
                className={styles.input}
                value={matchingData.city}
                onChange={(e) => setMatchingData({ ...matchingData, city: e.target.value })}
                placeholder="Votre ville"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Types d'entraînement ({matchingData.workoutTypes.length})</label>
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

            <div className={styles.actions}>
              <BoutonAction type="submit">
                Enregistrer
              </BoutonAction>
              <BoutonAction type="button" onClick={() => setEditingMatching(false)} variant="secondary">
                Annuler
              </BoutonAction>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
