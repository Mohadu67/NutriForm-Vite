const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
import { useState } from "react";
import styles from "./FormCalorie.module.css";
import ConnectReminder from "../../../components/MessageAlerte/ConnectReminder/ConnectReminder.jsx";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";
import BoutonSelection from "../../../components/BoutonSelection/BoutonSelection.jsx";
import LabelField from "../../../components/LabelField/LabelField.jsx";


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

        <LabelField label="Formule" htmlFor="formule">
          <select
            id="formule"
            value={form.formule}
            onChange={(e) => update("formule", e.target.value)}
          >
            <option value="standard">Standard </option>
            <option value="mifflin">Mifflin-St Jeor ( Pro )</option>
            <option value="katch">Katch-McArdle (nécessite % masse grasse)</option>
          </select>
        </LabelField>

        <h4>Sexe</h4>
        <BoutonSelection
          className={styles.sexeGroup}
          name="sexe"
          value={form.sexe}
          options={[
            { value: "homme", label: "Homme" },
            { value: "femme", label: "Femme" },
          ]}
          onChange={(val) => update("sexe", val)}
        />

        <LabelField label="Poids (kg)" htmlFor="poids" required>
          <input
            id="poids"
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
        </LabelField>

        <LabelField label="Taille (cm)" htmlFor="taille" required>
          <input
            id="taille"
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
        </LabelField>

        <LabelField label="Âge (années)" htmlFor="age" required>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min="12"
            step="1"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="ex: 25"
            required
          />
        </LabelField>

        {form.formule === "katch" && (
          <LabelField label="Masse grasse (%)" htmlFor="masseGrasse" required helper="ex: 18">
            <input
              id="masseGrasse"
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
          </LabelField>
        )}
        <h4>Niveau d'activité</h4>
        <BoutonSelection
          className={styles.activiteGroup}
          name="activite"
          value={form.activite}
          options={[
            { value: "faible", label: "Peu actif" },
            { value: "moyen", label: "Moyen" },
            { value: "actif", label: "Actif" },
            { value: "tresactif", label: "Très actif" },
          ]}
          onChange={(val) => update("activite", val)}
        />

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