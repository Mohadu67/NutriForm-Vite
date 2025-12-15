import React, { useState, useCallback, useEffect, useRef } from "react";
import { deleteSession, updateSession } from "../../../components/History/SessionTracking/sessionApi.js";
import { confirmDialog, showSuccess, showError } from "../../../utils/confirmDialog.jsx";
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
      showSuccess('Séance renommée avec succès !');
      // Mettre à jour le state local
      onSessionRenamed?.(sessionId, nameToSave.trim());
    } catch (err) {
      logger.error("Erreur lors du renommage de la séance:", err);
      if (err?.isPremiumRequired || err?.status === 403) {
        showError("Passe Premium pour modifier tes séances ✨");
      } else {
        showError("Impossible de renommer la séance");
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

  const handleDeleteSession = useCallback(async (sessionId) => {
    const ok = await confirmDialog(
      "Cette action est irréversible. Voulez-vous vraiment supprimer cette séance ?",
      {
        title: "Supprimer la séance",
        confirmText: "Supprimer",
        cancelText: "Annuler",
        type: "error"
      }
    );
    if (!ok) return;
    try {
      await deleteSession(sessionId);
      showSuccess('Séance supprimée avec succès !');
      // Mettre à jour le state local
      onSessionDeleted?.(sessionId);
    } catch (err) {
      logger.error("Erreur lors de la suppression de la séance:", err);
      if (err?.isPremiumRequired || err?.status === 403) {
        showError("Passe Premium pour supprimer tes séances ✨");
      } else {
        showError("Impossible de supprimer la séance");
      }
    }
  }, [onSessionDeleted]);

  return {
    editingSessionId,
    editingSessionName,
    showSessionsPopup,
    editInputRef,
    setShowSessionsPopup,
    setEditingSessionName,
    handleStartEditSessionName,
    handleSaveSessionName,
    handleCancelEdit,
    handleDeleteSession
  };
};
