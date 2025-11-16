import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { loadExercises } from "../../../utils/exercisesLoader.js";

// ========================================
// LOCAL STORAGE HELPERS
// ========================================

function loadFromStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

// ========================================
// MAIN COMPONENT
// ========================================

function ExerciseResults({ typeId, equipIds = [], muscleIds = [], onChange, onResultsChange, onSearch, initialSelected }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ordered, setOrdered] = useState(() => loadFromStorage("dynamiSelected", []));
  const [dismissed, setDismissed] = useState(() => {
    const arr = loadFromStorage("dynamiDismissed", []);
    return new Set(arr);
  });
  const [hasTouched, setHasTouched] = useState(() => loadFromStorage("dynamiHasTouched") === "1");
  const [showProposed, setShowProposed] = useState(false);
  const listRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
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
  }, [ordered.length]);

  useEffect(() => {
    saveToStorage("dynamiHasTouched", hasTouched ? "1" : "0");
  }, [hasTouched]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loadExercises('all')
      .then((exercises) => {
        if (!isMounted) return;
        setData(exercises);
        setLoading(false);
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(e.message || "Erreur de chargement");
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
      saveToStorage("dynamiLastResults", results);
    }
  }, [results]);

  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;

    // Ne réinitialiser que si l'utilisateur n'a pas touché à la sélection
    if (hasTouched) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    prevFilterKeyRef.current = filterKey;
    setDismissed(new Set());
    setHasTouched(false);
    setOrdered(Array.isArray(results) && results.length > 0 ? results.slice() : []);
  }, [filterKey, results, hasTouched]);

  useEffect(() => {
    if (Array.isArray(results) && results.length > 0 && Array.isArray(ordered) && ordered.length === 0 && !hasTouched) {
      setOrdered(results.slice());
    }
  }, [results, ordered, hasTouched]);


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

    if (incoming.length) setHasTouched(true);

    setOrdered((prev) => {
      const working = Array.isArray(prev) ? prev : [];
      if (!incoming.length) return working;
      const validIncoming = incoming;

      const merged = mergeById(working, validIncoming);
      if (sameIds(working, merged)) return working;
      return merged;
    });
  }, [initialSelected]);

  useEffect(() => {
    function handleReplace(e) {
      const items = Array.isArray(e?.detail?.items) ? e.detail.items : [];
      if (!items || items.length === 0) return;

      setHasTouched(true);
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
    saveToStorage("dynamiDismissed", Array.from(dismissed));
  }, [dismissed]);

  const broadcastSelection = useCallback((next) => {
    const arr = Array.isArray(next) ? next : [];

    if (arr.length > 0) {
      saveToStorage("dynamiSelected", arr);
      saveToStorage("formSelectedExercises", arr);
    } else {
      removeFromStorage("dynamiSelected");
      saveToStorage("formSelectedExercises", []);
    }
    saveToStorage("dynamiHasTouched", arr.length > 0 ? "1" : "0");

    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("dynami:selected:update", { detail: { items: arr } }));
      } catch {
        // Silently fail
      }

      try {
        if (onResultsChange) onResultsChange(arr);
        else if (onChange) onChange(arr);
      } catch {
        // Silently fail
      }
    }, 0);
  }, [onResultsChange, onChange]);

  const onRemoveItem = useCallback((exOrId) => {
    setHasTouched(true);
    const id = idOf(exOrId);
    setOrdered((prev) => prev.filter((x) => idOf(x) !== id));
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const onDismissItem = useCallback((exOrId) => {
    const k = idOf(exOrId);
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

  const handleResetSuggestions = useCallback(() => {
    setHasTouched(true);
    setDismissed(new Set());
    if (Array.isArray(results) && results.length > 0) {
      setOrdered(results.slice());
    }
  }, [results]);

  const handleAddExercise = useCallback((exo, key) => {
    setHasTouched(true);
    setOrdered((prev) => {
      if (prev.some((x) => idOf(x) === key)) return prev;
      return [...prev, exo];
    });
  }, []);

  if (loading) {
    return <p className={styles.loadingText} role="status">Chargement des exercices…</p>;
  }

  if (error) {
    return <p className={styles.error} role="alert">Erreur: {error}</p>;
  }

  if (!results.length) {
    return (
      <div className={styles.noResults}>
        <p>Aucun exercice trouvé… pour l'instant ! On travaille en salle pour ajouter plus d'exos. Tu peux aussi élargir tes filtres.</p>
        {onSearch && (
          <Button type="button" onClick={() => onSearch(ordered)} aria-label="Ajouter des exercices">
            + Ajouter d'autres exercices
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {onSearch && (
        <div className={styles.actions}>
          {dismissed.size > 0 && (
            <button
              type="button"
              onClick={handleResetSuggestions}
              className={styles.resetBtn}
              aria-label="Réinitialiser les suggestions"
            >
              Réinitialiser les suggestions
            </button>
          )}
          <Button
            className={styles.BtnAjout}
            type="button"
            onClick={() => onSearch(ordered)}
            aria-label="Ajouter d'autres exercices"
          >
            + Ajouter d'autres exercices
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.list} ref={listRef} role="list">
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

              {ordered.length > 0 && proposed.length > 0 && !showProposed && (
                <div className={styles.buttonWrapper}>
                  <Button
                    type="button"
                    onClick={() => setShowProposed(true)}
                    className={styles.showProposedBtn}
                    aria-label={`Voir ${proposed.length} exercices supplémentaires`}
                  >
                    Voir d'autres exercices ({proposed.length})
                  </Button>
                </div>
              )}

              {showProposed && proposed.map((exo) => {
                const key = idOf(exo);
                return (
                  <ExerciceCard
                    key={key}
                    exo={exo}
                    isSortable={false}
                    onRemove={onDismissItem}
                    onAdd={() => handleAddExercise(exo, key)}
                    isAdded={false}
                  />
                );
              })}

              {showProposed && proposed.length > 0 && (
                <div className={styles.buttonWrapper}>
                  <Button
                    type="button"
                    onClick={() => setShowProposed(false)}
                    className={styles.hideProposedBtn}
                    aria-label="Masquer les suggestions"
                  >
                    Masquer les suggestions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DndContext>
    </div>
  );
}

export default memo(ExerciseResults);
