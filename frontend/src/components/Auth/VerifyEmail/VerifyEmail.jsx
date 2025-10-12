import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import style from "./VerifyEmail.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";
import DeskLogo from "../../../assets/img/logo/Logo-complet.svg";
import MobiLogo from "../../../assets/img/logo/domaine-logo.svg";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!token) {
        setStatus("invalid");
        setMessage("Aucun jeton de vérification fourni.");
        return;
      }
      setStatus("loading");
      try {
        const endpoint = API_URL ? `${API_URL}/api/verify-email` : "/api/verify-email";
        let res = await fetch(`${endpoint}?token=${encodeURIComponent(token)}`);
        if (res.status === 404) {
          const fallbackEndpoint = API_URL ? `${API_URL}/verify-email` : "/verify-email";
          res = await fetch(`${fallbackEndpoint}?token=${encodeURIComponent(token)}`);
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `Erreur (${res.status})`);
        }
        if (ignore) return;
        setStatus("success");
        setMessage("Adresse e-mail vérifiée. Tu peux maintenant te connecter.");
      } catch (err) {
        if (ignore) return;
        setStatus("error");
        setMessage(err?.message || "Échec de la vérification. Lien invalide ou expiré.");
      }
    }
    run();
    return () => { ignore = true; };
  }, [token]);

  const goLogin = () => navigate("/", { replace: true });

  return (
    <div className={style.container}>
      <div className={style.centerWrap}>

        {status === 'loading' && (
          <div className={`${style.card} ${style.loadingCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <object
              type="image/svg+xml"
              data={logoAnimate}
              className={style.loaderSvg}
              aria-label="Chargement"
            >
              <div className={style.loaderFallback}></div>
            </object>
            <h1 className={style.title}>Vérification en cours…</h1>
            <p className={style.subtitle}>On confirme que cette adresse est bien à toi. Deux secondes.</p>
          </div>
        )}

        {status === 'success' && (
          <div className={`${style.card} ${style.successCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <h1 className={style.title}>Email vérifié ✅</h1>
            <p className={style.subtitle}>{message || "Adresse e‑mail vérifiée. Tu peux maintenant te connecter."}</p>
            <div className={style.actions}>
              <button type="button" className={style.primaryBtn} onClick={goLogin}>
                Se connecter
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={`${style.card} ${style.errorCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <h1 className={style.title}>Vérification échouée ❌</h1>
            <p className={style.subtitle}>{message || "Lien invalide ou expiré."}</p>
            <div className={style.actions}>
              <button type="button" className={style.secondaryBtn} onClick={goLogin}>
                Revenir à l'accueil
              </button>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className={`${style.card} ${style.errorCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <div className={style.actions}>
              <button type="button" className={style.secondaryBtn} onClick={goLogin}>
                Revenir à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}