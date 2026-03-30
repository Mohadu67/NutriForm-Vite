import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import social from '../../shared/api/social.js';
import client from '../../shared/api/client.js';
import { endpoints } from '../../shared/api/endpoints.js';
import { getOrCreateSocialConversation } from '../../shared/api/matchChat.js';
import { useChat } from '../../contexts/ChatContext.jsx';
import styles from './UserPublicProfilePage.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};

const formatDateShort = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

const MUSCLE_COLORS = {
  'Pectoraux': '#E8895A', 'Dos': '#7B9CFF', 'Biceps': '#FF6B8A',
  'Triceps': '#A78BFA', 'Épaules': '#34D399', 'Jambes': '#FBBF24',
  'Abdos': '#60A5FA', 'Mollets': '#F87171', 'Cardio': '#22D3EE',
};

// ─── Types de défis disponibles ───────────────────────────────────────────────

const CHALLENGE_TYPES = [
  { type: 'max_pushups',  label: 'Max Pompes',           icon: '💪', unit: 'reps', category: 'max', desc: 'Qui fait le plus de pompes?' },
  { type: 'max_pullups',  label: 'Max Tractions',         icon: '🔝', unit: 'reps', category: 'max', desc: 'Qui fait le plus de tractions?' },
  { type: 'max_bench',    label: 'Développé Couché Max',  icon: '🏋️', unit: 'kg',   category: 'max', desc: 'Qui soulève le plus lourd?' },
  { type: 'max_squat',    label: 'Squat Max',             icon: '🦵', unit: 'kg',   category: 'max', desc: 'Squat 1RM — qui est le plus fort?' },
  { type: 'max_deadlift', label: 'Soulevé de terre Max',  icon: '⚡', unit: 'kg',   category: 'max', desc: 'Deadlift 1RM — épreuve de force pure' },
  { type: 'max_burpees',  label: 'Max Burpees (60s)',     icon: '🔥', unit: 'reps', category: 'max', desc: 'Qui en fait le plus en 60 secondes?' },
  { type: 'sessions',     label: 'Plus de séances',       icon: '📅', unit: null,   category: 'ongoing', desc: 'Qui s\'entraîne le plus souvent?' },
  { type: 'calories',     label: 'Plus de calories',      icon: '🌡️', unit: null,   category: 'ongoing', desc: 'Qui brûle le plus de calories?' },
];

// ─── Modal de défi ────────────────────────────────────────────────────────────

