import { useEffect, useMemo, useState } from "react";
import ExerciceCard from "./ExerciceCard";
import { rechercherExercices } from "./MoteurRecherche/MoteurRecherche.jsx";
import Button from "../../BoutonAction/BoutonAction";

export default function ExerciseResults({ typeId, equipIds = [], muscleIds = [], onChange, onResultsChange, onSearch }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ordered, setOrdered] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiSelected");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [dismissed, setDismissed] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiDismissed");
      return new Set(v ? JSON.parse(v) : []);
    } catch {
      return new Set();
    }
  });
  const [hasTouched, setHasTouched] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiHasTouched");
      return v === "1";
    } catch {
      return false;
    }
  });
  const [dragKey, setDragKey] = useState(null);

  useEffect(() => {
    if (Array.isArray(ordered) && ordered.length > 0) setHasTouched(true);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("dynamiHasTouched", hasTouched ? "1" : "0"); } catch {}
  }, [hasTouched]);

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
    if (!hasTouched && ordered.length === 0 && results.length > 0) {
      setOrdered(results);
    }
  }, [results, hasTouched, ordered.length]);

  const proposed = useMemo(() => {
    if (!results.length) return [];
    const chosenKeys = new Set(ordered.map((x) => (x.id || x.name)));
    return results.filter((ex) => {
      const k = ex.id || ex.name;
      return !chosenKeys.has(k) && !dismissed.has(k);
    });
  }, [results, ordered, dismissed]);

  const combined = useMemo(() => {
    // selected first, then proposed
    return [...ordered, ...proposed];
  }, [ordered, proposed]);

  useEffect(() => {
    emit(ordered);
    try { localStorage.setItem("dynamiSelected", JSON.stringify(ordered)); } catch {}
  }, [ordered]);

  useEffect(() => {
    try { localStorage.setItem("dynamiDismissed", JSON.stringify(Array.from(dismissed))); } catch {}
  }, [dismissed]);

  function onDragStartItem(e, exo) {
    setDragKey(exo.id || exo.name);
  }
  function onDragOverItem(e, exo) {
  }
  function onDropItem(e, exo) {
    setHasTouched(true);
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
    setHasTouched(true);
    setOrdered((prev) => {
      const arr = prev.filter((x) => (x.id || x.name) !== (exo.id || exo.name));
      emit(arr);
      return arr;
    });
  }
  function onDismissItem(exo) {
    const k = exo.id || exo.name;
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }

  if (loading) return <p>Chargement des exercices…</p>;
  if (error) return <p style={{ color: "#ef4444" }}>Erreur: {error}</p>;
  if (!results.length) return (
    <div style={{ display: "grid", gap: 12 }}>
      <p>Aucun exercice trouvé… pour l’instant ! On travaille en salle pour ajouter plus d’exos. Tu peux aussi élargir tes filtres.</p>
      {onSearch && (
        <Button type="button" onClick={onSearch} aria-label="Ajouter des exercices">
          + Ajouter d'autres exercices
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {onSearch && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
          {dismissed.size > 0 && (
            <button type="button" onClick={() => setDismissed(new Set())} style={{ border: "none", background: "transparent", color: "#6b7280", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>
              Réinitialiser les suggestions
            </button>
          )}
          <Button type="button" onClick={onSearch} aria-label="Ajouter des exercices">
            + Ajouter d'autres exercices
          </Button>
        </div>
      )}

      <div style={{ display: "grid", gap: ".5rem" }}>
        {combined.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Aucun exercice sélectionné pour l’instant.</p>
        ) : (
          combined.map((exo) => {
            const key = exo.id || exo.name;
            const isSelected = ordered.some((x) => (x.id || x.name) === key);
            return (
              <ExerciceCard
                key={key}
                exo={exo}
                draggable={isSelected}
                onDragStart={isSelected ? onDragStartItem : undefined}
                onDragOver={isSelected ? onDragOverItem : undefined}
                onDrop={isSelected ? onDropItem : undefined}
                onRemove={isSelected ? onRemoveItem : onDismissItem}
                onAdd={(e) => {
                  if (isSelected) return; // déjà sélectionné
                  setHasTouched(true);
                  setOrdered((prev) => {
                    if (prev.some((x) => (x.id || x.name) === key)) return prev;
                    const arr = [...prev, exo];
                    emit(arr);
                    return arr;
                  });
                }}
                isAdded={isSelected}
              />
            );
          })
        )}
      </div>
    </div>
  );
}