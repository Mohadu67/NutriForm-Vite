import React, { useState } from "react";
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
      // stabiliser
      return {
        glucides: Math.round((cals * 0.45) / 4),
        proteines: Math.round((cals * 0.25) / 4),
        lipides: Math.round((cals * 0.30) / 9),
      };
    }
  };

  return (
    <>
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