

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


export function buildFunnyMessage(typeId, equipId, EQUIP_CARDS) {
  const label = (EQUIP_CARDS.find((c) => c.id === equipId)?.label || equipId).toLowerCase();
  const ctx = typeId || "cet entraînement";
  if (typeId === "yoga" || typeId === "meditation") {
    switch (equipId) {
      case "halteres":
        return `Des haltères pour du ${ctx} ? On respire, on ne curl pas. 😅`;
      case "poulie":
        return `Une poulie pour du ${ctx} ? On accroche quoi, le zen ? 🧘‍♂️`;
      case "barre":
        return `Une barre pour du ${ctx} ? Le lotus n’a pas besoin de rack.`;
      case "kettlebell":
        return `Un kettlebell en ${ctx} ? Namaste, pas "swingaste".`;
      default:
        return `${label} pour du ${ctx} ? Restons légers: poids du corps.`;
    }
  }
  if (typeId === "etirement") {
    switch (equipId) {
      case "halteres":
        return `Des haltères pour l’étirement ? On allonge les muscles, pas la charge.`;
      case "poulie":
        return `Une poulie pour s’étirer ? On va finir par s’emmêler dans le câble…`;
      case "barre":
        return `Une barre pour s’étirer ? Le but c’est d’être souple, pas solide.`;
      default:
        return `${label} en étirement ? Un tapis suffit largement.`;
    }
  }
  return `${label} non disponible pour ${ctx}.`;
}



export function endSessionMessage(isConnected) {
  if (isConnected) {
    return "Bien joué, séance terminée !";
  }
  return "Bien joué, séance terminée ! La prochaine fois connecte‑toi pour enregistrer tes stats.";
}