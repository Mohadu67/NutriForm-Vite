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
  updateSharedProgress as apiUpdateProgress,
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
  const [partnerProgress, setPartnerProgress] = useState(null); // progression du partenaire

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // ─── Charger la session active au montage ────────────────
  const loadActiveSession = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await getActiveSharedSession();
      setSession(data.sharedSession);
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
      const data = await getSharedSession(id);
      setSession(data.sharedSession);
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

    // Progression du partenaire
    cleanups.push(ws.on('shared_session:partner_progress', (data) => {
      setPartnerProgress(data);
    }));

    // Partenaire a terminé
    cleanups.push(ws.on('shared_session:partner_ended', (data) => {
      toast.info(`${data.username || 'Ton partenaire'} a terminé sa séance`);
      if (data.sessionEnded) {
        refreshSession(data.sharedSessionId);
      }
    }));

    // Session annulée
    cleanups.push(ws.on('shared_session:cancelled', () => {
      toast.info('Séance partagée annulée');
      setSession(null);
      setPartnerProgress(null);
    }));

    return () => {
      cleanups.forEach(cleanup => cleanup && cleanup());
    };
  }, [ws, refreshSession]);

  // ─── Actions ─────────────────────────────────────────────
  const invite = useCallback(async (matchId, sessionName, gymName) => {
    const data = await inviteSharedSession(matchId, sessionName, gymName);
    setSession(data.sharedSession);
    return data.sharedSession;
  }, []);

  const respond = useCallback(async (sessionId, accept) => {
    const data = await respondSharedSession(sessionId, accept);
    setPendingInvite(null);
    if (accept && data.sharedSession) {
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

  const sendProgress = useCallback(async (progress) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    await apiUpdateProgress(id, progress);
  }, []);

  const endSession = useCallback(async (workoutSessionId) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    const data = await apiEndSession(id, workoutSessionId);
    setSession(data.sharedSession);
  }, []);

  const cancelSession = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    await apiCancelSession(id);
    setSession(null);
    setPartnerProgress(null);
  }, []);

  const dismissInvite = useCallback(() => {
    setPendingInvite(null);
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
    partnerProgress,
    isParticipant,
    partner,
    // Actions
    invite,
    respond,
    addExercise,
    removeExercise,
    startSession,
    sendProgress,
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
