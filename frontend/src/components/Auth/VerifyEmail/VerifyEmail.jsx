import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import style from "./VerifyEmail.module.css";
import logoAnimate from "../../../assets/img/logo/logoAnimate.svg";

const API_URL = import.meta.env.VITE_API_URL;

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
        // Essai 1: endpoint namespacé API
        let res = await fetch(`${API_URL}/api/verify-email?token=${encodeURIComponent(token)}`);
        if (res.status === 404) {
          // Essai 2: endpoint à la racine (selon certaines configs backend)
          res = await fetch(`${API_URL}/verify-email?token=${encodeURIComponent(token)}`);
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
      {status === "loading" && (
        <div className={style.center}>
          <object
            type="image/svg+xml"
            data={logoAnimate}
            className={style["loader-svg"]}
            aria-label="Chargement"
          >
            <div className={style["loader-fallback"]}></div>
          </object>
          <p className={style.note}>Vérification de l'email en cours...</p>
        </div>
      )}

      {status === "success" && (
        <div className={style["auth-panel"]}>
          <h3 className={`${style["popup-title"]} ${style.titleSuccess}`}>Email vérifié ✅</h3>
          <p className={style.center}>{message}</p>
          <div className={`${style["popup-actions"]} ${style.actions}`}>
            <button type="button" className={style["popup-link"]} onClick={goLogin}>
              Se connecter
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className={style["auth-panel"]}>
          <h3 className={`${style["popup-title"]} ${style.titleError}`}>Vérification échouée ❌</h3>
          <p className={style.center}>{message}</p>
          <div className={`${style["popup-actions"]} ${style.actions}`}>
            <button type="button" className={style["popup-link"]} onClick={goLogin}>
              Revenir à l'accueil
            </button>
          </div>
        </div>
      )}

      {status === "invalid" && (
        <div className={style["auth-panel"]}>
          <h3 className={style["popup-title"]}>Lien invalide</h3>
          <p className={style.center}>{message || "Le lien de vérification est incomplet."}</p>
          <div className={style["popup-actions"]}>
            <button type="button" className={style["popup-link"]} onClick={goLogin}>
              Revenir à l'accueil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}