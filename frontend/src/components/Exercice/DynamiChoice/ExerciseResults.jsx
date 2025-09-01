import { useEffect, useMemo, useState } from "react";
import ExerciceCard from "./ExerciceCard";
import { rechercherExercices } from "./MoteurRecherche/MoteurRecherche.jsx";

export default function ExerciseResults({ typeId, equipIds = [], muscleIds = [], onChange, onResultsChange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ordered, setOrdered] = useState([]);
  const [dragKey, setDragKey] = useState(null);

  const emit = (list) => {
    if (onResultsChange) onResultsChange(list);
    else if (onChange) onChange(list);
  };

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

  const results = useMemo(() => {
    if (!data.length) return [];
    return rechercherExercices(
      { typeId, equipIds, muscleIds, sortBy: "pertinence", limit: 24, equipmentPolicy: "anyRequired", musclePolicy: "anyRequired" },
      data
    );
  }, [data, typeId, equipIds, muscleIds]);

  useEffect(() => {
    setOrdered(results);
    emit(results);
  }, [results]);

  function onDragStartItem(e, exo) {
    setDragKey(exo.id || exo.name);
  }
  function onDragOverItem(e, exo) {
  }
  function onDropItem(e, exo) {
    const fromKey = dragKey;
    const toKey = exo.id || exo.name;
    if (!fromKey || fromKey === toKey) return;
    setOrdered((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((x) => (x.id || x.name) === fromKey);
      const to = arr.findIndex((x) => (x.id || x.name) === toKey);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      emit(arr);
      return arr;
    });
    setDragKey(null);
  }
  function onRemoveItem(exo) {
    setOrdered((prev) => {
      const arr = prev.filter((x) => (x.id || x.name) !== (exo.id || exo.name));
      emit(arr);
      return arr;
    });
  }

  if (loading) return <p>Chargement des exercices…</p>;
  if (error) return <p style={{ color: "#ef4444" }}>Erreur: {error}</p>;
  if (!results.length) return <p>Aucun exercice trouvé. Essaie d'élargir tes choix d'équipement ou de muscles.</p>;

  return (
    <div style={{ display: "grid", gap: ".75rem" }}>
      {ordered.map((exo) => (
        <ExerciceCard
          key={exo.id || exo.name}
          exo={exo}
          draggable
          onDragStart={onDragStartItem}
          onDragOver={onDragOverItem}
          onDrop={onDropItem}
          onRemove={onRemoveItem}
          onAdd={(exo) => {
            setOrdered((prev) => {
              if (prev.some((x) => (x.id || x.name) === (exo.id || exo.name))) return prev;
              const arr = [...prev, exo];
              emit(arr);
              return arr;
            });
          }}
          isAdded={ordered.some((x) => (x.id || x.name) === (exo.id || exo.name))}
        />
      ))}
    </div>
  );
}