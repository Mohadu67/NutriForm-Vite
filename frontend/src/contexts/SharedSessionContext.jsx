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
  startSharedSession as apiStartSession,
  updateExerciseData as apiUpdateExerciseData,
  getSharedProgress,
  getSharedSessionByMatch,
  endSharedSession as apiEndSession,
  cancelSharedSession as apiCancelSession,
  inviteSharedSession
} from '../shared/api/sharedSession';
import { toast } from 'sonner';

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
        setSession(null);
      } else {
        setSession(fetched);
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
      }
    } catch {
      // Pas de session active, c'est normal
    } finally {
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
  useEffect(() => {
    if (!ws?.on) return;

    const cleanups = [];

    // Invitation reçue
    cleanups.push(ws.on('shared_session:invite', (data) => {
      setPendingInvite(data);
      toast.info(`${data.initiator?.username || 'Ton gym bro'} t'invite à une séance !`);
    }));

    // Invitation acceptée — notifier l'initiateur avec action
    cleanups.push(ws.on('shared_session:accepted', (data) => {
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
    cleanups.push(ws.on('shared_session:declined', () => {
      toast.info('Invitation refusée');
      setSession(null);
    }));

    // Exercice ajouté par le partenaire
    cleanups.push(ws.on('shared_session:exercise_added', (data) => {
      refreshSession(data.sharedSessionId);
    }));

    // Exercice supprimé par le partenaire
    cleanups.push(ws.on('shared_session:exercise_removed', (data) => {
      refreshSession(data.sharedSessionId);
    }));

    // Exercices réordonnés
    cleanups.push(ws.on('shared_session:exercises_reordered', (data) => {
      if (sessionRef.current?._id === data.sharedSessionId) {
        setSession(prev => prev ? { ...prev, exercises: data.exercises } : prev);
      }
    }));

    // Séance démarrée
    cleanups.push(ws.on('shared_session:started', (data) => {
      toast.success(`${data.startedBy?.username || 'Ton partenaire'} a lancé la séance !`);
      refreshSession(data.sharedSessionId);
    }));

    // Saisies du partenaire (temps réel)
    cleanups.push(ws.on('shared_session:partner_exercise_update', (data) => {
      setPartnerExerciseData(prev => {
        const next = new Map(prev);
        next.set(data.exerciseOrder, data);
        return next;
      });
    }));

    // Partenaire a terminé
    cleanups.push(ws.on('shared_session:partner_ended', (data) => {
      toast.info(`${data.username || 'Ton partenaire'} a terminé sa séance`);
      // Inject partner summary into partnerExerciseData
      if (data.partnerSummary?.length) {
        setPartnerExerciseData(prev => {
          const next = new Map(prev);
          for (const entry of data.partnerSummary) {
            next.set(entry.exerciseOrder, entry);
          }
          return next;
        });
      }
      if (data.sessionEnded) {
        refreshSession(data.sharedSessionId);
      }
    }));

    // Session annulée
    cleanups.push(ws.on('shared_session:cancelled', () => {
      toast.info('Séance partagée annulée');
      setSession(null);
      setPartnerExerciseData(new Map());
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup && cleanup());
    };
  }, [ws, refreshSession]);

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
        // Keys are "userId:exerciseOrder" — only keep partner entries
        if (!key.startsWith(myId + ':')) {
          partnerMap.set(value.exerciseOrder, value);
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

  // ─── Helpers ─────────────────────────────────────────────
  const myId = String(user?.id || user?._id || '');

  const isParticipant = session && myId && (
    String(session.initiatorId?._id || session.initiatorId || '') === myId ||
    String(session.partnerId?._id || session.partnerId || '') === myId
  );

  const partner = session && myId ? (
    String(session.initiatorId?._id || session.initiatorId || '') === myId
      ? session.partnerId
      : session.initiatorId
  ) : null;

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
