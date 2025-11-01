import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../../../components/Auth/ResetPassword/ResetPassword.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import LabelField from "../../LabelField/LabelField";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = (sp.get("token") || "").trim();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const disabled = loading || !token || pwd.trim().length < 8 || pwd.trim() !== pwd2.trim();

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!token) { setMsg("Lien invalide ou expiré."); return; }
    if (pwd.trim().length < 8) { setMsg("Min 8 caractères."); return; }
    if (pwd.trim() !== pwd2.trim()) { setMsg("Les mots de passe ne correspondent pas."); return; }
    if (!API_URL) { setMsg("VITE_API_URL manquant côté front."); return; }

    const cleanPwd = pwd.trim();

    try {
      setLoading(true);
      const start = Date.now();
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: cleanPwd }),
      });
      const data = await res.json().catch(() => ({}));
      const elapsed = Date.now() - start;
      const MIN_DELAY = 6000; 
      if (elapsed < MIN_DELAY) {
        await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
      }
      if (!res.ok) throw new Error(data?.message || "Erreur serveur");
      setMsg("Mot de passe modifié. Redirection…");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setMsg((err && err.message) ? String(err.message) : "Échec de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.popup}>
        <h1 className={styles.title}>Harmonith</h1>
        <p className={styles.tagline}>Ton coach encore plus proche</p>
        <h2 className={styles.subtitle}>Mot de passe oublié ? 😅</h2>
        <p className={styles.description}>Pas de panique, ça arrive à tout le monde ! Choisis un nouveau mot de passe ci-dessous.</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <LabelField label="Nouveau mot de passe" htmlFor="new-password">
            <input
              id="new-password"
              className={styles.input}
              type="password"
              placeholder="Nouveau mot de passe"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
            />
          </LabelField>
          <LabelField label="Confirmer le mot de passe" htmlFor="confirm-password">
            <input
              id="confirm-password"
              className={styles.input}
              type="password"
              placeholder="Confirmer le mot de passe"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
            />
          </LabelField>
          <BoutonAction
            type="submit"
            variant="authPopup"
            disabled={disabled}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <img src={logoAnimate} alt="" className={styles.btnSpinner} aria-hidden={true} />
              </>
            ) : (
              "Valider"
            )}
          </BoutonAction>
          {msg ? <p className={styles.muted} role="status">{msg}</p> : null}
        </form>
      </div>
    </div>
  );
}