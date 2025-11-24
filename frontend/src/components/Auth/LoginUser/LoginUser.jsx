import React, { useState } from "react";
import styles from "./LoginUser.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import useLogin from "./UseLogin.js";

export default function LoginUser({ onSuccess, toSignup, toForgot }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { status, errorMsg, unverifiedEmail, handleSubmit, resendVerification } = useLogin(onSuccess, { minDurationMs: 1500 });

  const loading = status === "loading";

  const onSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    handleSubmit({ identifier, password, remember });
  };

  if (loading) {
    return (
      <div className={styles.body}>
        <div className={styles.loadingState}>
          <img src={logoAnimate} alt="Chargement" className={styles.loaderSvg} />
          <p className={styles.loadingText}>Connexion en cours...</p>
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className={styles.title}>Content de te revoir !</h3>
        <p className={styles.subtitle}>Connecte-toi pour continuer</p>
      </div>

      {/* Form */}
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* Email/Pseudo field */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="identifier">Email ou pseudo</label>
          <div className={styles.inputWrapper}>
            <input
              id="identifier"
              type="text"
              className={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.trimStart())}
              placeholder="nom@domaine.com"
              required
              autoComplete="username"
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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

        {/* Options row */}
        <div className={styles.options}>
          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Se souvenir de moi</span>
          </label>
          <button type="button" className={styles.forgotBtn} onClick={toForgot}>
            Mot de passe oublié ?
          </button>
        </div>

        {/* Error message */}
        {status === "error" && (
          <div className={styles.errorWrapper}>
            <p className={styles.error}>{errorMsg || "Erreur de connexion. Réessaie."}</p>
            {unverifiedEmail && (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={resendVerification}
              >
                Renvoyer l'email de vérification
              </button>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !identifier.trim() || !password.trim()}
        >
          Se connecter
        </button>
      </form>

      {/* Signup link */}
      <div className={styles.signupWrapper}>
        <span className={styles.signupText}>
          Pas encore de compte ?
          <button type="button" className={styles.signupBtn} onClick={toSignup}>
            Inscris-toi
          </button>
        </span>
      </div>
    </div>
  );
}
