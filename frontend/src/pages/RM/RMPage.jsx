import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import usePageTitle from "../../hooks/usePageTitle.js";
import { isAuthenticated, secureApiCall } from "../../utils/authService.js";
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from "../../components/Navbar/NavIcons";
import FormRM from "./FormRM/FormRM.jsx";
import ResultatsRM from "./ResultatsRM/ResultatsRM.jsx";
import TableauCharges from "./TableauCharges/TableauCharges.jsx";
import ArticlesRM from "./ArticlesRM/ArticlesRM.jsx";
import styles from "./RMPage.module.css";

export default function RMPage() {
  usePageTitle("Calculateur 1RM");
  const [rmData, setRmData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

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
    if (!rmData || saving) return;

    if (!isAuthenticated()) {
      showToast("Connecte-toi pour sauvegarder tes tests de 1RM et suivre ta progression !", "warning");
      return;
    }

    setSaving(true);

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
      const response = await secureApiCall('/history', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast("Test de 1RM sauvegardé avec succès !", "success");
      } else {
        const error = await response.json();
        showToast(error.message || "Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion au serveur", "error");
    } finally {
      setSaving(false);
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
            <ResultatsRM data={rmData} onSave={handleSaveTest} saving={saving} />
            <TableauCharges rm={rmData.rm} />
          </>
        )}
        <ArticlesRM />
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' && <CheckIcon size={16} />}
            {toast.type === 'error' && <XIcon size={16} />}
            {toast.type === 'warning' && <AlertTriangleIcon size={16} />}
            {toast.type === 'info' && <InfoIcon size={16} />}
          </span>
          <span className={styles.toastMessage}>{toast.message}</span>
          <button
            className={styles.toastClose}
            onClick={() => setToast({ show: false, message: '', type: 'info' })}
            aria-label="Fermer"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}
    </>
  );
}
