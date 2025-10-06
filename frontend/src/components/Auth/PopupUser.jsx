import React, { useEffect, useState } from "react";
import styles from "./Popup.module.css";
import LoginUser from "./LoginUser/LoginUser.jsx";
import CreatUser from "./CreatUser/CreatUser.jsx";
import HistoryUser from "./HistoryUser/HistoryUser.jsx";
import ForgotUser from "./ForgotUser/ForgotUser.jsx";


export default function PopupUser({ open, view = "login", setView, onClose, onLoginSuccess, onLogout }) {
  const [currentView, setCurrentView] = useState(view);

  useEffect(() => {
    if (open) setCurrentView(view);
  }, [view, open]);

  useEffect(() => {
    if (!open) return;

    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll || '';
    };
  }, [open]);

  if (!open) return null;

  const setBoth = (next) => {
    setView?.(next);
    setCurrentView(next);
  };

  const closeAndResetHash = () => {
    onClose?.();
    setCurrentView("login");
    if (typeof window !== "undefined") {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", `${pathname}${search}`);
    }
  };

  return (
    <div className={`${styles.overlay} ${styles['popup-overlay']}`} onClick={(e) => { if (e.target === e.currentTarget) closeAndResetHash(); }}>
      <div className={`${styles.card} ${styles['popup-card']}`} role="dialog" aria-modal="true">
        <button
          type="button"
          aria-label="Fermer"
          className={`${styles.close} ${styles['popup-close']}`}
          onClick={closeAndResetHash}
        >
          ×
        </button>

        {currentView === "login" && (
          <LoginUser
            onSuccess={(payload) => { onLoginSuccess?.(payload); setBoth("history"); }}
            toSignup={() => setBoth("create")}
            toForgot={() => setBoth("forgot")}
            onClose={closeAndResetHash}
          />
        )}

        {currentView === "create" && (
          <CreatUser
            toLogin={() => setBoth("login")}
            onCreated={() => setBoth("login")}
            onClose={closeAndResetHash}
          />
        )}

        {currentView === "history" && (
          <HistoryUser
            onLogout={() => {
              localStorage.removeItem("token");
              onLogout?.();
              closeAndResetHash();
            }}
            onClose={closeAndResetHash}
          />
        )}

        {currentView === "forgot" && (
          <ForgotUser
            toLogin={() => setBoth("login")}
            onClose={closeAndResetHash}
            onSent={() => setBoth("login")}
          />
        )}
      </div>
    </div>
  );
}