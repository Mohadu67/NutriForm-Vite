import styles from "./ForgotUser.module.css";
import React, { useState, useMemo, useRef } from "react";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export default function ForgotUser({ toLogin, onClose, onSent, requestReset }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);
  const isEmail = (v) => EMAIL_REGEX.test(v);

  const handleCloseAfterSent = () => {
    onSent?.(emailNorm);
    setSent(false);
    setError("");
    onClose?.();
  };

  const handleToLoginAfterSent = () => {
    onSent?.(emailNorm);
    setSent(false);
    setError("");
    toLogin?.();
  };

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
      setError("Configuration API manquante.");
      setLoading(false);
      return;
    }

    const started = Date.now();
    const minDelay = 1200;

    try {
      if (requestReset) {
        await requestReset(emailNorm);
      } else {
        const res = await fetch(`${API_URL}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailNorm }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "request_failed");
        }
      }
      const remain = Math.max(0, minDelay - (Date.now() - started));
      await new Promise((r) => setTimeout(r, remain));
      if (!mountedRef.current) return;
      setSent(true);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message || "Impossible d'envoyer le lien. Réessaie.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.body}>
        <div className={styles.loadingState}>
          <img src={logoAnimate} alt="Chargement" className={styles.loaderSvg} />
          <p className={styles.loadingText}>Envoi du lien en cours...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (sent) {
    return (
      <div className={styles.body}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <h3 className={styles.successTitle}>Email envoyé !</h3>
          <p className={styles.successText}>
            Si un compte existe pour {emailNorm}, tu recevras un lien de réinitialisation.
          </p>
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleToLoginAfterSent}
            >
              Connexion
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={handleCloseAfterSent}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
          </svg>
        </div>
        <h3 className={styles.title}>Mot de passe oublié ?</h3>
        <p className={styles.subtitle}>Entre ton email pour recevoir un lien de réinitialisation</p>
      </div>

      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="forgot-email">Adresse email</label>
          <div className={styles.inputWrapper}>
            <input
              id="forgot-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@domaine.com"
              required
              autoComplete="email"
            />
            <span className={styles.inputIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && <p className={styles.error}>{error}</p>}

        {/* Submit button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !isEmail(emailNorm)}
        >
          Envoyer le lien
        </button>
      </form>

      {/* Back link */}
      <div className={styles.backWrapper}>
        <button type="button" className={styles.backBtn} onClick={toLogin}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}
