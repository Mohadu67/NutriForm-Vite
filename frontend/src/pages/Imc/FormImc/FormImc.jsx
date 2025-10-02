import BoutonAction from "../../../components/BoutonAction/BoutonAction.jsx";
import { useState } from "react";
import styles from "./FormImc.module.css";
import ConnectReminder from "../../../components/MessageAlerte/ConnectReminder/ConnectReminder.jsx";
import LabelField from "../../../components/LabelField/LabelField.jsx";

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function normalizeNumber(value) {
  if (typeof value === "string") {
    value = value.replace(",", ".");
  }
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

function calculerIMC(poids, taille) {
  const imcValue = poids / ((taille / 100) ** 2);
  const imc = Math.round(imcValue * 10) / 10;
  let categorie = "";
  let description = "";
  let conseil = "";

  if (imc < 16.5) {
    categorie = "dénutrition";
    description = "Dénutrition sévère";
    conseil = "Consultez rapidement un professionnel de santé.";
  } else if (imc < 18.5) {
    categorie = "maigreur";
    description = "Insuffisance pondérale";
    conseil = "Un suivi médical est recommandé pour évaluer votre santé.";
  } else if (imc < 25) {
    categorie = "normal";
    description = "Corpulence normale";
    conseil = "Maintenez vos bonnes habitudes alimentaires et votre activité physique.";
  } else if (imc < 30) {
    categorie = "surpoids";
    description = "Surpoids";
    conseil = "Adoptez une alimentation équilibrée et augmentez votre activité physique.";
  } else if (imc < 35) {
    categorie = "obésité";
    description = "Obésité modérée";
    conseil = "Consultez un professionnel de santé pour un accompagnement personnalisé.";
  } else if (imc < 40) {
    categorie = "obésité";
    description = "Obésité sévère";
    conseil = "Un suivi médical est fortement recommandé.";
  } else {
    categorie = "obésité";
    description = "Obésité massive";
    conseil = "Consultez rapidement un professionnel de santé.";
  }

  return { imc, categorie, description, conseil };
}

export default function FormImc({ onCalculate }) {
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [showReminder, setShowReminder] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const p = normalizeNumber(poids);
    const t = normalizeNumber(taille);

    if (p === null || t === null) {
      alert("Veuillez entrer un poids et une taille valides.");
      return;
    }

    if (t < 50 || t > 300 || p < 50 || p > 500) {
      alert("Taille entre 50–300 cm et poids entre 50–500 kg.");
      return;
    }

    const userId = localStorage.getItem("userId");
    setShowReminder(!userId);

    const { imc, categorie, description, conseil } = calculerIMC(p, t);
    onCalculate?.(imc, categorie, description, conseil);

    try {
      const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken');
      if (!token) {
        console.warn('[IMC] Aucun token trouvé: la route /api/history refusera (401/400).');
      }
      if (token) {
        const url = `${API_URL ? API_URL : ''}/api/history`;
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'IMC_CALC',
            meta: {
              poids: p,
              taille: t,
              imc,
              categorie,
              date: new Date().toISOString(),
            },
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              if (res.status === 401) setShowReminder(true);

              if (import.meta.env.DEV) {
                const txt = await res.text().catch(() => '');
                console.warn('[IMC] /api/history non OK:', res.status, txt);
              }
            }
          })
          .catch((e) => {
            if (import.meta.env.DEV) console.warn('[IMC] /api/history erreur:', e);
          });
      }
    } catch (_) {}

    if (userId && window.sauvegarderDonnees) {
      try {
        window.sauvegarderDonnees({ imc });
      } catch (_) {
      }
    }
  };

  const blockNonNumeric = (e) => {
    if (["e", "E", "+", "-", " "].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-describedby="form-help">
      <h1 className={styles.h1} > L'indice de masse corporelle</h1>
      <LabelField label="Taille (cm)" htmlFor="taille" required>
        <input
          className={styles.input}
          id="taille"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="50"
          max="300"
          placeholder="ex: 180"
          value={taille}
          onKeyDown={blockNonNumeric}
          onChange={(e) => setTaille(e.target.value)}
          required
        />
      </LabelField>

      <LabelField label="Poids (kg)" htmlFor="poids" required>
        <input
          className={styles.input}
          id="poids"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="50"
          max="500"
          placeholder="ex: 75"
          value={poids}
          onKeyDown={blockNonNumeric}
          onChange={(e) => setPoids(e.target.value)}
          required
        />
      </LabelField>

      {/* <button className={styles.button} type="submit">Calculer</button> */}
      <BoutonAction type="submit">
        Calculer
      </BoutonAction>

      <ConnectReminder show={showReminder} />


      <p id="form-help" className={styles.helper}>
        Entrez votre taille en centimètres (cm) et votre poids en kilogrammes (kg), puis cliquez sur "Calculer" pour obtenir votre indice de masse corporelle (IMC) et sa catégorie associée.
      </p>
    </form>
  );
}