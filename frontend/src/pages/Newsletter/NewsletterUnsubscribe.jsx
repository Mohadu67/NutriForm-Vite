import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import style from "../../components/Auth/VerifyEmail/VerifyEmail.module.css";
import logoAnimate from "../../assets/img/logo/logoAnimate.svg";
import DeskLogo from "../../assets/img/logo/Logo-complet.svg";
import MobiLogo from "../../assets/img/logo/domaine-logo.svg";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function unsubscribe() {
      if (!email) {
        setStatus("invalid");
        setMessage("Aucun email fourni.");
        return;
      }

      setStatus("loading");

      try {
        const endpoint = API_URL ? `${API_URL}/newsletter/unsubscribe` : "/api/newsletter/unsubscribe";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: decodeURIComponent(email) }),
        });

        const data = await res.json().catch(() => ({}));

        if (ignore) return;

        if (!res.ok) {
          throw new Error(data?.message || `Erreur (${res.status})`);
        }

        setStatus("success");
        setMessage(data?.message || "Tu as bien été désinscrit(e) de notre newsletter.");
      } catch (err) {
        if (ignore) return;
        setStatus("error");
        setMessage(err?.message || "Une erreur est survenue lors du désabonnement.");
      }
    }

    unsubscribe();
    return () => { ignore = true; };
  }, [email]);

  const goHome = () => navigate("/", { replace: true });

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
            <h1 className={style.title}>Désabonnement en cours...</h1>
            <p className={style.subtitle}>On traite ta demande. Deux secondes.</p>
          </div>
        )}

        {status === 'success' && (
          <div className={`${style.card} ${style.successCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <h1 className={style.title}>Désabonnement confirmé</h1>
            <p className={style.subtitle}>{message}</p>
            <p className={style.subtitle} style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
              Tu ne recevras plus nos newsletters. Tu peux te réabonner à tout moment depuis notre site.
            </p>
            <div className={style.actions}>
              <button type="button" className={style.primaryBtn} onClick={goHome}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className={`${style.card} ${style.errorCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <h1 className={style.title}>Erreur</h1>
            <p className={style.subtitle}>{message}</p>
            <div className={style.actions}>
              <button type="button" className={style.secondaryBtn} onClick={goHome}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className={`${style.card} ${style.errorCard}`}>
            <img src={MobiLogo} alt="Harmonith" className={style.logoMobile} />
            <img src={DeskLogo} alt="Harmonith" className={style.logoDesk} />
            <h1 className={style.title}>Lien invalide</h1>
            <p className={style.subtitle}>{message}</p>
            <div className={style.actions}>
              <button type="button" className={style.secondaryBtn} onClick={goHome}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}