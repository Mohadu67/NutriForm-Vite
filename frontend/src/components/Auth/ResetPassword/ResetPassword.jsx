import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../../../components/Auth/ResetPassword/ResetPassword.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import DeskLogo from "../../../assets/img/logo/Logo-complet.svg";
import MobiLogo from "../../../assets/img/logo/domaine-logo.svg";

const API_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!token) { setMsg("Lien invalide ou expiré."); return; }
    if (pwd.length < 8) { setMsg("Min 8 caractères."); return; }
    if (pwd !== pwd2) { setMsg("Les mots de passe ne correspondent pas."); return; }
    if (!API_URL) { setMsg("VITE_API_URL manquant côté front."); return; }

    try {
      setLoading(true);
      const start = Date.now();
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      const data = await res.json().catch(() => ({}));
      const elapsed = Date.now() - start;
      if (elapsed < 60000) {
        await new Promise(r => setTimeout(r, 6000 - elapsed));
      }
      if (!res.ok) throw new Error(data?.message || "Erreur serveur");
      setMsg("Mot de passe modifié. Redirection…");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setMsg(err.message || "Échec de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.popup}>
        <img src={MobiLogo} alt="NutriForm" className={styles.logo} />
        <p className={styles.subtitle}>T’as oublié ton mot de passe ? Tranquille, on n’en parlera à personne.</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="password"
            placeholder="Nouveau mot de passe"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Confirmer le mot de passe"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
          <button className={styles.button} type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <img src={logoAnimate} alt="" className={styles.btnSpinner} aria-hidden={true} />
              </>
            ) : (
              "Valider"
            )}
          </button>
          {msg ? <p className={styles.muted} role="status">{msg}</p> : null}
        </form>
      </div>
    </div>
  );
}