import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import style from "./HistoryUser.module.css";
import { secureApiCall } from "../../../utils/authService";

export default function LogoutActions({ onLogout }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await secureApiCall('/api/me');

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.role === "admin");
      }
    } catch (err) {
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