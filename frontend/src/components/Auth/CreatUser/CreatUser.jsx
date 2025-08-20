import React, { useState } from "react";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import MobiLogo from "../../../assets/img/logo/domaine-logo.svg";
import cstyle from "./CreatUser.module.css";
const API_URL = import.meta.env.VITE_API_URL;

export default function CreatUser({ onCreated, toLogin, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
    if (!email.trim()) { setErrorMsg("Email requis."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMsg("Email invalide."); return false; }
    if (!password) { setErrorMsg("Mot de passe requis."); return false; }
    if (password.length < 8) { setErrorMsg("8 caractères minimum."); return false; }
    if (password !== confirm) { setErrorMsg("Les mots de passe ne correspondent pas."); return false; }
    if (!agree) { setErrorMsg("Merci d'accepter la politique de confidentialité."); return false; }
    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setStatus("sending");
      setErrorMsg("");

      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motdepasse: password, pseudo })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {

        const msg = data?.message || (res.status === 500 ? "Erreur serveur" : `Erreur HTTP ${res.status}`);
        throw new Error(msg);
      }

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Une erreur est survenue. Réessaie.");
    }
  };

  if (status === "sending") {
    return (
      <div className={cstyle.body}>
        <div className={cstyle.headerRow}>
          <h3 className={cstyle.title}>Création du compte</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
          <object type="image/svg+xml" data={logoAnimate} className={cstyle.loaderSvg} aria-label="Chargement">
            <div className={cstyle.loaderFallback}></div>
          </object>
          <img src={MobiLogo} alt="Logo mobile" className={cstyle.mobileLogo} />
          <p className={cstyle.muted}>Création du compte en cours...</p>
          <p className={cstyle.muted}>Merci de vérifier votre adresse email pour activer votre compte.</p>
        </div>
        <div className={cstyle.actions}>
          <button type="button" onClick={onClose}>Annuler</button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={cstyle.body}>
        <div className={cstyle.headerRow}>
          <h3 className={cstyle.title}>Création du compte</h3>
          <img src={MobiLogo} alt="Logo mobile" className={cstyle.mobileLogo} />
        </div>
        <div>
          <p className={cstyle.success}>Compte créé 🎉</p>
          <p className={cstyle.muted}>T’as oublié de vérifier tes mails ? On dira rien… mais clique sur le lien quand même.</p>
          <div className={cstyle.actions} style={{ marginTop: 12 }}>
            <button type="button" className={cstyle.linkBtn} onClick={goLoginAfterSuccess}>Se connecter</button>
            <button type="button" onClick={closeAfterSuccess}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cstyle.body}>
      <div className={cstyle.headerRow}>
        <h3 className={cstyle.title}>Créer un compte</h3>

      </div>

      <form className={cstyle.form} onSubmit={handleSubmit} noValidate>
        <label className={cstyle.label}>
          Pseudo
          <input
            type="text"
            className={cstyle.input}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
          />
        </label>

        <label className={cstyle.label}>
          Email
          <input
            type="email"
            className={cstyle.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={cstyle.label}>
          Mot de passe
          <input
            type="password"
            className={cstyle.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className={cstyle.label}>
          Confirmer le mot de passe
          <input
            type="password"
            className={cstyle.input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>

        <label className={cstyle.checkRow}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>J'accepte la politique de confidentialité</span>
        </label>

        {errorMsg && <p className={cstyle.error} style={{ marginTop: 0 }}>{errorMsg}</p>}

        <button type="submit" className={cstyle.submit} disabled={status === "sending"}>
          {status === "sending" ? "Création…" : "Créer mon compte"}
        </button>

        <div className={cstyle.actions}>
          <button
            type="button"
            className={cstyle.linkBtn}
            onClick={goLoginAfterSuccess}
          >
            J'ai déjà un compte
          </button>
        </div>
      </form>
    </div>
  );
}