import { useNavigate } from "react-router-dom";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import style from "./HistoryUser.module.css";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function LogoutActions({ onLogout }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

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