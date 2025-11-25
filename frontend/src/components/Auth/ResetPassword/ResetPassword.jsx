import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = (sp.get("token") || "").trim();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const disabled = loading || !token || pwd.trim().length < 8 || pwd.trim() !== pwd2.trim();

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!token) {
      setMsg("Lien invalide ou expiré.");
      setMsgType("error");
      return;
    }
    if (pwd.trim().length < 8) {
      setMsg("Min 8 caractères.");
      setMsgType("error");
      return;
    }
    if (pwd.trim() !== pwd2.trim()) {
      setMsg("Les mots de passe ne correspondent pas.");
      setMsgType("error");
      return;
    }
    if (!API_URL) {
      setMsg("Configuration manquante.");
      setMsgType("error");
      return;
    }

    const cleanPwd = pwd.trim();

    try {
      setLoading(true);
      setMsg("");
      const start = Date.now();
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: cleanPwd }),
      });
      const data = await res.json().catch(() => ({}));
      const elapsed = Date.now() - start;
      const MIN_DELAY = 2000;
      if (elapsed < MIN_DELAY) {
        await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
      }
      if (!res.ok) throw new Error(data?.message || "Erreur serveur");
      setMsg("Mot de passe modifié avec succès !");
      setMsgType("success");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMsg((err && err.message) ? String(err.message) : "Échec de la réinitialisation.");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.popup}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.title}>Nouveau mot de passe</h1>
          <p className={styles.subtitle}>
            Choisis un mot de passe sécurisé d'au moins 8 caractères
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className={styles.form} noValidate>
          {/* New password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="new-password">Nouveau mot de passe</label>
            <div className={styles.inputWrapper}>
              <input
                id="new-password"
                className={styles.input}
                type="password"
                placeholder="Min. 8 caractères"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
              />
              <span className={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            </div>
          </div>

          {/* Confirm password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm-password">Confirmer</label>
            <div className={styles.inputWrapper}>
              <input
                id="confirm-password"
                className={styles.input}
                type="password"
                placeholder="Confirme ton mot de passe"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                autoComplete="new-password"
              />
              <span className={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={disabled}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <img src={logoAnimate} alt="" className={styles.btnSpinner} aria-hidden={true} />
                Validation...
              </>
            ) : (
              "Valider"
            )}
          </button>

          {/* Message */}
          {msg && (
            <p className={`${styles.message} ${msgType === "success" ? styles.messageSuccess : styles.messageError}`}>
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