function ChallengeModal({ targetUser, onClose }) {
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState(7);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await client.post(endpoints.challenges.create, {
        challengedId: targetUser._id,
        type: selected.type,
        duration: selected.category === 'max' ? 7 : duration,
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi du défi');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalSuccess}>
            <div className={styles.successIcon}>⚡</div>
            <div className={styles.successTitle}>Défi envoyé !</div>
            <div className={styles.successSub}>
              {targetUser.prenom || targetUser.pseudo} recevra une notification pour accepter ou refuser.
            </div>
            <button className={styles.modalPrimaryBtn} onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>⚡ Lancer un défi</div>
          <div className={styles.modalSub}>
            à {targetUser.prenom || targetUser.pseudo}
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.rewardBanner}>
          🏆 Le gagnant remporte <strong>150 XP</strong> + badge exclusif
        </div>

        <div className={styles.challengeGrid}>
          {CHALLENGE_TYPES.map((ct) => (
            <button
              key={ct.type}
              className={`${styles.challengeOption} ${selected?.type === ct.type ? styles.challengeOptionActive : ''}`}
              onClick={() => setSelected(ct)}
            >
              <span className={styles.challengeOptionIcon}>{ct.icon}</span>
              <span className={styles.challengeOptionLabel}>{ct.label}</span>
              <span className={styles.challengeOptionDesc}>{ct.desc}</span>
              {ct.category === 'max' && (
                <span className={styles.maxBadge}>Max</span>
              )}
            </button>
          ))}
        </div>

        {selected && selected.category === 'ongoing' && (
          <div className={styles.durationPicker}>
            <div className={styles.durationLabel}>Durée du défi</div>
            <div className={styles.durationBtns}>
              {[3, 7, 14, 30].map(d => (
                <button
                  key={d}
                  className={`${styles.durationBtn} ${duration === d ? styles.durationBtnActive : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d}j
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && selected.category === 'max' && (
          <div className={styles.maxInfo}>
            📏 Les deux participants ont <strong>7 jours</strong> pour soumettre leur meilleur résultat en <strong>{selected.unit === 'kg' ? 'kg' : 'reps'}</strong>.
          </div>
        )}

        {error && <div className={styles.errorMsg}>{error}</div>}

        <button
          className={styles.modalPrimaryBtn}
          onClick={handleSend}
          disabled={!selected || sending}
        >
          {sending ? 'Envoi…' : selected ? `Défier — ${selected.label}` : 'Choisis un défi'}
        </button>
      </div>
    </div>
  );
}


// ─── Mini Workout Card ────────────────────────────────────────────────────────

function MiniCard({ session }) {
  const muscles = (session.muscleGroups || []).slice(0, 3);
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniCardAccent} />
      <div className={styles.miniCardBody}>
        <div className={styles.miniCardName}>{session.name || 'Séance'}</div>
        <div className={styles.miniCardMeta}>
          <span>{formatDuration(session.durationSec)}</span>
          {session.volumeKg > 0 && <span>· {session.volumeKg >= 1000
            ? `${(session.volumeKg / 1000).toFixed(1).replace('.', ',')} t`
            : `${session.volumeKg.toLocaleString('fr-FR')} kg`}</span>}
        </div>
        <div className={styles.miniCardDate}>{formatDateShort(session.endedAt)}</div>
        {muscles.length > 0 && (
          <div className={styles.miniCardMuscles}>
            {muscles.map((m, i) => {
              const color = MUSCLE_COLORS[m] || '#E89A6F';
              return (
                <span key={i} className={styles.miniMuscleTag}
                  style={{ color, backgroundColor: `${color}18`, borderColor: `${color}40` }}>
                  {m}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function UserPublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { openMatchChat } = useChat() || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await social.getUserProfile(userId);
        const data = res.data;
        setProfile(data);
        setIsFollowing(data.isFollowing || false);
        setFollowCount(data.followersCount || 0);
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleFollow = async () => {
    const was = isFollowing;
    setIsFollowing(!was);
    setFollowCount(c => was ? c - 1 : c + 1);
    try {
      if (was) await social.unfollow(userId);
      else await social.follow(userId);
    } catch {
      setIsFollowing(was);
      setFollowCount(c => was ? c + 1 : c - 1);
    }
  };

  const handleOpenChat = async () => {
    if (msgLoading) return;
    setMsgLoading(true);
    try {
      const { conversation } = await getOrCreateSocialConversation(userId);
      openMatchChat(conversation);
    } catch (err) {
      console.error('[handleOpenChat] Erreur:', err?.response?.data || err);
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loaderWrap}><div className={styles.spinner} /></div>
        <Footer />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>👤</div>
          <div className={styles.notFoundTitle}>Profil introuvable</div>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Retour</button>
        </div>
        <Footer />
      </div>
    );
  }

  const user = profile.user || {};
  const sessions = profile.recentSessions || [];

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.layout}>

        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileBg} />
          <div className={styles.profileContent}>
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              {user.photo
                ? <img src={user.photo} alt="" className={styles.avatar} />
                : <div className={styles.avatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
              }
            </div>

            {/* Name */}
            <div className={styles.userName}>{user.prenom || user.pseudo || 'Utilisateur'}</div>
            {user.pseudo && <div className={styles.userPseudo}>@{user.pseudo}</div>}
            {user.bio && <div className={styles.userBio}>{user.bio}</div>}

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{profile.sessionsCount ?? 0}</div>
                <div className={styles.statLabel}>Entraînements</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <div className={styles.statValue}>{followCount}</div>
                <div className={styles.statLabel}>Abonnés</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <div className={styles.statValue}>{profile.followingCount ?? 0}</div>
                <div className={styles.statLabel}>Abonnements</div>
              </div>
            </div>

            {/* Actions */}
            {!profile.isMe && (
              <div className={styles.actions}>
                <button
                  className={`${styles.followBtn} ${isFollowing ? styles.followBtnFollowing : styles.followBtnFollow}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? '✓ Abonné' : '+ Suivre'}
                </button>

                <button
                  className={styles.actionBtn}
                  onClick={handleOpenChat}
                  disabled={msgLoading}
                  title="Envoyer un message"
                >
                  {msgLoading ? '…' : '💬 Message'}
                </button>

                <button
                  className={styles.challengeBtn}
                  onClick={() => setShowChallengeModal(true)}
                  title="Lancer un défi"
                >
                  ⚡ Défi
                </button>
              </div>
            )}

            {profile.isMe && (
              <div className={styles.actions}>
                <button className={styles.fluxBtn} onClick={() => navigate('/flux')}>← Flux</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className={styles.sessionsSection}>
          <div className={styles.sectionTitle}>Séances récentes</div>
          {sessions.length === 0 ? (
            <div className={styles.empty}>Aucune séance publique pour l'instant.</div>
          ) : (
            <div className={styles.sessionsGrid}>
              {sessions.map(s => <MiniCard key={s._id} session={s} />)}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showChallengeModal && (
        <ChallengeModal
          targetUser={user}
          onClose={() => setShowChallengeModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
