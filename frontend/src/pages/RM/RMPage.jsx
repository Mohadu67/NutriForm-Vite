import { useState, useEffect } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import FormRM from "./FormRM/FormRM.jsx";
import ResultatsRM from "./ResultatsRM/ResultatsRM.jsx";
import TableauCharges from "./TableauCharges/TableauCharges.jsx";
import ArticlesRM from "./ArticlesRM/ArticlesRM.jsx";

export default function RMPage() {
  usePageTitle("Calculateur 1RM");
  const [rmData, setRmData] = useState(null);

  useEffect(() => {
    if (rmData !== null) {
      setTimeout(() => {
        const element = document.getElementById('rm-results');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [rmData]);

  // Fonction pour sauvegarder le test RM
  const handleSaveTest = async () => {
    if (!rmData) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      alert("Connecte-toi pour sauvegarder tes tests de 1RM et suivre ta progression !");
      return;
    }

    const testData = {
      type: "rm",
      exercice: rmData.exercice,
      poids: rmData.poids,
      reps: rmData.reps,
      rm: rmData.rm,
      date: new Date().toISOString(),
      formulas: {
        epley: rmData.epley,
        brzycki: rmData.brzycki,
        lander: rmData.lander,
        lombardi: rmData.lombardi,
        mayhew: rmData.mayhew,
        oconner: rmData.oconner,
        wathan: rmData.wathan
      }
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        alert("Test de 1RM sauvegardé avec succès ! 💪");
      } else {
        const error = await response.json();
        alert(error.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion au serveur");
    }
  };

  return (
    <>
      <main>
        <FormRM onResult={(data) => setRmData(data)} />
        {rmData && (
          <>
            <ResultatsRM data={rmData} onSave={handleSaveTest} />
            <TableauCharges rm={rmData.rm} />
          </>
        )}
        <ArticlesRM />
      </main>
    </>
  );
}