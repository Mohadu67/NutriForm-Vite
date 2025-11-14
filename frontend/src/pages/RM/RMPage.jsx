import { useState, useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import usePageTitle from "../../hooks/usePageTitle.js";
import FormRM from "./FormRM/FormRM.jsx";
import ResultatsRM from "./ResultatsRM/ResultatsRM.jsx";
import TableauCharges from "./TableauCharges/TableauCharges.jsx";
import ArticlesRM from "./ArticlesRM/ArticlesRM.jsx";

export default function RMPage() {
  usePageTitle("Calculateur 1RM");
  const [rmData, setRmData] = useState(null);

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Comment calculer son 1RM (charge maximale)",
    "description": "Guide pour estimer votre force maximale (1RM) en toute sécurité sans tester directement avec des charges lourdes",
    "image": "https://harmonith.fr/og-image.png",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": "0"
    },
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Poids utilisé pour le test"
      },
      {
        "@type": "HowToTool",
        "name": "Compteur de répétitions"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Choisissez votre exercice",
        "text": "Sélectionnez l'exercice pour lequel vous voulez connaître votre 1RM (développé couché, squat, soulevé de terre, etc.)",
        "url": "https://harmonith.fr/outils?tool=rm#step1"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Effectuez une série avec une charge modérée",
        "text": "Réalisez une série avec une charge que vous pouvez soulever entre 3 et 10 répétitions. Ne testez jamais directement votre 1RM sans échauffement.",
        "url": "https://harmonith.fr/outils?tool=rm#step2"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Entrez vos données",
        "text": "Renseignez le poids soulevé (en kg) et le nombre de répétitions effectuées dans notre calculateur.",
        "url": "https://harmonith.fr/outils?tool=rm#step3"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Obtenez votre 1RM estimé",
        "text": "Notre calculateur utilise la moyenne de 7 formules scientifiques (Epley, Brzycki, Lander, Lombardi, Mayhew, O'Conner, Wathan) pour estimer votre force maximale et vous proposer un tableau de charges d'entraînement.",
        "url": "https://harmonith.fr/outils?tool=rm#step4"
      }
    ]
  };

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

    const payload = {
      action: "CUSTOM",
      meta: {
        ...testData,
        label: `Test 1RM - ${rmData.exercice}`,
      },
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Test de 1RM sauvegardé avec succès ! 💪");
      } else {
        const error = await response.json();
        alert(error.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      alert("Erreur de connexion au serveur");
    }
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      </Helmet>
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
