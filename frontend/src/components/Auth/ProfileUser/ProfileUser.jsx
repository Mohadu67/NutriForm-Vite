import React, { useState, useEffect } from "react";
import styles from "./ProfileUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import ProfilePhoto from "../HistoryUser/ProfilePhoto/ProfilePhoto.jsx";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export default function ProfileUser({ onClose, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      const url = `${API_BASE}/api/me`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (!res.ok) throw new Error("Erreur de récupération des données");

      const data = await res.json();
      setUser(data);
      setPrenom(data.prenom || "");
      setPseudo(data.pseudo || "");
      setEmail(data.email || "");
      setLoading(false);
    } catch (err) {
      setError("Impossible de charger les données");
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const url = `${API_BASE}/api/update-profile`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
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
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const url = `${API_BASE}/api/change-password`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("storage"));
    onLogout?.();
    onClose?.();
  };

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
      {/* Header avec gradient et photo */}
      <div className={styles.header}>
        <h3 className={styles.title}>Mon Profil</h3>
        <div className={styles.photoWrapper}>
          <ProfilePhoto user={user} />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!editing && !changingPassword && (
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

            <div className={styles.actions}>
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
      </div>
    </div>
  );
}
