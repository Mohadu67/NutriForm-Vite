couleur Viollette, c'est pas dans ma charte graphique.\ import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from 'sonner';
import { deleteSession, updateSession } from "../../../components/History/SessionTracking/sessionApi.js";
import logger from "../../../shared/utils/logger";

/**
 * Hook pour gérer les sessions (édition, suppression)
 * @param {Function} onSessionDeleted - Callback appelé après suppression réussie (reçoit sessionId)
 * @param {Function} onSessionRenamed - Callback appelé après renommage réussi (reçoit sessionId, newName)
 */
export const useSessionManagement = (onSessionDeleted, onSessionRenamed) => {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [showSessionsPopup, setShowSessionsPopup] = useState(false);
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState(null);
  const saveSessionNameRef = useRef();

  const editInputRef = useCallback((node) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  // Gérer le clic en dehors de l'input pour sauvegarder
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingSessionId && !e.target.closest('input[type="text"]')) {
        saveSessionNameRef.current?.(editingSessionId, editingSessionName);
      }
    };

    if (editingSessionId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingSessionId, editingSessionName]);

  saveSessionNameRef.current = async (sessionId, nameToSave) => {
    if (!nameToSave || !nameToSave.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      await updateSession(sessionId, { name: nameToSave.trim() });
      setEditingSessionId(null);
      toast.success('Séance renommée avec succès !');
      // Mettre à jour le state local
      onSessionRenamed?.(sessionId, nameToSave.trim());
    } catch (err) {
      logger.error("Erreur lors du renommage de la séance:", err);
      if (err?.isPremiumRequired || err?.status === 403) {
        toast.error("Passe Premium pour modifier tes séances ✨");
      } else {
        toast.error("Impossible de renommer la séance");
      }
      setEditingSessionId(null);
    }
  };

  const handleSaveSessionName = useCallback(async (sessionId) => {
    await saveSessionNameRef.current(sessionId, editingSessionName);
  }, [editingSessionName]);

  const handleStartEditSessionName = useCallback(async (session, e) => {
    e?.stopPropagation();
    if (editingSessionId && editingSessionId !== (session.id || session._id)) {
      await saveSessionNameRef.current(editingSessionId, editingSessionName);
    }
    setEditingSessionId(session.id || session._id);
    setEditingSessionName(session.name || "Séance");
  }, [editingSessionId, editingSessionName]);

  const handleCancelEdit = useCallback(() => {
    setEditingSessionId(null);
    setEditingSessionName("");
  }, []);

  const handleDeleteSession = useCallback((sessionId) => {
    setDeleteConfirmSessionId(sessionId);
  }, []);

  const confirmDeleteSession = useCallback(async () => {
    const sessionId = deleteConfirmSessionId;
    setDeleteConfirmSessionId(null);
    if (!sessionId) return;
    try {
      await deleteSession(sessionId);
      toast.success('Séance supprimée avec succès !');
      onSessionDeleted?.(sessionId);
    } catch (err) {
      logger.error("Erreur lors de la suppression de la séance:", err);
      if (err?.isPremiumRequired || err?.status === 403) {
        toast.error("Passe Premium pour supprimer tes séances ✨");
      } else {
        toast.error("Impossible de supprimer la séance");
      }
    }
  }, [deleteConfirmSessionId, onSessionDeleted]);

  const cancelDeleteSession = useCallback(() => {
    setDeleteConfirmSessionId(null);
  }, []);

  return {
    editingSessionId,
    editingSessionName,
    showSessionsPopup,
    deleteConfirmSessionId,
    editInputRef,
    setShowSessionsPopup,
    setEditingSessionName,
    handleStartEditSessionName,
    handleSaveSessionName,
    handleCancelEdit,
    handleDeleteSession,
    confirmDeleteSession,
    cancelDeleteSession
  };
};
