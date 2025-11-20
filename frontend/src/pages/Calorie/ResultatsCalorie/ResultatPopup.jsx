import { useEffect } from "react";
import styles from "./ResultatsCalorie.module.css";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";


export default function ResultatPopup({ titre, calories, macros, onClose }) {
  // Bloquer le scroll du body quand la popup est ouverte
  useEffect(() => {
    // Sauvegarder l'état actuel
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculer la largeur de la scrollbar pour éviter le "jump"
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Bloquer le scroll et compenser la scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Nettoyer à la fermeture
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
  <div
    className={styles.popupCard}
    onClick={(e) => e.stopPropagation()}
  >        <button className={styles.popupClose} onClick={onClose}>×</button>
        <h2 className={styles.popupTitle}>{titre}</h2>
        <p className={styles.popupCalories}>{calories} kcal / jour</p>

        {macros && (
          <div className={styles.popupMacros}>
            <p><strong>Glucides :</strong> {macros.glucides} g</p>
            <p><strong>Protéines :</strong> {macros.proteines} g</p>
            <p><strong>Lipides :</strong> {macros.lipides} g</p>
          </div>
        )}

          <BoutonAction to="/not-found">
            Voir des recettes adaptées
          </BoutonAction>
      </div>
    </div>
  );
}