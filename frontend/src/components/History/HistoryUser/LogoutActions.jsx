import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import style from "./HistoryUser.module.css";
import { secureApiCall, isAuthenticated } from "../../../utils/authService";
import logger from '../../../shared/utils/logger.js';

export default function LogoutActions({ onLogout }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      checkAdmin();
    }
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await secureApiCall('/me');

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.role === "admin");
      }
    } catch (err) {
      logger.error("Failed to check admin status:", err);
    }
  };

  const goToAdmin = () => {
    navigate("/admin");
  };

  return (
    <div className={style["popup-actions"]}>
      {isAdmin && (
        <BoutonAction type="button" onClick={goToAdmin} variant="primary">
          Administration
        </BoutonAction>
      )}
      <BoutonAction type="button" onClick={onLogout} variant="secondary">
        Se déconnecter
      </BoutonAction>
    </div>
  );
}