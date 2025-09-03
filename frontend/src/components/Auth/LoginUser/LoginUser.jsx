import React, { useState } from "react";
import LabelField from "../../LabelField/LabelField";
import lstyle from "./LoginUser.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import useLogin from "./UseLogin.js";

export default function LoginUser({ onSuccess, toSignup, toForgot, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mascotState, setMascotState] = useState("idle");

  const { status, errorMsg, handleSubmit } = useLogin(onSuccess, { minDurationMs: 1500 });

  const loading = status === "loading";

  const onSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    handleSubmit({ identifier, password, remember });
    setIdentifier("");
    setPassword("");
    setRemember(false);
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
        <h3 className={lstyle.title}>Connecte toi 🙈</h3>
      <div className={lstyle.headerRow}>
      </div>

      <form
        className={lstyle.form}
        onSubmit={onSubmit}
        noValidate
      >
        <LabelField labelClassName={lstyle.label} label="Email ou pseudo" htmlFor="identifier">
          <input
            id="identifier"
            type="text"
            className={lstyle.input}
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value.trimStart()); setMascotState("username"); }}
            onFocus={() => setMascotState("username")}
            onBlur={() => setMascotState("idle")}
            placeholder="ex: nom@domaine.com ou mon_pseudo"
            required
            autoComplete="username"
          />
        </LabelField>

        <LabelField labelClassName={lstyle.label} label="Mot de passe" htmlFor="password">
          <div className={lstyle.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={lstyle.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setMascotState("password"); }}
              onFocus={() => setMascotState("password")}
              onBlur={() => setMascotState("idle")}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={lstyle.togglePassword}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </LabelField>

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

        <BoutonAction
          type="submit"
          disabled={status === "loading" || !identifier.trim() || !password.trim()}
          onClick={onSubmit}
        >
          {status === "loading" ? "Connexion…" : "Se connecter"}
        </BoutonAction>

        {status === "error" && (
          <p className={lstyle.error}>{errorMsg || "Erreur de connexion. Réessaie."}</p>
        )}
      </form>
    </div>
  );
}