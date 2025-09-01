

import React from "react";
import BoutonAction from "../../BoutonAction/BoutonAction.jsx";
import style from "./HistoryUser.module.css";

export default function LogoutActions({ onLogout }) {
  return (
    <div className={style["popup-actions"]}>
      <BoutonAction type="button" onClick={onLogout} variant="secondary">
        Se déconnecter
      </BoutonAction>
    </div>
  );
}