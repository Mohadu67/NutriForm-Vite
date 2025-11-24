import { useState, useRef, useEffect, useMemo } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from 'sonner';
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import styles from "./CreatUser.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const RECAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_RECAPTCHA !== 'false' && import.meta.env.VITE_ENABLE_RECAPTCHA !== '0';
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export default function CreatUser({ onCreated, toLogin, onClose }) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadingStartRef = useRef(null);
  const [forceSending, setForceSending] = useState(false);

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);
  const isValid = useMemo(() => (
    pseudo.trim() &&
    emailNorm &&
    EMAIL_REGEX.test(emailNorm) &&
    password &&
    confirm &&
    password === confirm &&
    agree
  ), [pseudo, emailNorm, password, confirm, agree]);

  const goLoginAfterSuccess = () => {
    onCreated?.({ email });
    toLogin?.();
  };

  const closeAfterSuccess = () => {
    onCreated?.({ email });
    onClose?.();
  };

  const validate = () => {
    if (!pseudo.trim()) { setErrorMsg("Pseudo requis."); return false; }
    if (!emailNorm) { setErrorMsg("Email requis."); return false; }
    if (!EMAIL_REGEX.test(emailNorm)) { setErrorMsg("Email invalide."); return false; }
    if (!password) { setErrorMsg("Mot de passe requis."); return false; }
    if (password.length < 8) { setErrorMsg("8 caractères minimum."); return false; }
    if (password !== confirm) { setErrorMsg("Les mots de passe ne correspondent pas."); return false; }
    if (!agree) { setErrorMsg("Merci d'accepter la politique de confidentialité."); return false; }
    setErrorMsg("");
    return true;
  };

  useEffect(() => {
    if (status === "sending") {
      loadingStartRef.current = Date.now();
      setForceSending(true);
    } else if (loadingStartRef.current) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(2500 - elapsed, 0);
      const t = setTimeout(() => {
        setForceSending(false);
        loadingStartRef.current = null;
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setStatus("sending");
      setErrorMsg("");

      if (!API_URL) {
        throw new Error("Configuration API manquante (VITE_API_URL)");
      }

      const captchaToken = RECAPTCHA_ENABLED && executeRecaptcha
        ? await executeRecaptcha('register')
        : null;

      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm, motdepasse: password, pseudo: pseudo.trim(), captchaToken })
      });

      let data = {};
      try { data = await res.json(); } catch (e) {
        console.error("Failed to parse response:", e);
      }

      if (!res.ok) {
        const msg = data?.message || (res.status === 500 ? "Erreur serveur" : `Erreur HTTP ${res.status}`);
        throw new Error(msg);
      }

      if (newsletter) {
        try {
          const newsletterCaptchaToken = RECAPTCHA_ENABLED && executeRecaptcha
            ? await executeRecaptcha('newsletter_subscribe')
            : null;
          await fetch(`${API_URL}/api/newsletter/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailNorm, captchaToken: newsletterCaptchaToken })
          });
        } catch (newsletterErr) {
          console.error("Failed to subscribe to newsletter:", newsletterErr);
        }
      }

      setStatus("success");
      toast.success("Compte créé ! Vérifie ton email pour l'activer.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      const message = err.message || "Une erreur est survenue. Réessaie.";
      setErrorMsg(message);
      toast.error(message);
    }
  };

  // Loading state
  if (status === "sending" || forceSending) {
    return (
      <div className={styles.body}>
        <div className={styles.loadingState}>
          <img src={logoAnimate} alt="Chargement" className={styles.loaderSvg} />
          <p className={styles.muted}>Création du compte en cours...</p>
          <p className={styles.muted}>Un email de confirmation va t'être envoyé.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className={styles.body}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className={styles.successTitle}>Compte créé !</h3>
          <p className={styles.successText}>
            Vérifie ton email pour activer ton compte et commencer à t'entraîner.
          </p>
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={goLoginAfterSuccess}
            >
              Se connecter
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={closeAfterSuccess}
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h3 className={styles.title}>Crée ton compte</h3>
        <p className={styles.subtitle}>Rejoins la communauté Harmonith</p>
      </div>

      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Pseudo field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="pseudo">Pseudo</label>
          <div className={styles.inputWrapper}>
            <input
              id="pseudo"
              type="text"
              className={styles.input}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ton pseudo"
              required
              autoComplete="username"
            />
            <span className={styles.inputIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
              </svg>
            </span>
          </div>
        </div>

        {/* Email field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">Email</label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
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

        {/* Password field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password">Mot de passe</label>
          <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              required
              autoComplete="new-password"
            />
            <span className={styles.inputIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.togglePassword}
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm password field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="confirm">Confirmer</label>
          <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirme ton mot de passe"
              required
              autoComplete="new-password"
            />
            <span className={styles.inputIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={styles.togglePassword}
              aria-label={showConfirm ? "Masquer" : "Afficher"}
            >
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {confirm && password !== confirm && (
            <span className={styles.fieldError}>Les mots de passe ne correspondent pas</span>
          )}
        </div>

        {/* Checkboxes */}
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>J'accepte la politique de confidentialité</span>
        </label>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span>Je veux recevoir la newsletter (conseils fitness, nouveautés)</span>
        </label>

        {/* Error message */}
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        {/* Submit button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isValid || status === "sending" || forceSending}
        >
          Créer mon compte
        </button>
      </form>

      {/* Login link */}
      <div className={styles.loginWrapper}>
        <span className={styles.loginText}>
          Déjà un compte ?
          <button type="button" className={styles.loginBtn} onClick={toLogin}>
            Connecte-toi
          </button>
        </span>
      </div>
    </div>
  );
}
