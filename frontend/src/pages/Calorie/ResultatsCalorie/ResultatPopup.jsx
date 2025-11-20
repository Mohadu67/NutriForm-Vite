import { useLayoutEffect } from "react";
import styles from "./ResultatsCalorie.module.css";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";


export default function ResultatPopup({ titre, calories, macros, onClose }) {
  // Bloquer le scroll du body AVANT le paint (useLayoutEffect)
  useLayoutEffect(() => {
    // Sauvegarder l'état actuel
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const originalPosition = document.body.style.position;

    // Calculer la largeur de la scrollbar pour éviter le "jump"
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Bloquer le scroll immédiatement
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Nettoyer à la fermeture
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position = originalPosition;
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