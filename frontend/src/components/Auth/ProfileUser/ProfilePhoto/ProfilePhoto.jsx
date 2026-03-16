import React, { useState, useEffect } from "react";
import styles from "./ProfilePhoto.module.css";
import { secureApiCall } from "../../../../utils/authService.js";
import { storage } from "../../../../shared/utils/storage";
import logger from '../../../../shared/utils/logger.js';
import ConfirmModal from "../../../Modal/ConfirmModal.jsx";

export default function ProfilePhoto({ user }) {
  const [photo, setPhoto] = useState(user?.photo || null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user?.photo) {
      setPhoto(user.photo);
    }
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La photo ne doit pas dépasser 5MB" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await secureApiCall('/upload/profile-photo', {
        method: "POST",
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        setPhoto(data.photo);

        const userData = storage.get("user");
        if (userData) {
          userData.photo = data.photo;
          storage.set("user", userData);
        }

        setMessage({ type: "success", text: "Photo mise à jour avec succès" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur lors de l'upload" });
      }
    } catch (err) {
      logger.error("Erreur upload photo:", err);
      setMessage({ type: "error", text: err.message || "Erreur lors de l'upload de la photo" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await secureApiCall('/upload/profile-photo', {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setPhoto(null);

        const userData = storage.get("user");
        if (userData) {
          userData.photo = null;
          storage.set("user", userData);
        }

        setMessage({ type: "success", text: "Photo supprimée avec succès" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Erreur lors de la suppression" });
      }
    } catch (err) {
      logger.error("Erreur suppression photo:", err);
      setMessage({ type: "error", text: "Erreur lors de la suppression de la photo" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Photo de profil</h3>

      <div className={styles.photoSection}>
        <div className={styles.photoContainer}>
          {photo ? (
            <img
              src={photo}
              alt="Photo de profil"
              className={styles.photo}
            />
          ) : (
            <div className={styles.photoPlaceholder}>
              {user?.pseudo?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <label htmlFor="photo-upload" className={styles.uploadButton}>
            {uploading ? "Upload..." : photo ? "Changer" : "Ajouter"}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handlePhotoChange}
              disabled={uploading}
            />
          </label>

          {photo && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={styles.deleteButton}
              disabled={uploading}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <p className={styles.hint}>
        Formats acceptés : JPG, PNG, GIF, WEBP (max 5MB)
      </p>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeletePhoto();
        }}
        title="Supprimer la photo de profil ?"
        message="Cette action est irréversible. Votre photo de profil sera définitivement supprimée."
        confirmText="Supprimer"
        type="danger"
      />
    </div>
  );
}