import React, { useState, useRef, useEffect, useMemo } from "react";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import MobiLogo from "../../../assets/img/logo/domaine-logo.svg";
import cstyle from "./CreatUser.module.css";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import LabelField from "../../LabelField/LabelField";
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export default function CreatUser({ onCreated, toLogin, onClose }) {
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

      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm, motdepasse: password, pseudo: pseudo.trim() })
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = data?.message || (res.status === 500 ? "Erreur serveur" : `Erreur HTTP ${res.status}`);
        throw new Error(msg);
      }

      // Si l'utilisateur a coché la newsletter, on l'inscrit
      if (newsletter) {
        try {
          await fetch(`${API_URL}/api/newsletter/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailNorm })
          });
          // Silently fail - l'inscription au compte est plus importante
        } catch (newsletterErr) {
          console.warn("Newsletter subscription failed:", newsletterErr);
        }
      }

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Une erreur est survenue. Réessaie.");
    }
  };

  if (status === "sending" || forceSending) {
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
          <p className={cstyle.muted} aria-live="polite">Création du compte en cours...</p>
          <p className={cstyle.muted} aria-live="polite">Merci de vérifier votre adresse email pour activer votre compte.</p>
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
        <LabelField label="Pseudo" htmlFor="pseudo" className={cstyle.fieldReset}>
          <input
            id="pseudo"
            name="username"
            autoComplete="username"
            type="text"
            className={cstyle.input}
            aria-invalid={!!errorMsg && !pseudo.trim()}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
          />
        </LabelField>

        <LabelField label="Email" htmlFor="email" className={cstyle.fieldReset}>
          <input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            className={cstyle.input}
            aria-invalid={!!errorMsg && !EMAIL_REGEX.test(emailNorm)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelField>

        <LabelField label="Mot de passe" htmlFor="password" className={cstyle.fieldReset}>
          <div className={cstyle.passwordWrapper}>
            <input
              id="password"
              name="new-password"
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              className={cstyle.input}
              aria-invalid={!!errorMsg && (!password || password.length < 8)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={cstyle.togglePassword}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer" : "Afficher"}
              aria-pressed={showPassword}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </LabelField>

        <LabelField label="Confirmer le mot de passe" htmlFor="confirm-password" className={cstyle.fieldReset}>
          <div className={cstyle.passwordWrapper}>
            <input
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              type={showConfirm ? "text" : "password"}
              className={cstyle.input}
              aria-invalid={!!errorMsg && password !== confirm}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className={cstyle.togglePassword}
              aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
              title={showConfirm ? "Masquer" : "Afficher"}
              aria-pressed={showConfirm}
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
        </LabelField>

        <label className={cstyle.checkRow}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>J'accepte la politique de confidentialité</span>
        </label>

        <label className={cstyle.checkRow}>
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span>📬 Je veux recevoir la newsletter (conseils fitness, nouveautés)</span>
        </label>

        {errorMsg && <p className={cstyle.error} role="alert" aria-live="assertive" style={{ marginTop: 0 }}>{errorMsg}</p>}

        <BoutonAction
          type="submit"
          variant="form"
          disabled={!isValid || status === "sending" || forceSending}
        >
          {status === "sending" || forceSending ? "Création…" : "Créer mon compte"}
        </BoutonAction>

        <div className={cstyle.actions}>
          <button
            className={cstyle.linkBtn}
            type="button"
            onClick={goLoginAfterSuccess}
          >
            J'ai déjà un compte
          </button>
        </div>
      </form>
    </div>
  );
}