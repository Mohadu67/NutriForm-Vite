import { useState, useEffect } from "react";
import { toast } from 'sonner';
import styles from "./FormCalorie.module.css";
import ConnectReminder from "../../../components/MessageAlerte/ConnectReminder/ConnectReminder.jsx";
import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";
import BoutonSelection from "../../../components/BoutonSelection/BoutonSelection.jsx";
import LabelField from "../../../components/LabelField/LabelField.jsx";
import { secureApiCall } from "../../../utils/authService.js";


export default function FormCalorie({ onResult, onCalculate }) {
  const [showReminder, setShowReminder] = useState(false);
  const [form, setForm] = useState(() => {
    const savedPoids = localStorage.getItem('userPoids');
    const savedTaille = localStorage.getItem('userTaille');
    return {
      sexe: "homme",
      poids: savedPoids || "",
      taille: savedTaille || "",
      age: "",
      formule: "mifflin",
      masseGrasse: "",
      activite: "faible",
      objectif: "stabiliser",
    };
  });

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    
    if (name === 'poids' && value) {
      localStorage.setItem('userPoids', value);
    }
    if (name === 'taille' && value) {
      localStorage.setItem('userTaille', value);
    }
  };

  
  useEffect(() => {
    const handleStorageChange = () => {
      const savedPoids = localStorage.getItem('userPoids');
      const savedTaille = localStorage.getItem('userTaille');
      setForm((prev) => ({
        ...prev,
        poids: savedPoids || prev.poids,
        taille: savedTaille || prev.taille,
      }));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    } else if (payload.formule === "mifflin") {
      
      tmb =
        payload.sexe === "homme"
          ? 10 * payload.poids + 6.25 * payload.taille - 5 * payload.age + 5
          : 10 * payload.poids + 6.25 * payload.taille - 5 * payload.age - 161;
    } else {
      
      tmb =
        payload.sexe === "homme"
          ? 88.362 + 13.397 * payload.poids + 4.799 * payload.taille - 5.677 * payload.age
          : 447.593 + 9.247 * payload.poids + 3.098 * payload.taille - 4.330 * payload.age;
    }

    const facteurs = {
      faible: 1.2,
      moyen: 1.55,
      actif: 1.75,
      tresactif: 1.9,
    };
    const facteur = facteurs[payload.activite] ?? 1.2;

    const calories = Math.round(tmb * facteur);

    toast.success(`Besoins caloriques : ${calories} kcal/jour`);

    if (typeof onResult === "function") {
      onResult(calories);
    }
    if (typeof onCalculate === "function") {
      onCalculate({ ...payload, calories });
    }
    try {
      const body = {
        action: 'CALORIES_CALC',
        meta: {
          ...payload,
          calories,
          date: new Date().toISOString(),
        },
      };
      secureApiCall('/api/history', {
        method: 'POST',
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
    <section className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Calculateur calorique</h1>
        <p className={styles.subtitle}>
          Détermine tes besoins énergétiques journaliers pour ajuster ton alimentation en fonction de tes objectifs.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} aria-label="Formulaire de calcul calorique">
        <div className={styles.formGrid}>
          <div className={`${styles.inlineGroup} ${styles.fullWidth}`}>
            <p className={styles.groupLabel}>Sexe</p>
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
          </div>

          <LabelField label="Formule" htmlFor="formule">
            <select
              id="formule"
              value={form.formule}
              onChange={(e) => update("formule", e.target.value)}
            >
              <option value="standard">Harris-Benedict (Standard)</option>
              <option value="mifflin">Mifflin-St Jeor (Recommandée)</option>
              <option value="katch">Katch-McArdle (Avancée)</option>
            </select>
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
            <LabelField label="Masse grasse (%)" htmlFor="masseGrasse">
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
        </div>

        {form.formule === "katch" && (
          <div className={styles.infoBox}>
            <p>La formule Katch-McArdle est la plus précise mais nécessite de connaître votre pourcentage de masse grasse.</p>
          </div>
        )}

        <div className={`${styles.section} ${styles.inlineGroup}`}>
          <h4 className={styles.sectionTitle}>Niveau d'activité</h4>
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
        </div>

        <BoutonAction type="submit">
          Calculer
        </BoutonAction>

        <ConnectReminder
          show={showReminder}
          message="Connecte-toi pour enregistrer tes calculs et retrouver ton historique."
          cta="Se connecter"
        />
      </form>
    </section>
  );
}
