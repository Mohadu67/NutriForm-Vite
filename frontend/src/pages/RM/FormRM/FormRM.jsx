import { useState } from "react";
import { LightbulbIcon } from "../../../components/Navbar/NavIcons";
import styles from "./FormRM.module.css";

export default function FormRM({ onResult }) {
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("");
  const [exercice, setExercice] = useState("Développé couché");

  const exercices = [
    "Développé couché",
    "Squat",
    "Soulevé de terre",
    "Développé militaire",
    "Rowing barre",
    "Développé incliné",
    "Traction",
    "Dips",
    "Autre"
  ];

  const calculateRM = (weight, repetitions) => {
    // Formule d'Epley (la plus populaire)
    const epley = weight * (1 + repetitions / 30);

    // Formule de Brzycki
    const brzycki = weight * (36 / (37 - repetitions));

    // Formule de Lander
    const lander = (100 * weight) / (101.3 - 2.67123 * repetitions);

    // Formule de Lombardi
    const lombardi = weight * Math.pow(repetitions, 0.10);

    // Formule de Mayhew
    const mayhew = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * repetitions));

    // Formule de O'Conner
    const oconner = weight * (1 + 0.025 * repetitions);

    // Formule de Wathan
    const wathan = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * repetitions));

    // Moyenne des formules pour plus de précision
    const moyenne = Math.round((epley + brzycki + lander + lombardi + mayhew + oconner + wathan) / 7);

    return {
      rm: moyenne,
      epley: Math.round(epley),
      brzycki: Math.round(brzycki),
      lander: Math.round(lander),
      lombardi: Math.round(lombardi),
      mayhew: Math.round(mayhew),
      oconner: Math.round(oconner),
      wathan: Math.round(wathan),
      poids: weight,
      reps: repetitions,
      exercice
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const weight = parseFloat(poids);
    const repetitions = parseInt(reps);

    if (weight > 0 && repetitions > 0 && repetitions <= 15) {
      const result = calculateRM(weight, repetitions);
      onResult(result);
    }
  };

  return (
    <section className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Calculateur 1RM</h1>
        <p className={styles.subtitle}>
          Calcule ta charge maximale (1 Rep Max) pour optimiser ton entraînement
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label htmlFor="exercice" className={styles.label}>
              Exercice
            </label>
            <select
              id="exercice"
              value={exercice}
              onChange={(e) => setExercice(e.target.value)}
              className={styles.select}
            >
              {exercices.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="poids" className={styles.label}>
              Poids soulevé (kg)
            </label>
            <input
              type="number"
              id="poids"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              placeholder="Ex: 80"
              min="1"
              step="0.5"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="reps" className={styles.label}>
              Nombre de répétitions
            </label>
            <input
              type="number"
              id="reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Ex: 8"
              min="1"
              max="15"
              className={styles.input}
              required
            />
            <span className={styles.hint}>Entre 1 et 15 répétitions</span>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Calculer mon 1RM
        </button>
      </form>

      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>
          <span className={styles.infoIcon}>
            <LightbulbIcon size={20} />
          </span>
          Pourquoi calculer son 1RM ?
        </h3>
        <ul className={styles.infoList}>
          <li>Planifier tes cycles d'entraînement en % de RM</li>
          <li>Suivre ta progression de force</li>
          <li>Ajuster tes charges pour chaque objectif (force, hypertrophie, endurance)</li>
          <li>Éviter de te blesser en connaissant tes limites</li>
        </ul>
      </div>
    </section>
  );
}