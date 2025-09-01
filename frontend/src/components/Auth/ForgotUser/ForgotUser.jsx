import styles from "./ForgotUser.module.css";
import React, { useState, useMemo, useRef } from "react";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import LabelField from "../../LabelField/LabelField";
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export default function ForgotUser({ toLogin, onClose, onSent, requestReset }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
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
    setInfo("");
    setError("");
    onClose?.();
  };
  const handleToLoginAfterSent = () => {
    onSent?.(emailNorm);
    setSent(false);
    setInfo("");
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
    setInfo("");

    if (!API_URL) {
      setError("Configuration API manquante. Vérifie VITE_API_URL côté front.");
      setLoading(false);
      return;
    }

    const started = Date.now();
    const minDelay = 1200;
    const controller = new AbortController();

    try {
      if (requestReset) {
        await requestReset(emailNorm);
      } else {
        const res = await fetch(`${API_URL}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailNorm }),
          signal: controller.signal,
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
      setInfo(`Si un compte existe pour ${emailNorm}, un lien de réinitialisation a été envoyé.`);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message || "Impossible d'envoyer le lien. Réessaie dans un instant.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }

    // Cleanup if needed (here we don't persist controller between calls)
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
          <p className={styles.muted} aria-live="polite">Envoi du lien en cours…</p>
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
        <p aria-live="polite">{info || `Si un compte existe pour ${emailNorm}, un lien de réinitialisation a été envoyé.`}</p>
        <div className={styles.authActions}>
          <button type="button" onClick={handleToLoginAfterSent} className={styles.linkBtn}>Retour à la connexion</button>
          <button type="button" onClick={handleCloseAfterSent} className={styles.linkBtn}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["auth-panel"]}>
      <h2 className={styles["auth-title"]}>Mot de passe oublié</h2>
      <form onSubmit={handleSubmit} className={styles["auth-form"]}>
        <LabelField label="Adresse email" htmlFor="forgot-email">
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={styles["auth-input"]}
          />
        </LabelField>
        {error && <div className={styles["auth-error"]} role="alert" aria-live="assertive">{error}</div>}
        <div className={styles.authActions}>
          <button type="button" onClick={toLogin} className={styles.linkBtn} disabled={loading}>Retour</button>
          <BoutonAction
            type="submit"
            variant="authPopup"
            disabled={loading || !isEmail(emailNorm)}
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </BoutonAction>
          <button type="button" onClick={onClose} className={styles.linkBtn} disabled={loading}>Fermer</button>
        </div>
      </form>
    </div>
  );
}