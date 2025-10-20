import styles from "./ResultatsCalorie.module.css";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";


export default function ResultatPopup({ titre, calories, macros, onClose }) {
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