import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  const listRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    // Toujours réinitialiser avec les nouveaux résultats quand les filtres changent
    setOrdered(Array.isArray(results) && results.length > 0 ? results.slice() : []);
  }, [filterKey, results]);

  useEffect(() => {
    if (Array.isArray(results) && results.length > 0 && Array.isArray(ordered) && ordered.length === 0 && !hasTouched) {
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
      if (sameIds(prev, filtered)) return prev;
      return filtered;
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

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) return;

    setHasTouched(true);
    setOrdered((items) => {
      const oldIndex = items.findIndex((item) => idOf(item) === active.id);
      const newIndex = items.findIndex((item) => idOf(item) === over.id);

      if (oldIndex === -1 || newIndex === -1) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  useEffect(() => {
    if (!Array.isArray(ordered)) return;
    broadcastSelection(ordered);
  }, [ordered]);

  useEffect(() => {
    if (!initialSelected) return;
    const incoming = Array.isArray(initialSelected) ? initialSelected : [];
    const allowed = Array.isArray(results) && results.length ? new Set(results.map((ex) => idOf(ex))) : null;

    if (incoming.length) setHasTouched(true);

    setOrdered((prev) => {
      let working = Array.isArray(prev) ? prev : [];
      if (allowed) {
        const filteredPrev = working.filter((item) => allowed.has(idOf(item)));
        if (!sameIds(working, filteredPrev)) {
          working = filteredPrev;
        }
      }

      // Ne fusionner que si initialSelected contient des exercices valides pour les filtres actuels
      if (!incoming.length) {
        return working;
      }

      const validIncoming = incoming.filter((item) => !allowed || allowed.has(idOf(item)));
      if (!validIncoming.length) {
        return working;
      }

      const merged = mergeById(working, validIncoming);
      if (sameIds(working, merged)) return working;
      return merged;
    });
  }, [initialSelected, results]);

  useEffect(() => {
    function handleReplace(e) {
      const items = Array.isArray(e?.detail?.items) ? e.detail.items : [];
      if (!items || items.length === 0) return;
      setHasTouched(true);
      setDismissed(new Set());
      setOrdered((prev) => {
        const merged = mergeById(prev, items);
        if (sameIds(prev, merged)) return prev;
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
    const arr = Array.isArray(next) ? next : [];
    try {
      const str = JSON.stringify(arr);
      if (arr.length > 0) {
        localStorage.setItem("dynamiSelected", str);
        localStorage.setItem("formSelectedExercises", str);
      } else {
        localStorage.removeItem("dynamiSelected");
        localStorage.setItem("formSelectedExercises", "[]");
      }
      localStorage.setItem("dynamiHasTouched", arr.length > 0 ? "1" : "0");
    } catch {}
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("dynami:selected:update", { detail: { items: arr } }));
      } catch {}
      try {
        if (onResultsChange) onResultsChange(arr);
        else if (onChange) onChange(arr);
      } catch {}
    }, 0);
  }

  function onRemoveItem(exOrId) {
    setHasTouched(true);
    const id = idOf(exOrId);
    setOrdered((prev) => prev.filter((x) => idOf(x) !== id));
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
      setOrdered(results.slice());
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.list} ref={listRef}>
          {combined.length === 0 ? (
            <p className={styles.empty}>Aucun exercice sélectionné pour l'instant.</p>
          ) : (
            <>
              <SortableContext
                items={ordered.map((exo) => idOf(exo))}
                strategy={verticalListSortingStrategy}
              >
                {ordered.map((exo) => {
                  const key = idOf(exo);
                  return (
                    <ExerciceCard
                      key={key}
                      exo={exo}
                      isSortable={true}
                      onRemove={onRemoveItem}
                    />
                  );
                })}
              </SortableContext>

              {proposed.map((exo) => {
                const key = idOf(exo);
                return (
                  <ExerciceCard
                    key={key}
                    exo={exo}
                    isSortable={false}
                    onRemove={onDismissItem}
                    onAdd={() => {
                      setHasTouched(true);
                      setOrdered((prev) => {
                        if (prev.some((x) => idOf(x) === key)) return prev;
                        return [...prev, exo];
                      });
                    }}
                    isAdded={false}
                  />
                );
              })}
            </>
          )}
        </div>
      </DndContext>
    </div>
  );
}
