import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import websocketService from '../services/websocket';
import { useAuth } from './AuthContext';
import {
  getActiveSharedSession,
  getSharedSession,
  respondSharedSession,
  inviteSharedSession,
  addSharedExercise,
  removeSharedExercise,
  startSharedSession as apiStartSession,
  updateExerciseData as apiUpdateExerciseData,
  getSharedProgress,
  endSharedSession as apiEndSession,
  cancelSharedSession as apiCancelSession,
} from '../api/sharedSession';

const SharedSessionContext = createContext(null);
const DISMISSED_KEY = '@dismissedSharedSessionId';

const getDismissedId = async () => {
  try { return await AsyncStorage.getItem(DISMISSED_KEY); } catch { return null; }
};
const setDismissedId = async (id) => {
  try {
    if (id) await AsyncStorage.setItem(DISMISSED_KEY, String(id));
    else await AsyncStorage.removeItem(DISMISSED_KEY);
  } catch {}
};

export function SharedSessionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const injectedRef = useRef(null);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [partnerExerciseData, setPartnerExerciseData] = useState(new Map());

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // ─── Load active session on mount ──────────────────────
  const loadActiveSession = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await getActiveSharedSession();
      const fetched = data.sharedSession;
      const dismissed = await getDismissedId();
      if (fetched && dismissed === String(fetched._id)) {
        setSession(null);
      } else {
        setSession(fetched);
        // Si la session est pending et que je suis le destinataire, restaurer l'invite
        if (fetched?.status === 'pending') {
          const myId = String(user?._id || user?.id || '');
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
      // No active session
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadActiveSession(); }, [loadActiveSession]);

  // ─── Refresh session ───────────────────────────────────
  const refreshSession = useCallback(async (sessionId) => {
    try {
      const id = sessionId || sessionRef.current?._id;
      if (!id) return;
      const dismissed = await getDismissedId();
      if (dismissed === String(id)) return;
      const data = await getSharedSession(id);
      const fetched = data.sharedSession;
      const dismissed2 = await getDismissedId();
      if (fetched && dismissed2 === String(fetched._id)) return;
      setSession(fetched);
    } catch {}
  }, []);

  // ─── WebSocket listeners ───────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const onInvite = (data) => {
      setPendingInvite(data);
    };
    const onAccepted = (data) => {
      console.log('[SharedSession] Accepté', 'Invitation acceptée !');
      refreshSession(data.sharedSessionId);
    };
    const onDeclined = () => {
      console.log('[SharedSession] Refusé', 'Invitation refusée');
      setSession(null);
    };
    const onStarted = (data) => {
      console.log('[SharedSession] C\'est parti !', `${data.startedBy?.username || 'Ton partenaire'} a lancé la séance !`);
      refreshSession(data.sharedSessionId);
    };
    const onExerciseAdded = (data) => { refreshSession(data.sharedSessionId); };
    const onExerciseRemoved = (data) => { refreshSession(data.sharedSessionId); };
    const onExercisesReordered = (data) => {
      if (sessionRef.current?._id === data.sharedSessionId) {
        setSession(prev => prev ? { ...prev, exercises: data.exercises } : prev);
      }
    };
    const onPartnerUpdate = (data) => {
      setPartnerExerciseData(prev => {
        const next = new Map(prev);
        next.set(data.exerciseOrder, data);
        return next;
      });
    };
    const onPartnerEnded = (data) => {
      console.log('[SharedSession] Terminé', `${data.username || 'Ton partenaire'} a terminé sa séance`);
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
        // Les deux ont terminé → clear tout
        setDismissedId(sessionRef.current?._id);
        setSession(null);
        setPartnerExerciseData(new Map());
        setMySessionEnded(false);
      }
    };
    const onCancelled = () => {
      console.log('[SharedSession] Annulé', 'Séance partagée annulée');
      setSession(null);
      setPartnerExerciseData(new Map());
    };

    const events = [
      ['shared_session:invite', onInvite],
      ['shared_session:accepted', onAccepted],
      ['shared_session:declined', onDeclined],
      ['shared_session:started', onStarted],
      ['shared_session:exercise_added', onExerciseAdded],
      ['shared_session:exercise_removed', onExerciseRemoved],
      ['shared_session:exercises_reordered', onExercisesReordered],
      ['shared_session:partner_exercise_update', onPartnerUpdate],
      ['shared_session:partner_ended', onPartnerEnded],
      ['shared_session:cancelled', onCancelled],
    ];

    for (const [event, handler] of events) {
      websocketService.on(event, handler);
    }

    return () => {
      for (const [event, handler] of events) {
        websocketService.off(event, handler);
      }
    };
  }, [isAuthenticated, refreshSession]);

  // ─── Actions ───────────────────────────────────────────
  const invite = useCallback(async (matchId, sessionName, gymName) => {
    const data = await inviteSharedSession(matchId, sessionName, gymName);
    await setDismissedId(null);
    setSession(data.sharedSession);
    return data.sharedSession;
  }, []);

  const respond = useCallback(async (sessionId, accept) => {
    const data = await respondSharedSession(sessionId, accept);
    setPendingInvite(null);
    if (accept && data.sharedSession) {
      await setDismissedId(null);
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

  const removeExerciseFromSession = useCallback(async (order) => {
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
    try { await apiUpdateExerciseData(id, data); } catch {}
  }, []);

  const loadProgress = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    try {
      const { progress } = await getSharedProgress(id);
      const myId = String(user?._id || '');
      const partnerMap = new Map();
      for (const [key, value] of Object.entries(progress)) {
        if (!key.startsWith(myId + ':')) {
          partnerMap.set(value.exerciseOrder, value);
        }
      }
      setPartnerExerciseData(partnerMap);
    } catch {}
  }, [user]);

  const [mySessionEnded, setMySessionEnded] = useState(false);

  const endSession = useCallback(async (workoutSessionId) => {
    const id = sessionRef.current?._id;
    if (!id) return;
    setMySessionEnded(true);
    try { await apiEndSession(id, workoutSessionId); } catch {}
    // Refresh pour voir si les deux ont terminé
    try {
      const data = await getSharedSession(id);
      if (data.sharedSession?.status === 'ended') {
        await setDismissedId(id);
        setSession(null);
        setPartnerExerciseData(new Map());
        setMySessionEnded(false);
      }
    } catch {}
  }, []);

  const cancelSession = useCallback(async () => {
    const id = sessionRef.current?._id;
    if (!id) return;
    await setDismissedId(id);
    setSession(null);
    setPartnerExerciseData(new Map());
    try { await apiCancelSession(id); } catch {}
  }, []);

  const dismissInvite = useCallback(() => { setPendingInvite(null); }, []);

  // ─── Helpers ───────────────────────────────────────────
  const myId = String(user?._id || user?.id || '');
  const isParticipant = !!(session && myId && (
    String(session.initiatorId?._id || session.initiatorId || '') === myId ||
    String(session.partnerId?._id || session.partnerId || '') === myId
  ));
  const partner = session && myId ? (
    String(session.initiatorId?._id || session.initiatorId || '') === myId
      ? session.partnerId : session.initiatorId
  ) : null;

  const value = {
    session, loading, pendingInvite, partnerExerciseData, isParticipant, partner, mySessionEnded,
    invite, respond, addExercise, removeExercise: removeExerciseFromSession,
    startSession, sendExerciseData, loadProgress,
    endSession, cancelSession, refreshSession, dismissInvite,
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

export default SharedSessionContext;
