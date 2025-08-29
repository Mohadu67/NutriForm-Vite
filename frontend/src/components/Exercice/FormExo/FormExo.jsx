import { useState } from "react";
import styles from "./FormExo.module.css";
import DynamiChoice from "../DynamiChoice/DynamiChoice.jsx";
import Progress from "../DynamiChoice/Progress.jsx";

export default function FormExo({ user }) {
  const [sessionName, setSessionName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { title: "Entrainement", sub: "Choisi ton entrainement" },
    { title: "Équipement", sub: "Sélectionne tes équipement" },
    { title: "Muscles", sub: "Cible les muscles" },
    { title: "Exercices", sub: "Personnalisez votre séance" },
  ];

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>
        Bienvenue{user ? ` ${user.name}` : ""}, prêt pour une séance ?
      </h2>

      <div className={styles.sessionName}>
        <label>Nom de ta séance :</label>
        <input
          type="text"
          placeholder="Ex: Séance du lundi"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>

      
      <Progress steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

      <DynamiChoice
        requestedStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={(selection) => {
          console.log("Choix séance:", selection);
        }}
      />

      <div className={styles.history}>
        {user ? (
          <ul>
            <li>Dernier poids enregistré : {user.lastWeight ?? "—"} kg</li>
            <li>Dernière séance : {user.lastSession ?? "—"}</li>
            <li>Classement séance entre amis : {user.rank ?? "—"}</li>
            <li>IMC : {user.imc ?? "—"}</li>
            <li>Calories journalières : {user.calories ?? "—"}</li>
          </ul>
        ) : (
          <p>Connecte-toi pour suivre tes séances et voir ton historique.</p>
        )}
      </div>
    </div>
  );
}