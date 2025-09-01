

import style from "./HistoryUser.module.css";

export default function HistoryHeader({ displayName }) {
  return (
    <header className={style["popup-header-row"]}>
      <h2 className={style.headerTitle}>Historique</h2>
      {displayName && (
        <p className={style.headerSubtitle}>Salut <span>{displayName}</span>👋, voici ton tableau de bord : tu y trouveras toutes les informations nécessaires pour atteindre ton objectif.</p>
      )}
    </header>
  );
}