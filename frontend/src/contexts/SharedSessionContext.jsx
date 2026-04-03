import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';
import {
  getActiveSharedSession,
  getSharedSession,
  respondSharedSession,
  addSharedExercise,
  removeSharedExercise,
  removeMySharedExercise,
  toggleExerciseSelection as apiToggleSelection,
  startSharedSession as apiStartSession,
  updateExerciseData as apiUpdateExerciseData,
  getSharedProgress,
  getSharedSessionByMatch,
  endSharedSession as apiEndSession,
  cancelSharedSession as apiCancelSession,
  inviteSharedSession
} from '../shared/api/sharedSession';
import { toast } from 'sonner';
import { toastSessionInvite, toastPartnerAction } from '../utils/richToast';

const SharedSessionContext = createContext(null);

export function SharedSessionProvider({ children }) {
  const { user } = useAuth();
  const ws = useWebSocket();
  const navigateRef = useRef(null);

  // On utilise un ref pour navigate car le context est monté avant les Routes
  try {
    navigateRef.current = useNavigate();
  } catch {
    // Ignore si pas dans un Router (ne devrait pas arriver)
  }

  const [session, setSession] = useState(null);       // SharedSession courante
  const [loading, setLoading] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null); // invitation reçue en attente
  const [inviteModalDismissed, setInviteModalDismissed] = useState(false); // modal fermée mais invite toujours active
  const [partnerExerciseData, setPartnerExerciseData] = useState(new Map()); // Map exerciseOrder → saisies partenaire

  // sessionStorage pour persister le dismiss après rechargement page
  const DISMISSED_KEY = 'dismissedSharedSessionId';
  const getDismissedId = () => {
    try { return sessionStorage.getItem(DISMISSED_KEY); } catch { return null; }
  };
  const setDismissedId = (id) => {
    try {
      if (id) sessionStorage.setItem(DISMISSED_KEY, String(id));
      else sessionStorage.removeItem(DISMISSED_KEY);
    } catch { /* silent */ }
  };

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // ─── Charger la session active au montage ────────────────
  const loadActiveSession = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await getActiveSharedSession();
      const fetched = data.sharedSession;
      // Ne pas recharger une session que l'user a déjà terminée/annulée
      if (fetched && getDismissedId() === String(fetched._id)) {
        // Batch: set session + loading together to avoid flash
        setSession(null);
        setLoading(false);
      } else {
        // Si pending et que je suis le destinataire, restaurer l'invite
        if (fetched?.status === 'pending') {
          const myId = String(user?.id || user?._id || '');
          const isRecipient = String(fetched.partnerId?._id || fetched.partnerId || '') === myId;
          if (isRecipient) {
            setPendingInvite({
              sharedSessionId: fetched._id,
              initiator: fetched.initiatorId || {},
              sessionName: fetched.sessionName || '',
              gymName: fetched.gymName || '',
            });
          }
        }
        // Batch: set session BEFORE loading=false to prevent intermediate null state
        setSession(fetched);
        setLoading(false);
      }
    } catch {
      // Pas de session active, c'est normal
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // ─── Refresh la session depuis le serveur ────────────────
  const refreshSession = useCallback(async (sessionId) => {
    try {
      const id = sessionId || sessionRef.current?._id;
      if (!id) return;
      // Ne pas recharger une session dismissed
      if (getDismissedId() === String(id)) return;
      const data = await getSharedSession(id);
      const fetched = data.sharedSession;
      if (fetched && getDismissedId() === String(fetched._id)) return;
      setSession(fetched);
    } catch (err) {
      console.error('Erreur refresh shared session:', err);
    }
  }, []);

  // ─── WebSocket listeners ─────────────────────────────────
  // Depend on isConnected so listeners re-attach when socket reconnects
  const wsOn = ws?.on;
  const wsConnected = ws?.isConnected;
  useEffect(() => {
    if (!wsOn || !wsConnected) return;

    const cleanups = [];

    // Invitation reçue — rich toast avec actions
    cleanups.push(wsOn('shared_session:invite', (data) => {
      setPendingInvite(data);
      toastSessionInvite({
        username: data.initiator?.pseudo || data.initiator?.username || 'Ton gym bro',
        sessionName: data.sessionName,
        onAccept: async () => {
          try {
            const res = await respondSharedSession(data.sharedSessionId, true);
            setPendingInvite(null);
            if (res.sharedSession) setSession(res.sharedSession);
            if (navigateRef.current) {
              navigateRef.current(`/shared-session/${data.sharedSessionId}`);
            }
          } catch { /* silent */ }
        },
        onDecline: async () => {
          try {
            await respondSharedSession(data.sharedSessionId, false);
            setPendingInvite(null);
          } catch { /* silent */ }
        },
      });
    }));

    // Invitation acceptée — notifier l'initiateur avec action
    cleanups.push(wsOn('shared_session:accepted', (data) => {
      toast.success('Invitation acceptée !', {
        action: {
          label: 'Construire la séance',
          onClick: () => {
            if (navigateRef.current) {
              navigateRef.current(`/shared-session/${data.sharedSessionId}`);
            }
          }
        },
        duration: 8000
      });
      refreshSession(data.sharedSessionId);
    }));

    // Invitation refusée
    cleanups.push(wsOn('shared_session:declined', () => {
      toast.info('Invitation refusée');
      setSession(null);
    }));

    // Exercice ajouté par le partenaire
    cleanups.push(wsOn('shared_session:exercise_added', (data) => {
      refreshSession(data.sharedSessionId);
    }));

    // Exercice supprimé par le partenaire
    cleanups.push(wsOn('shared_session:exercise_removed', (data) => {
      refreshSession(data.sharedSessionId);
    }));

    // Exercices réordonnés
    cleanups.push(wsOn('shared_session:exercises_reordered', (data) => {
      if (sessionRef.current?._id === data.sharedSessionId) {
        setSession(prev => prev ? { ...prev, exercises: data.exercises } : prev);
      }
    }));

    // Séance démarrée
    cleanups.push(wsOn('shared_session:started', (data) => {
      toastPartnerAction({
        username: data.startedBy?.pseudo || data.startedBy?.username || 'Ton partenaire',
        message: 'a lancé la séance !',
        icon: '🚀',
      });
      refreshSession(data.sharedSessionId);
    }));

    // Saisies du partenaire (temps réel)
    cleanups.push(wsOn('shared_session:partner_exercise_update', (data) => {
      setPartnerExerciseData(prev => {
        const next = new Map(prev);
        next.set(data.exerciseName || data.exerciseOrder, data);
        return next;
      });
    }));

    // Partenaire a terminé
    cleanups.push(wsOn('shared_session:partner_ended', (data) => {
      if (data.partnerSummary?.length) {
        setPartnerExerciseData(prev => {
          const next = new Map(prev);
          for (const entry of data.partnerSummary) {
            next.set(entry.exerciseName || entry.exerciseOrder, entry);
          }
          return next;
        });
      }
      if (data.sessionEnded) {
        toastPartnerAction({
          username: '',
          message: 'Séance duo terminée !',
          icon: '🎉',
        });
        refreshSession(data.sharedSessionId);
      } else {
        toastPartnerAction({
          username: data.username || 'Ton partenaire',
          message: 'a terminé. À toi de finir !',
          icon: '🏁',
        });
        refreshSession(data.sharedSessionId);
      }
    }));

    // Session annulée
    cleanups.push(wsOn('shared_session:cancelled', () => {
      toastPartnerAction({
        username: '',
        message: 'Séance partagée annulée',
        icon: '✖',
      });
      setSession(null);
      setPartnerExerciseData(new Map());
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup && cleanup());
    };
  }, [wsOn, wsConnected, refreshSession]);

  // ─── Actions ─────────────────────────────────────────────
  const invite = useCallback(async (matchId, sessionName, gymName) => {
    const data = await inviteSharedSession(matchId, sessionName, gymName);
    setDismissedId(null);
    setSession(data.sharedSession);
    return data.sharedSession;
  }, []);

  const respond = useCallback(async (sessionId, accept) => {
    const data = await respondSharedSession(sessionId, accept);
    setPendingInvite(null);
    setInviteModalDismissed(false);
    if (accept && data.sharedSession) {
      setDismissedId(null);
      setSession(data.sharedSession);
    }
    return data;
  }, []);

  const addExercise = useCallback(async (exercise) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await addSharedExercise(id, exercise);
    setSession(data.sharedSession);
  }, []);

  const removeExercise = useCallback(async (order) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await removeSharedExercise(id, order);
    setSession(data.sharedSession);
  }, []);

  const toggleSelection = useCallback(async (exerciseName) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await apiToggleSelection(id, exerciseName);
    setSession(data.sharedSession);
  }, []);

  const removeMyExercise = useCallback(async (exerciseName) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await removeMySharedExercise(id, exerciseName);
    setSession(data.sharedSession);
  }, []);

  const startSession = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await apiStartSession(id);
    setSession(data.sharedSession);
  }, []);

  const sendExerciseData = useCallback(async (data) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    await apiUpdateExerciseData(id, data);
  }, []);

  const loadProgress = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    try {
      const { progress } = await getSharedProgress(id);
      const myId = String(user?.id || user?._id || '');
      const partnerMap = new Map();
      for (const [key, value] of Object.entries(progress)) {
        // Keys are "userId:exerciseName" — only keep partner entries
        if (!key.startsWith(myId + ':')) {
          partnerMap.set(value.exerciseName || value.exerciseOrder, value);
        }
      }
      setPartnerExerciseData(partnerMap);
    } catch { /* silent */ }
  }, [user]);

  const endSession = useCallback(async (workoutSessionId) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    // Dismiss AVANT l'appel API pour bloquer tout refresh concurrent
    setDismissedId(id);
    setSession(null);
    setPartnerExerciseData(new Map());
    await apiEndSession(id, workoutSessionId);
  }, []);

  const cancelSession = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    setDismissedId(id);
    await apiCancelSession(id);
    setSession(null);
    setPartnerExerciseData(new Map());
  }, []);

  const dismissInvite = useCallback(() => {
    setInviteModalDismissed(true);
  }, []);

  // ─── Helpers (calculés par le backend via enrichSession) ─
  const isParticipant = session?.myRole != null;
  const partner = session?.partner || null;

  const value = {
    session,
    loading,
    pendingInvite,
    inviteModalDismissed,
    partnerExerciseData,
    isParticipant,
    partner,
    // Actions
    invite,
    respond,
    addExercise,
    removeExercise,
    removeMyExercise,
    toggleSelection,
    startSession,
    sendExerciseData,
    loadProgress,
    endSession,
    cancelSession,
    refreshSession,
    dismissInvite
  };

  return (
    <SharedSessionContext.Provider value={value}>
      {children}
    </SharedSessionContext.Provider>
  );
}

export function useSharedSession() {
  return useContext(SharedSessionContext);
}
