import React, { useState, useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import usePageTitle from "../../hooks/usePageTitle.js";
import FormCalorie from "./FormCalorie/FormCalorie.jsx";
import ResultatsCalorie from "./ResultatsCalorie/ResultatsCalorie.jsx";
import ResultatPopup from "./ResultatsCalorie/ResultatPopup.jsx";
import ArticlesCalorie from "./ArticlesCalorie/ArticlesCalorie.jsx";

export default function CaloriePage() {
  usePageTitle("Calcul des calories");
  const [selectedCard, setSelectedCard] = useState(null);
  const [popupOrigin, setPopupOrigin] = useState({ x: 50, y: 50 });
  const [calories, setCalories] = useState(null);

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Comment calculer ses besoins caloriques quotidiens",
    "description": "Guide pour calculer vos besoins caloriques journaliers selon votre métabolisme de base et votre niveau d'activité physique",
    "image": "https://harmonith.fr/og-image.png",
    "totalTime": "PT3M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": "0"
    },
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Renseignez vos informations personnelles",
        "text": "Entrez votre âge, sexe, poids (en kg) et taille (en cm) dans le formulaire. Ces données sont essentielles pour calculer votre métabolisme de base.",
        "url": "https://harmonith.fr/calorie#step1"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Sélectionnez votre niveau d'activité",
        "text": "Choisissez votre niveau d'activité physique quotidienne : sédentaire, légèrement actif, modérément actif, très actif ou extrêmement actif. Ce facteur multiplie votre métabolisme de base.",
        "url": "https://harmonith.fr/calorie#step2"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Définissez votre objectif",
        "text": "Indiquez si vous souhaitez perdre du poids, maintenir votre poids actuel ou prendre de la masse. Cela ajustera vos besoins caloriques en conséquence.",
        "url": "https://harmonith.fr/calorie#step3"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Consultez vos résultats personnalisés",
        "text": "Obtenez votre dépense énergétique totale (DET), vos besoins caloriques selon votre objectif, et la répartition recommandée en macronutriments (protéines, glucides, lipides).",
        "url": "https://harmonith.fr/calorie#step4"
      }
    ]
  };

  useEffect(() => {
    if (calories !== null) {
      setTimeout(() => {
        const element = document.getElementById('result-container');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [calories]);

  const computeMacros = (cals, type) => {
    if (type === "perte") {
      return {
        glucides: Math.round((cals * 0.35) / 4),
        proteines: Math.round((cals * 0.35) / 4),
        lipides: Math.round((cals * 0.30) / 9),
      };
    } else if (type === "prise") {
      return {
        glucides: Math.round((cals * 0.35) / 4),
        proteines: Math.round((cals * 0.35) / 4),
        lipides: Math.round((cals * 0.30) / 9),
      };
    } else {
      
      return {
        glucides: Math.round((cals * 0.45) / 4),
        proteines: Math.round((cals * 0.25) / 4),
        lipides: Math.round((cals * 0.30) / 9),
      };
    }
  };

  return (
    <>
      <Helmet>
        <title>Calculateur de Calories Gratuit - Harmonith | Besoins Caloriques Personnalisés</title>
        <meta name="description" content="Calculateur de calories gratuit et précis basé sur la formule Mifflin-St Jeor. Découvrez vos besoins caloriques quotidiens selon votre objectif : perte de poids, maintien ou prise de masse." />
        <meta property="og:title" content="Calculateur de Calories Gratuit - Harmonith" />
        <meta property="og:description" content="Calculez vos besoins caloriques quotidiens gratuitement avec notre outil basé sur des formules scientifiques validées." />
        <meta property="og:url" content="https://harmonith.fr/calorie" />
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      </Helmet>
    <main>
      <FormCalorie onResult={(value) => setCalories(value)} />
        {calories !== null && (
          <ResultatsCalorie
            perte={calories - 500}
            stabiliser={calories}
            prise={calories + 500}
            onCardClick={(type, e) => {
              if (e && typeof e.clientX === "number") {
                const x = Math.round((e.clientX / window.innerWidth) * 100);
                const y = Math.round((e.clientY / window.innerHeight) * 100);
                setPopupOrigin({ x, y });
              } else {
                setPopupOrigin({ x: 50, y: 50 });
              }
              setSelectedCard(type);
            }}
          />
        )}
        {selectedCard && calories !== null && (
          <ResultatPopup
            titre={selectedCard}
            calories={
              selectedCard === "perte"
                ? calories - 500
                : selectedCard === "stabiliser"
                ? calories
                : calories + 500
            }
            macros={(() => {
              const base =
                selectedCard === "perte"
                  ? calories - 500
                  : selectedCard === "stabiliser"
                  ? calories
                  : calories + 500;
              return computeMacros(base, selectedCard);
            })()}
            onClose={() => setSelectedCard(null)}
            origin={popupOrigin}
          />
        )}
          <ArticlesCalorie />
    </main>
    </>
  );
}