import { useState, useEffect } from "react";
import styles from "./FormExo.module.css";
import DynamiChoice from "../DynamiChoice/DynamiChoice.jsx";
import Progress from "../DynamiChoice/Progress.jsx";
import Salutation from "./salutation.jsx";
import SuivieExo from "../ExerciceSuivie/SuivieExo.jsx";

export default function FormExo({ user }) {
  const [sessionName, setSessionName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("formSessionName")) || ""; } catch { return ""; }
  });
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(localStorage.getItem("formCurrentStep"), 10) || 0; } catch { return 0; }
  });
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("formMode") || "builder"; } catch { return "builder"; }
  });
  const [selectedExercises, setSelectedExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem("formSelectedExercises")) || []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("formSessionName", JSON.stringify(sessionName)); } catch {} }, [sessionName]);
  useEffect(() => { try { localStorage.setItem("formCurrentStep", String(currentStep)); } catch {} }, [currentStep]);
  useEffect(() => { try { localStorage.setItem("formMode", mode); } catch {} }, [mode]);
  useEffect(() => { try { localStorage.setItem("formSelectedExercises", JSON.stringify(selectedExercises)); } catch {} }, [selectedExercises]);
  const steps = [
    { title: "Entrainement", sub: "Choisi ton entrainement" },
    { title: "Équipement", sub: "Sélectionne tes équipement" },
    { title: "Muscles", sub: "Cible les muscles" },
    { title: "Exercices", sub: "Personnalisez votre séance" },
  ];

  return (
    <div className={styles.form}>
      {mode === "builder" ? (
        <Salutation className={styles.title} />
      ) : (
        <Salutation className={styles.title} />
      )}

      {mode === "builder" && (
        <div className={styles.sessionName}>
          <label>Nom de ta séance :</label>
          <input
            type="text"
            placeholder="Ex: Séance du lundi"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>
      )}

      {mode === "builder" ? (
        <>
          <Progress steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

          <DynamiChoice
            requestedStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={(selection) => {
              console.log("Choix séance:", selection);
              const list = Array.isArray(selection)
                ? selection
                : (selection?.selectedExercises || selection?.exercises || []);
              setSelectedExercises(list);
              setMode("session");
            }}
          />
        </>
      ) : (
        <SuivieExo
          sessionName={sessionName}
          exercises={selectedExercises}
          onBack={() => setMode("builder")}
        />
      )}

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
