import { useEffect, useMemo, useState } from "react";
import ExerciceCard from "../DynamiChoice/ExerciceCard.jsx";
import { rechercherExercices } from "../DynamiChoice/MoteurRecherche/MoteurRecherche.jsx";
import Button from "../../BoutonAction/BoutonAction.jsx";
import styles from "./ExerciseResults.module.css";

const keyOf = (ex) =>
  String(ex?.id ?? ex?.name ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .trim();

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

  function broadcastSelection(next) {
    try { localStorage.setItem("dynamiSelected", JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("dynami:selected:update", { detail: { items: next } }));
    if (onResultsChange) onResultsChange(next);
    else if (onChange) onChange(next);
  }

  useEffect(() => {
    if (Array.isArray(ordered) && ordered.length > 0) setHasTouched(true);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("dynamiHasTouched", hasTouched ? "1" : "0"); } catch {}
  }, [hasTouched]);

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
      broadcastSelection(results);
    }
  }, [results, hasTouched, ordered.length]);

  const proposed = useMemo(() => {
    if (!results.length) return [];
    const chosenKeys = new Set(ordered.map((x) => keyOf(x)));
    return results.filter((ex) => {
      const k = keyOf(ex);
      return !chosenKeys.has(k) && !dismissed.has(k);
    });
  }, [results, ordered, dismissed]);

  const combined = useMemo(() => {
    return [...ordered, ...proposed];
  }, [ordered, proposed]);

  useEffect(() => {
    broadcastSelection(ordered);
  }, [ordered]);

  useEffect(() => {
    try { localStorage.setItem("dynamiDismissed", JSON.stringify(Array.from(dismissed))); } catch {}
  }, [dismissed]);

  function onDragStartItem(e, exo) {
    setDragKey(keyOf(exo));
  }
  function onDragOverItem(e, exo) {
    e.preventDefault();
  }
  function onDropItem(e, exo) {
    setHasTouched(true);
    const fromKey = dragKey;
    const toKey = keyOf(exo);
    if (!fromKey || fromKey === toKey) return;
    setOrdered((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((x) => keyOf(x) === fromKey);
      const to = arr.findIndex((x) => keyOf(x) === toKey);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      broadcastSelection(arr);
      return arr;
    });
    setDragKey(null);
  }
  function onRemoveItem(exo) {
    setHasTouched(true);
    setOrdered((prev) => {
      const arr = prev.filter((x) => keyOf(x) !== keyOf(exo));
      broadcastSelection(arr);
      return arr;
    });
  }
  function onDismissItem(exo) {
    const k = keyOf(exo);
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }

  function handleResetSuggestions() {
    setHasTouched(true);
    setDismissed(new Set());
    if (Array.isArray(results) && results.length > 0) {
      setOrdered(results);
      broadcastSelection(results);
    }
  }

  useEffect(() => {
    setDismissed(new Set());
    try { localStorage.removeItem("dynamiDismissed"); } catch {}

    setOrdered((prev) => {
      const resultKeys = new Set(results.map((ex) => keyOf(ex)));

      // Si la sélection devient vide après un changement de filtres, on remplit avec les résultats courants
      const next = prev.filter((ex) => resultKeys.has(keyOf(ex)));

      if (next.length === 0 && results.length > 0) {
        broadcastSelection(results);
        return results;
      }

      if (next.length !== prev.length) broadcastSelection(next);
      return next;
    });
  }, [typeId, equipIds, muscleIds, results]);

  if (loading) return <p>Chargement des exercices…</p>;
  if (error) return <p className={styles.error}>Erreur: {error}</p>;
  if (!results.length) return (
    <div className={styles.noResults}>
      <p>Aucun exercice trouvé… pour l’instant ! On travaille en salle pour ajouter plus d’exos. Tu peux aussi élargir tes filtres.</p>
      {onSearch && (
        <Button type="button" onClick={onSearch} aria-label="Ajouter des exercices">
          + Ajouter d'autres exercices
        </Button>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {onSearch && (
        <div className={styles.actions}>
          {dismissed.size > 0 && (
            <button type="button" onClick={handleResetSuggestions} className={styles.resetBtn}>
              Réinitialiser les suggestions
            </button>
          )}
          <Button className={styles.BtnAjout} type="button" onClick={onSearch} aria-label="Ajouter des exercices">
            + Ajouter d'autres exercices
          </Button>
        </div>
      )}

      <div className={styles.list}>
        {combined.length === 0 ? (
          <p className={styles.empty}>Aucun exercice sélectionné pour l’instant.</p>
        ) : (
          combined.map((exo) => {
            const key = keyOf(exo);
            const isSelected = ordered.some((x) => keyOf(x) === key);
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
                  if (isSelected) return;
                  setHasTouched(true);
                  setOrdered((prev) => {
                    if (prev.some((x) => keyOf(x) === key)) return prev;
                    const arr = [...prev, exo];
                    broadcastSelection(arr);
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