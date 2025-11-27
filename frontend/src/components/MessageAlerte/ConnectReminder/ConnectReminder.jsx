import { memo, useMemo, useState } from "react";
import { storage } from '../../../shared/utils/storage';
import { Link } from "react-router-dom";
import Alert from "../Alert/Alert";
import PopupUser from "../../Auth/PopupUser.jsx";
import styles from "./ConnectReminder.module.css";

function ConnectReminder({
  show = false,
  message = "Connecte‑toi, enregistre tes résultats et retrouve ton historique.",
  cta = "Se connecter",
  onSuccess = null,
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("login");

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = storage.get("user") || sessionStorage.getItem("user");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && (parsed.id || parsed._id));
    } catch (_) {
      return false;
    }
  }, []);

  // Fonction pour ouvrir la popup de connexion
  const handleOpenLogin = () => {
    setPopupView("login");
    setIsPopupOpen(true);
  };

  return (
    <>
      {show && !isAuthed && (
        <Alert show={true} variant="error" message={message}>
          <div className={styles.actions}>
            <button
              id="openLogin"
              type="button"
              className={styles.cta}
              onClick={handleOpenLogin}
              aria-label="Ouvrir le formulaire de connexion"
            >
              {cta}
            </button>
            <Link to="/contact" className={styles.link}>Besoin d'aide ?</Link>
          </div>
        </Alert>
      )}
      <PopupUser
        open={isPopupOpen}
        view={popupView}
        setView={setPopupView}
        onClose={() => setIsPopupOpen(false)}
        onLoginSuccess={() => {
          setIsPopupOpen(false);
          // Dispatcher un événement pour mettre à jour l'interface
          window.dispatchEvent(new CustomEvent('userLoggedIn'));
          // Optionnel: recharger seulement si nécessaire
          if (onSuccess) {
            onSuccess();
          } else {
            // Refresh seulement si pas de callback personnalisé
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }}
        onLogout={() => {
          setPopupView("login");
          setIsPopupOpen(false);
        }}
      />
    </>
  );
}

export default memo(ConnectReminder);
