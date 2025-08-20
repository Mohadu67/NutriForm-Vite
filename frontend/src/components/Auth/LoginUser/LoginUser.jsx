import React, { useState } from "react";
import style from "../Popup.module.css";
import lstyle from "./LoginUser.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";

const API_URL = import.meta.env.VITE_API_URL;
const MIN_SPINNER_MS = 6000; 
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


export default function LoginUser({ onSuccess, toSignup, toForgot, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const loading = status === "sending";

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    let t0;
    try {
      setStatus("sending");
      t0 = Date.now();

      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || (res.status === 403 ? "Email non vérifié. Vérifie ta boîte mail." : `Erreur HTTP ${res.status}`);
        throw new Error(msg);
      }

      setErrorMsg("");
      const { token, user, displayName } = data || {};
      const userId = user?.id;

      if (token) {
        try { localStorage.setItem('token', token); } catch (_) {}
      }
      try {
        localStorage.setItem('user', JSON.stringify({
          id: userId,
          email: user?.email,
          prenom: user?.prenom,
          pseudo: user?.pseudo,
          displayName: displayName || user?.pseudo || user?.prenom || (user?.email ? String(user.email).split('@')[0] : '')
        }));
      } catch (_) {}

      const elapsed = Date.now() - t0;
      const wait = Math.max(0, MIN_SPINNER_MS - elapsed);
      if (wait) await sleep(wait);
      setStatus("idle");
      onSuccess?.({ token, user, displayName });
      setIdentifier("");
      setPassword("");
      setRemember(false);
    } catch (err) {
      console.error(err);
      const elapsed = typeof t0 === 'number' ? (Date.now() - t0) : 0;
      const wait = Math.max(0, MIN_SPINNER_MS - elapsed);
      if (wait) await sleep(wait);
      setStatus("error");
      setErrorMsg(err.message || "Erreur de connexion. Réessaie.");
    }
  };

  if (loading) {
    return (
      <div className={lstyle.body} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" }}>
        <img src={logoAnimate} alt="Chargement" className={lstyle.loaderSvg} />
        <p>Connexion en cours...</p>
      </div>
    );
  }

  return (
    <div className={lstyle.body}>
      <div className={lstyle.headerRow}>
        <h3 className={lstyle.title}>Connecte toi 🙈</h3>
      </div>

      <form
        className={lstyle.form}
        onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}
        noValidate
      >
        <label className={lstyle.label}>
          Email ou pseudo
          <input
            type="text"
            className={lstyle.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.trimStart())}
            placeholder="ex: nom@domaine.com ou mon_pseudo"
            required
            autoComplete="username"
          />
        </label>

        <label className={lstyle.label}>
          Mot de passe
          <input
            type="password"
            className={lstyle.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <label className={lstyle.remember}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Se souvenir de moi</span>
        </label>

        <div className={lstyle.links}>
          <button type="button" className={lstyle.linkBtn} onClick={toForgot}>Mot de passe oublié ?</button>
          <button type="button" className={lstyle.linkBtn} onClick={toSignup}>Créer un compte</button>
        </div>

        <button
          type="submit"
          className={lstyle.submit}
          disabled={status === "sending" || !identifier.trim() || !password.trim()}
        >
          {status === "sending" ? "Connexion…" : "Se connecter"}
        </button>

        {status === "error" && (
          <p className={lstyle.error}>{errorMsg || "Erreur de connexion. Réessaie."}</p>
        )}
      </form>
    </div>
  );
}