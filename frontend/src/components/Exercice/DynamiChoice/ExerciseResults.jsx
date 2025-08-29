

import { useEffect, useMemo, useState } from "react";
import ExerciceCard from "./ExerciceCard";

// Map high-level muscle cards to underlying tags used in db.json
const MUSCLE_MAP = {
  bras: ["biceps", "triceps", "avant-bras"],
  dos: ["dos-lats", "dos-trap", "arriere-epaules"],
  epaules: ["deltoides-ant", "deltoides-lat", "deltoides-post"],
  pectoraux: ["pectoraux", "pectoraux-superieurs", "pectoraux-inferieurs"],
  jambes: ["quadriceps", "ischios", "fessiers", "mollets", "adducteurs", "abducteurs"],
  core: ["abdos", "obliques", "lombaires", "core"],
};

// Map typeId from UI to db tags
const TYPE_MAP = {
  muscu: ["muscu"],
  cardio: ["cardio"],
  renfo: ["renforcement", "muscu"],
  yoga: ["yoga"],
  etirement: ["etirement", "stretching"],
  meditation: ["meditation"],
};

export default function ExerciseResults({ typeId, equipIds = [], muscleIds = [] }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch("/data/db.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setData(Array.isArray(json.exercises) ? json.exercises : []);
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(e.message || "Erreur de chargement");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const criteria = useMemo(() => {
    const type = TYPE_MAP[typeId] || [];
    const muscles = muscleIds.flatMap((k) => MUSCLE_MAP[k] || []);
    const equipment = equipIds;
    return { type, muscles, equipment };
  }, [typeId, equipIds, muscleIds]);

  const results = useMemo(() => {
    if (!data.length) return [];
    const wantedType = new Set(criteria.type);
    const wantedMuscles = new Set(criteria.muscles);
    const wantedEquip = new Set(criteria.equipment);

    function scoreExo(exo) {
      let s = 0;
      // type: require at least one match if provided
      if (wantedType.size) {
        const tMatch = (exo.type || []).some((t) => wantedType.has(t));
        if (!tMatch) return -1; // hard filter out
        s += 2;
      }
      // equipment: soft filter, score per match
      if (wantedEquip.size) {
        (exo.equipment || []).forEach((e) => {
          if (wantedEquip.has(e)) s += 2;
        });
      }
      // muscles: soft filter, score per match
      if (wantedMuscles.size) {
        (exo.muscles || []).forEach((m) => {
          if (wantedMuscles.has(m)) s += 3;
        });
      }
      return s;
    }

    const scored = data
      .map((exo) => ({ exo, s: scoreExo(exo) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s);

    return scored.map((x) => x.exo).slice(0, 24);
  }, [data, criteria]);

  if (loading) return <p>Chargement des exercices…</p>;
  if (error) return <p style={{ color: "#ef4444" }}>Erreur: {error}</p>;
  if (!results.length) return <p>Aucun exercice trouvé. Essaie d'élargir tes choix d'équipement ou de muscles.</p>;

  return (
    <div style={{ display: "grid", gap: ".5rem" }}>
      {results.map((exo) => (
        <ExerciceCard key={exo.name} exo={exo} />
      ))}
    </div>
  );
}