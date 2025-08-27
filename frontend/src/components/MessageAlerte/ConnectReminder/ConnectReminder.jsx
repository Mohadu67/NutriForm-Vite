import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../Alert/Alert";
import PopupUser from "../../Auth/PopupUser";
import styles from "./ConnectReminder.module.css";

function ConnectReminder({
  show = false,
  message = "Connecte‑toi, enregistre tes résultats et retrouve ton historique.",
  cta = "Se connecter",
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("login");

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const u = localStorage.getItem("user") || sessionStorage.getItem("user");
      return Boolean(u);
    } catch (_) {
      return false;
    }
  }, []);

  return (
    <>
      {show && !isAuthed && !isPopupOpen && (
        <Alert show={true} variant="error" message={message}>
          <div className={styles.actions}>
            <button
              id="openLogin"
              className={styles.cta}
              onClick={() => { setPopupView("login"); setIsPopupOpen(true); }}
            >
              {cta}
            </button>
            <Link to="/contact" className={styles.link}>Besoin d’aide ?</Link>
          </div>
        </Alert>
      )}
      <PopupUser
        open={isPopupOpen}
        view={popupView}
        setView={setPopupView}
        onClose={() => setIsPopupOpen(false)}
        onLoginSuccess={() => { setPopupView("history"); setIsPopupOpen(true); }}
        onLogout={() => { setPopupView("login"); setIsPopupOpen(false); }}
      />
    </>
  );
}

export default memo(ConnectReminder);