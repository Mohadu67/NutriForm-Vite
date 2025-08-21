import { useState } from "react";
import styles from "./FormImc.module.css";

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
  if (imc < 18.5) categorie = "maigreur";
  else if (imc < 25) categorie = "normal";
  else if (imc < 30) categorie = "surpoids";
  else categorie = "obésité";
  return { imc, categorie };
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

    const { imc, categorie } = calculerIMC(p, t);
    onCalculate?.(imc, categorie);

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
              // swallow silently in UI, but log in dev
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
      <label className={styles.label} htmlFor="taille">Taille (cm) :</label>
      <input
        className={styles.input}
        id="taille"
        type="number"
        inputMode="decimal"
        step="0.1"
        min="50"
        max="300"
        value={taille}
        onKeyDown={blockNonNumeric}
        onChange={(e) => setTaille(e.target.value)}
        required
      />

      <label className={styles.label} htmlFor="poids">Poids (kg) :</label>
      <input
        className={styles.input}
        id="poids"
        type="number"
        inputMode="decimal"
        step="0.1"
        min="50"
        max="500"
        value={poids}
        onKeyDown={blockNonNumeric}
        onChange={(e) => setPoids(e.target.value)}
        required
      />

      <button className={styles.button} type="submit">Calculer</button>

      {showReminder && (
        <div className={styles.reminder} aria-live="polite">
          Connecte-toi et accède à ton historique de calories !
        </div>
      )}

      <p id="form-help" className={styles.helper}>
        Astuce : tu peux saisir des décimales (ex: 72,5 ou 72.5)
      </p>
    </form>
  );
}