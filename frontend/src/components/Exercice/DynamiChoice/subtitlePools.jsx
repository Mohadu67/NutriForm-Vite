

import { useEffect, useState } from "react";

export const SUBTITLE_POOLS = [
  [
    "D'humeur 'testo max' pour la muscu, ou plutôt 'cardio je brûle des calories' ?",
    "Muscu pour soulever la planète, cardio pour la fuir. Choisis.",
    "Plutôt pompe à biceps ou soufflerie à poumons aujourd'hui ?",
  ],
  [
    "On sort quoi aujourd'hui ? Barre, haltères, ou juste toi et la gravité.",
    "Ton meilleur équipement, c’est toi. Mais la barre aide, avouons-le.",
    "Haltères, barre, machine… sélectionne ton arsenal.",
  ],
  [
    "Dis-moi où ça pique, on optimise la séance.",
    "Quel muscle veut goûter au feu sacré ?",
    "Cible une zone et on déroule.",
  ],
];

export function pickSubtitle(step) {
  const pool = SUBTITLE_POOLS[step] || [""];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function useStepSubtitle(step) {
  const [subtitle, setSubtitle] = useState(pickSubtitle(step));
  useEffect(() => {
    setSubtitle(pickSubtitle(step));
  }, [step]);
  return subtitle;
}