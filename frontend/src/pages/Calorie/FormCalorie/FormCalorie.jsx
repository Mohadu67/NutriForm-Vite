const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
import { useState } from "react";
import styles from "./FormCalorie.module.css";
import ConnectReminder from "../../../components/MessageAlerte/ConnectReminder/ConnectReminder.jsx";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";


const getToken = () =>
  localStorage.getItem('token') ||
  sessionStorage.getItem('token') ||
  localStorage.getItem('jwt') ||
  localStorage.getItem('accessToken');


export default function FormCalorie({ onResult, onCalculate }) {
    console.log(onCalculate)
  const [showReminder, setShowReminder] = useState(false);
  const [form, setForm] = useState({
    sexe: "homme",
    poids: "",
    taille: "",
    age: "",
    formule: "standard",
    masseGrasse: "",
    activite: "faible", 
  });

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      sexe: form.sexe,
      poids: parseFloat(form.poids),
      taille: parseFloat(form.taille),
      age: parseInt(form.age, 10),
      formule: form.formule, 
      masseGrasse:
        form.formule === "katch" && form.masseGrasse !== ""
          ? parseFloat(form.masseGrasse)
          : undefined,
      activite: form.activite, 
    };

    if (
      !payload.sexe ||
      Number.isNaN(payload.poids) ||
      Number.isNaN(payload.taille) ||
      Number.isNaN(payload.age) ||
      !payload.formule ||
      !payload.activite
    ) {
      return;
    }

    let tmb = 0;
    if (payload.formule === "katch") {
      if (payload.masseGrasse === undefined || Number.isNaN(payload.masseGrasse)) return;
      const masseMaigre = payload.poids * (1 - payload.masseGrasse / 100);
      tmb = 370 + 21.6 * masseMaigre;
    } else {
      tmb =
        payload.sexe === "homme"
          ? 10 * payload.poids + 6.25 * payload.taille - 5 * payload.age + 5
          : 10 * payload.poids + 6.25 * payload.taille - 5 * payload.age - 161;
    }

    const facteurs = {
      faible: 1.2,
      moyen: 1.55,
      actif: 1.75,
      tresactif: 1.9,
    };
    const facteur = facteurs[payload.activite] ?? 1.2;

    const calories = Math.round(tmb * facteur);

    if (typeof onResult === "function") {
      onResult(calories);
    }
    if (typeof onCalculate === "function") {
      onCalculate({ ...payload, calories });
    }
    try {
      const token = getToken();
      if (!token) {
        // Pas connecté: on affiche le rappel APRES la soumission
        setShowReminder(true);
      }
      const url = `${API_URL ? API_URL : ''}/api/history`;
      const body = {
        action: 'CALORIES_CALC',
        meta: {
          ...payload,
          calories,
          date: new Date().toISOString(),
        },
      };
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          if (!res.ok && import.meta.env.DEV) {
            const txt = await res.text().catch(() => '');
            console.warn('[CALORIES] /api/history non OK:', res.status, txt);
          }
          if (res.status === 401) {
            setShowReminder(true);
          }
        })
        .catch((e) => {
          if (import.meta.env.DEV) console.warn('[CALORIES] /api/history erreur:', e);
        });
    } catch (_) {}
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Formulaire de calcul calorique">
      <fieldset className={styles.fieldset}>
        <legend>Vos informations</legend>

                <label>
          Formule
          <select
            value={form.formule}
            onChange={(e) => update("formule", e.target.value)}
          >
            <option value="standard">Standard </option>
            <option value="mifflin">Mifflin-St Jeor ( Pro )</option>
            <option value="katch">Katch-McArdle (nécessite % masse grasse)</option>
          </select>
        </label>

        <div className={styles.sexeGroup}>
          <span className={styles.groupTitle}>Sexe :</span>

          <label>
            <input
              type="radio"
              name="sexe"
              value="homme"
              className={styles.hiddenCheckbox}
              checked={form.sexe === "homme"}
              onChange={() => update("sexe", "homme")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('sexe', 'homme')}
              onClick={() => update("sexe", "homme")}
              className={styles.pill}
            >
              Homme
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="sexe"
              value="femme"
              className={styles.hiddenCheckbox}
              checked={form.sexe === "femme"}
              onChange={() => update("sexe", "femme")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('sexe', 'femme')}
              onClick={() => update("sexe", "femme")}
              className={styles.pill}
            >
              Femme
            </span>
          </label>
        </div>

        <label>
          Poids (kg)
          <input
            type="number"
            inputMode="decimal"
            min="50"
            max="500"
            step="0.1"
            value={form.poids}
            onChange={(e) => update("poids", e.target.value)}
            placeholder="ex: 75"
            required
          />
        </label>

        <label>
          Taille (cm)
          <input
            type="number"
            inputMode="numeric"
            min="100"
            max="300"
            step="0.5"
            value={form.taille}
            onChange={(e) => update("taille", e.target.value)}
            placeholder="ex: 180"
            required
          />
        </label>

        <label>
          Âge (années)
          <input
            type="number"
            inputMode="numeric"
            min="12"
            step="1"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="ex: 25"
            required
          />
        </label>

        {form.formule === "katch" && (
          <label>
            Masse grasse (%)
            <input
              type="number"
              inputMode="decimal"
              min="8"
              max="70"
              step="0.1"
              value={form.masseGrasse}
              onChange={(e) => update("masseGrasse", e.target.value)}
              placeholder="ex: 18"
              required
            />
          </label>
        )}

        <div className={styles.activiteGroup}>
          <span className={styles.groupTitle} style={{ textAlign: 'center' }}>Niveau d'activité :</span>

          <label>
            <input
              type="radio"
              name="activite"
              value="faible"
              className={styles.hiddenCheckbox}
              checked={form.activite === "faible"}
              onChange={() => update("activite", "faible")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('activite', 'faible')}
              onClick={() => update("activite", "faible")}
              className={styles.pill}
            >
              Peu actif
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="activite"
              value="moyen"
              className={styles.hiddenCheckbox}
              checked={form.activite === "moyen"}
              onChange={() => update("activite", "moyen")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('activite', 'moyen')}
              onClick={() => update("activite", "moyen")}
              className={styles.pill}
            >
              Moyen
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="activite"
              value="actif"
              className={styles.hiddenCheckbox}
              checked={form.activite === "actif"}
              onChange={() => update("activite", "actif")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('activite', 'actif')}
              onClick={() => update("activite", "actif")}
              className={styles.pill}
            >
              Actif
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="activite"
              value="tresactif"
              className={styles.hiddenCheckbox}
              checked={form.activite === "tresactif"}
              onChange={() => update("activite", "tresactif")}
            />
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && update('activite', 'tresactif')}
              onClick={() => update("activite", "tresactif")}
              className={styles.pill}
            >
              Très actif
            </span>
          </label>
        </div>

        <BoutonAction type="submit">
          Calculer
        </BoutonAction>

        <ConnectReminder
          show={showReminder}
          message="Connecte-toi pour enregistrer tes calculs et retrouver ton historique."
          cta="Se connecter"
        />
        
      </fieldset>
    </form>
  );
}