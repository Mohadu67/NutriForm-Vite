import { useEffect, useMemo, useRef, useState } from "react";
import ExerciceCard from "./ExerciceCard/ExerciceCard.jsx";
import { rechercherExercices } from "../DynamiChoice/MoteurRecherche/MoteurRecherche.jsx";
import Button from "../../BoutonAction/BoutonAction.jsx";
import styles from "./ExerciseResults.module.css";
import { idOf } from "../Shared/idOf.js";
import { sameIds, mergeById } from "../Shared/selectionUtils";

export default function ExerciseResults({ typeId, equipIds = [], muscleIds = [], onChange, onResultsChange, onSearch, initialSelected }) {
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

  const filterKey = useMemo(() => {
    const eq = Array.isArray(equipIds) ? [...equipIds].slice().sort() : [];
    const mu = Array.isArray(muscleIds) ? [...muscleIds].slice().sort() : [];
    return JSON.stringify({ typeId: typeId || null, equip: eq, muscle: mu });
  }, [typeId, equipIds, muscleIds]);

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
  }, [results]);

  useEffect(() => {
    if (Array.isArray(results) && results.length > 0) {
      try { localStorage.setItem("dynamiLastResults", JSON.stringify(results)); } catch {}
    }
  }, [results]);

  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    setDismissed(new Set());
    setHasTouched(false);

    if (Array.isArray(results) && results.length > 0) {
      setOrdered(results.slice());
    } else {
      setOrdered([]);
    }
  }, [filterKey, results]);

  useEffect(() => {
    if (Array.isArray(results) && results.length > 0 && Array.isArray(ordered) && ordered.length === 0) {
      setOrdered(results.slice());
    }
  }, [results, ordered, hasTouched]);

  useEffect(() => {
    if (!Array.isArray(results)) return;

    if (results.length === 0) {
      setOrdered((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        return [];
      });
      setDismissed((prev) => {
        if (!(prev instanceof Set) || prev.size === 0) return prev;
        return new Set();
      });
      return;
    }

    const allowedIds = new Set(results.map((ex) => idOf(ex)));

    setOrdered((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const filtered = prev.filter((item) => allowedIds.has(idOf(item)));
      const next = filtered.length ? filtered : results.slice();
      if (sameIds(prev, next)) return prev;
      return next;
    });

    setDismissed((prev) => {
      if (!(prev instanceof Set) || prev.size === 0) return prev;
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (allowedIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [results]);

  const proposed = useMemo(() => {
    if (!results.length) return [];
    const chosenKeys = new Set(ordered.map((x) => idOf(x)));
    return results.filter((ex) => {
      const k = idOf(ex);
      return !chosenKeys.has(k) && !dismissed.has(k);
    });
  }, [results, ordered, dismissed]);

  const combined = useMemo(() => {
    return [...ordered, ...proposed];
  }, [ordered, proposed]);

  useEffect(() => {
    if (Array.isArray(ordered) && ordered.length > 0) {
      broadcastSelection(ordered);
    }
  }, [ordered]);

  useEffect(() => {
    if (!initialSelected) return;
    const next = Array.isArray(initialSelected) ? initialSelected : [];
    setHasTouched(true);
    setOrdered((prev) => {
      const merged = mergeById(prev, next);
      if (sameIds(prev, merged)) return prev;
      broadcastSelection(merged);
      return merged;
    });
  }, [initialSelected]);

  useEffect(() => {
    function handleReplace(e) {
      const items = Array.isArray(e?.detail?.items) ? e.detail.items : [];
      if (!items || items.length === 0) return;
      setHasTouched(true);
      setDismissed(new Set());
      setOrdered((prev) => {
        const merged = mergeById(prev, items);
        if (sameIds(prev, merged)) return prev;
        broadcastSelection(merged);
        return merged;
      });
    }
    window.addEventListener('dynami:selected:replace', handleReplace);
    return () => window.removeEventListener('dynami:selected:replace', handleReplace);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("dynamiDismissed", JSON.stringify(Array.from(dismissed))); } catch {}
  }, [dismissed]);

  function broadcastSelection(next) {
    try {
      const str = JSON.stringify(next);
      localStorage.setItem("dynamiSelected", str);
      localStorage.setItem("formSelectedExercises", str);
      localStorage.setItem("dynamiHasTouched", "1");
    } catch {}
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("dynami:selected:update", { detail: { items: next } }));
      } catch {}
      try {
        if (onResultsChange) onResultsChange(next);
        else if (onChange) onChange(next);
      } catch {}
    }, 0);
  }

  function onDragStartItem(e, exo) {
    setDragKey(idOf(exo));
  }
  function onDragOverItem(e, exo) {
    e.preventDefault();
  }
  function onDropItem(e, exo) {
    setHasTouched(true);
    const fromKey = dragKey;
    const toKey = idOf(exo);
    if (!fromKey || fromKey === toKey) return;
    setOrdered((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((x) => idOf(x) === fromKey);
      const to = arr.findIndex((x) => idOf(x) === toKey);
      if (from === -1 || to === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      broadcastSelection(arr);
      return arr;
    });
    setDragKey(null);
  }
  function onRemoveItem(exOrId) {
    setHasTouched(true);
    const id = idOf(exOrId);
    setOrdered((prev) => {
      const arr = prev.filter((x) => idOf(x) !== id);
      broadcastSelection(arr);
      return arr;
    });
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }
  function onDismissItem(exOrId) {
    const k = idOf(exOrId);
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

  if (loading) return <p>Chargement des exercices…</p>;
  if (error) return <p className={styles.error}>Erreur: {error}</p>;
  if (!results.length) return (
    <div className={styles.noResults}>
      <p>Aucun exercice trouvé… pour l’instant ! On travaille en salle pour ajouter plus d’exos. Tu peux aussi élargir tes filtres.</p>
      {onSearch && (
        <Button type="button" onClick={() => onSearch(ordered)} aria-label="Ajouter des exercices">
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
          <Button className={styles.BtnAjout} type="button" onClick={() => onSearch(ordered)} aria-label="Ajouter d'autres exercices">
            + Ajouter d'autres exercices
          </Button>
        </div>
      )}

      <div className={styles.list}>
        {combined.length === 0 ? (
          <p className={styles.empty}>Aucun exercice sélectionné pour l’instant.</p>
        ) : (
          combined.map((exo) => {
            const key = idOf(exo);
            const isSelected = ordered.some((x) => idOf(x) === key);
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
                    if (prev.some((x) => idOf(x) === key)) return prev;
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
