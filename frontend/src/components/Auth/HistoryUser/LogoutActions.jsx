import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import style from "./HistoryUser.module.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function LogoutActions({ onLogout }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.role === "admin");
      }
    } catch (err) {
      console.error("Erreur vérification admin:", err);
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