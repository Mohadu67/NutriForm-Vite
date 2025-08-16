import styles from "./ForgotUser.module.css";
import React, { useState } from "react";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
const API_URL = import.meta.env.VITE_API_URL || '';


export default function ForgotUser({ toLogin, onClose, onSent, requestReset }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailNorm = email.trim().toLowerCase();

  const isEmail = (v) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!isEmail(emailNorm)) {
      setError("Email invalide");
      return;
    }
    setLoading(true);
    setError("");
    if (!API_URL) {
      setError("Configuration API manquante. Vérifie VITE_API_URL côté front.");
      setLoading(false);
      return;
    }
    try {
      if (requestReset) {
        await requestReset(emailNorm);
      } else {
        const res = await fetch(`${API_URL}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailNorm })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "request_failed");
        }
      }
      setSent(true);
      onSent?.(emailNorm);
    } catch (err) {
      setError(err?.message || "Impossible d'envoyer le lien. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles["auth-panel"]}>
        <h2 className={styles["auth-title"]}>Mot de passe oublié</h2>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', padding: '12px 0' }}>
          <img
            src={logoAnimate}
            alt="Chargement"
            className={styles.loaderSvg}
            aria-hidden={false}
          />
          <p className={styles.muted}>Envoi du lien en cours...</p>
        </div>
        <div className={styles.authActions}>
          <button type="button" onClick={onClose} className={styles.linkBtn}>Annuler</button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className={styles["auth-panel"]}>
        <h2 className={styles["auth-title"]}>Mot de passe oublié</h2>
        <p>Si un compte existe pour {emailNorm}, un lien de réinitialisation a été envoyé.</p>
        <div className={styles.authActions}>
          <button type="button" onClick={toLogin} className={styles.linkBtn}>Retour à la connexion</button>
          <button type="button" onClick={onClose} className={styles.linkBtn}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["auth-panel"]}>
      <h2 className={styles["auth-title"]}>Mot de passe oublié</h2>
      <form onSubmit={handleSubmit} className={styles["auth-form"]}>
        <label htmlFor="forgot-email" className={styles["auth-label"]}>Adresse email</label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className={styles["auth-input"]}
        />
        {error && <div className={styles["auth-error"]} role="alert">{error}</div>}
        <div className={styles.authActions}>
          <button type="button" onClick={toLogin} className={styles.linkBtn}>Retour</button>
          <button type="submit" disabled={loading || !isEmail(emailNorm)} className={styles["auth-button"]}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
          <button type="button" onClick={onClose} className={styles.linkBtn}>Fermer</button>
        </div>
      </form>
    </div>
  );
}