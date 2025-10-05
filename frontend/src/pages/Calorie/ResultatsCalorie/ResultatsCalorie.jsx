import React from "react";
import ResultatCard from "./ResultatCard.jsx";
import styles from "./ResultatsCalorie.module.css";

export default function ResultatsCalorie({ perte, stabiliser, prise, onCardClick }) {
  return (
    <div id="result-container" className={styles.resultatsContainer}>
      <ResultatCard
        titre="Perdre du poids"
        icone="/assets/icons/graphdown.svg"
        calories={perte}
        description="Ce niveau de consommation de calories quotidien te permettra de perdre entre 0,5 et 1 kg par semaine d'une manière saine et durable."
        onClick={(e) => onCardClick && onCardClick("perte", e)}
      />
      <ResultatCard
        titre="Stabiliser"
        icone="/assets/icons/graph.svg"
        calories={stabiliser}
        description="Ce niveau de consommation de calories quotidien te permettra de stabiliser ton poids actuel."
        onClick={(e) => onCardClick && onCardClick("stabiliser", e)}
      />
      <ResultatCard
        titre="Prendre du poids"
        icone="/assets/icons/graphup.svg"
        calories={prise}
        description="Ce niveau de consommation de calories quotidien te permettra de prendre entre 0,5 et 1 kg par semaine."
        onClick={(e) => onCardClick && onCardClick("prise", e)}
      />
    </div>
  );
}