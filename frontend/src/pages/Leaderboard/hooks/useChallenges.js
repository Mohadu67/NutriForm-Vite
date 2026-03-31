import { useState, useEffect, useCallback } from 'react';
import { secureApiCall } from '../../../utils/authService';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import logger from '../../../shared/utils/logger';

export function useChallenges() {
  const webSocketContext = useWebSocket();
  const { on, isConnected } = webSocketContext || {};
  const [challenges, setChallenges] = useState({
    active: [],
    pending: [],
    completed: []
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les défis
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/challenges');
      const data = await response.json();

      if (data.success) {
        setChallenges(data.data);
      }
    } catch (err) {
      logger.error('Erreur chargement défis:', err);
      setError('Impossible de charger les défis');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await secureApiCall('/challenges/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      logger.error('Erreur chargement stats défis:', err);
    }
  }, []);

  // Créer un défi
  const createChallenge = useCallback(async (challengedId, type, duration = 7) => {
    try {
      const response = await secureApiCall('/challenges', {
        method: 'POST',
        body: JSON.stringify({ challengedId, type, duration })
      });
      const data = await response.json();

      if (data.success) {
        await fetchChallenges();
        return { success: true, challenge: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      logger.error('Erreur création défi:', err);
      return { success: false, message: 'Erreur lors de la création du défi' };
    }
  }, [fetchChallenges]);

  // Accepter un défi
  const acceptChallenge = useCallback(async (challengeId) => {
    try {
      const response = await secureApiCall(`/challenges/${challengeId}/accept`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await fetchChallenges();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      logger.error('Erreur acceptation défi:', err);
      return { success: false, message: 'Erreur lors de l\'acceptation' };
    }
  }, [fetchChallenges]);

  // Refuser un défi
  const declineChallenge = useCallback(async (challengeId) => {
    try {
      const response = await secureApiCall(`/challenges/${challengeId}/decline`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await fetchChallenges();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      logger.error('Erreur refus défi:', err);
      return { success: false, message: 'Erreur lors du refus' };
    }
  }, [fetchChallenges]);

  // Annuler un défi
  const cancelChallenge = useCallback(async (challengeId) => {
    try {
      const response = await secureApiCall(`/challenges/${challengeId}/cancel`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await fetchChallenges();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      logger.error('Erreur annulation défi:', err);
      return { success: false, message: 'Erreur lors de l\'annulation' };
    }
  }, [fetchChallenges]);

  // Soumettre un résultat (défis max)
  const submitResult = useCallback(async (challengeId, result) => {
    try {
      const response = await secureApiCall(`/challenges/${challengeId}/submit-result`, {
        method: 'POST',
        body: JSON.stringify({ result: Number(result) })
      });
      const data = await response.json();

      if (data.success) {
        await fetchChallenges();
        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      logger.error('Erreur soumission résultat:', err);
      return { success: false, message: 'Erreur lors de la soumission' };
    }
  }, [fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, [fetchChallenges, fetchStats]);

  // Rafraîchir quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchChallenges();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchChallenges]);

  // Écouter les mises à jour via WebSocket
  useEffect(() => {
    if (!isConnected || !on) return;

    const cleanups = [];

    // Rafraîchir quand on reçoit une notification de challenge
    cleanups.push(on('new_notification', (notification) => {
      const challengeActions = ['challenge_session', 'challenge_received', 'challenge_accepted', 'challenge_declined'];
      if (notification.metadata?.action && challengeActions.includes(notification.metadata.action)) {
        logger.info('Challenge notification received, refreshing challenges...');
        fetchChallenges();
      }
    }));

    // Rafraîchir quand on reçoit une mise à jour de score direct
    cleanups.push(on('challenge_score_update', (data) => {
      logger.info('Challenge score update received, refreshing challenges...', data);
      fetchChallenges();
    }));

    return () => cleanups.forEach(cleanup => cleanup && cleanup());
  }, [on, isConnected, fetchChallenges]);

  return {
    challenges,
    stats,
    loading,
    error,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    submitResult,
    refresh: fetchChallenges
  };
}

// Hook pour les badges
export function useBadges(userId = null) {
  const [badges, setBadges] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [stats, setStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = userId ? `/badges/user/${userId}` : '/badges/me';
      const response = await secureApiCall(endpoint);
      const data = await response.json();

      if (data.success) {
        setBadges(data.data.badges || []);
        setDisplayed(data.data.displayed || []);
        setStats(data.data.stats || { unlocked: 0, total: 0, percentage: 0 });
      }
    } catch (err) {
      logger.error('Erreur chargement badges:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const setDisplayedBadges = useCallback(async (badgeCodes) => {
    try {
      const response = await secureApiCall('/badges/displayed', {
        method: 'PUT',
        body: JSON.stringify({ badgeCodes })
      });
      const data = await response.json();

      if (data.success) {
        setDisplayed(data.data);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      logger.error('Erreur mise à jour badges:', err);
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    displayed,
    stats,
    loading,
    setDisplayedBadges,
    refresh: fetchBadges
  };
}

// Utilitaires
export const CHALLENGE_TYPES = {
  // Défis en durée (ongoing)
  sessions: { label: 'Séances', icon: '🏋️', metric: 'séances', category: 'ongoing' },
  streak: { label: 'Streak', icon: '🔥', metric: 'jours', category: 'ongoing' },
  calories: { label: 'Calories', icon: '⚡', metric: 'kcal', category: 'ongoing' },
  duration: { label: 'Durée', icon: '⏱️', metric: 'min', category: 'ongoing' },
  // Défis record max (one-shot)
  max_pushups: { label: 'Pompes', icon: '💪', metric: 'reps', category: 'max' },
  max_pullups: { label: 'Tractions', icon: '🧗', metric: 'reps', category: 'max' },
  max_bench: { label: 'Dev. couché', icon: '🏋️‍♂️', metric: 'kg', category: 'max' },
  max_squat: { label: 'Squat', icon: '🦵', metric: 'kg', category: 'max' },
  max_deadlift: { label: 'Soulevé de terre', icon: '🏗️', metric: 'kg', category: 'max' },
  max_burpees: { label: 'Burpees 60s', icon: '🔄', metric: 'reps', category: 'max' },
};

export const CHALLENGE_DURATIONS = [
  { value: 3, label: '3 jours' },
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' }
];

export const LEAGUE_INFO = {
  starter: { name: 'Starter', icon: '🆕', color: '#9CA3AF', min: 0, max: 99 },
  bronze: { name: 'Bronze', icon: '🥉', color: '#CD7F32', min: 100, max: 499 },
  silver: { name: 'Argent', icon: '🥈', color: '#C0C0C0', min: 500, max: 999 },
  gold: { name: 'Or', icon: '🥇', color: '#FFD700', min: 1000, max: 1499 },
  diamond: { name: 'Diamant', icon: '💎', color: '#B9F2FF', min: 1500, max: 1999 },
  champion: { name: 'Champion', icon: '🏆', color: '#FF6B6B', min: 2000, max: Infinity }
};

export function getLeagueForXP(xp) {
  if (xp >= 2000) return 'champion';
  if (xp >= 1500) return 'diamond';
  if (xp >= 1000) return 'gold';
  if (xp >= 500) return 'silver';
  if (xp >= 100) return 'bronze';
  return 'starter';
}

export function getProgressToNextLeague(xp) {
  const currentLeague = getLeagueForXP(xp);
  const info = LEAGUE_INFO[currentLeague];

  if (currentLeague === 'champion') {
    return { current: xp, target: xp, percentage: 100, nextLeague: null };
  }

  const leagues = ['starter', 'bronze', 'silver', 'gold', 'diamond', 'champion'];
  const nextLeagueIndex = leagues.indexOf(currentLeague) + 1;
  const nextLeague = leagues[nextLeagueIndex];
  const target = LEAGUE_INFO[nextLeague].min;

  const progressInCurrentLeague = xp - info.min;
  const rangeOfCurrentLeague = target - info.min;
  const percentage = Math.round((progressInCurrentLeague / rangeOfCurrentLeague) * 100);

  return {
    current: xp,
    target,
    percentage: Math.min(percentage, 100),
    nextLeague,
    remaining: target - xp
  };
}
