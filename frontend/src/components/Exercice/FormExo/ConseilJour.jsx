

import { memo, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ConseilJour.module.css";

const DEFAULT_TIPS = [
  {
    icon: "🎯",
    title: "Conseil du Jour",
    text:
      "La régularité est la clé du succès. Même 20 minutes d'exercice par jour font une vraie différence.",
    tags: ["#Motivation", "#Régularité", "#Progression"],
  },
  {
    icon: "🧘",
    title: "Respire",
    text:
      "Ajoute 5 minutes d'étirements en fin de séance. Tu récupères mieux et tu dors plus vite.",
    tags: ["#Récupération", "#Mobilité"],
  },
  {
    icon: "💧",
    title: "Hydratation",
    text:
      "Bois un grand verre d'eau 15 minutes avant l'entraînement. Performance ↑, crampes ↓.",
    tags: ["#Hydratation", "#Performance"],
  },
  {
    icon: "🍽️",
    title: "Après l'effort",
    text:
      "Une source de protéines dans les 2 heures post‑séance aide la réparation musculaire.",
    tags: ["#Nutrition", "#Récupération"],
  },
  {
    icon: "⏱️",
    title: "Mini‑séances",
    text:
      "Pas le temps ? 3 blocs de 10 minutes valent mieux que 0. Fractionne et fais‑le.",
    tags: ["#Habitudes", "#Productivité"],
  },
  {
    icon: "📈",
    title: "Progression",
    text:
      "Augmente une seule variable à la fois (poids, reps ou durée). Le corps aime la clarté.",
    tags: ["#ProgressiveOverload"],
  },
  {
    icon: "😴",
    title: "Sommeil",
    text:
      "7–9 h de sommeil = meilleure perte de gras, meilleure prise de muscle, meilleure humeur.",
    tags: ["#Récupération", "#Sommeil"],
  },
  {
    icon: "🥗",
    title: "Fibres",
    text:
      "Ajoute des légumes à 2 repas par jour. Satiété ↑, énergie plus stable.",
    tags: ["#Nutrition", "#Habitudes"],
  },
  {
    icon: "🔥",
    title: "Échauffement",
    text:
      "Fais 5 minutes d'échauffement spécifique: le premier set semblera 30% plus léger.",
    tags: ["#Préparation", "#Sécurité"],
  },
  {
    icon: "📅",
    title: "Plan",
    text:
      "Planifie ta prochaine séance avant de quitter la salle. La décision est la moitié du boulot.",
    tags: ["#Organisation", "#Discipline"],
  },
];

function ConseilJour({ tips = DEFAULT_TIPS, intervalMs = 5 * 60 * 1000 }) {
  const safeTips = Array.isArray(tips) && tips.length ? tips : DEFAULT_TIPS;
  const [index, setIndex] = useState(() => Math.floor(Math.random() * safeTips.length));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % safeTips.length);
    }, Math.max(30_000, intervalMs)); 
    return () => clearInterval(timerRef.current);
  }, [safeTips.length, intervalMs]);

  const tip = useMemo(() => safeTips[index % safeTips.length], [index, safeTips]);


  return (
    <div className={styles.tipCard} role="note" aria-label="Conseil du jour">
      <div className={styles.tipHeader}>
        <span className={styles.tipIcon} aria-hidden>{tip.icon || "🎯"}</span>
        <h3 className={styles.tipTitle}>{tip.title || "Conseil du Jour"}</h3>
      </div>
      <p className={styles.tipText}>{tip.text}</p>
      {Array.isArray(tip.tags) && tip.tags.length > 0 && (
        <div className={styles.tipTags} aria-label="Mots-clés">
          {tip.tags.map((t, i) => (
            <span key={i} className={styles.tipTag}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}


export default memo(ConseilJour);
