import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storage } from '../../../shared/utils/storage';
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
import logger from '../../../shared/utils/logger.js';

export default function ExerciseResults({ typeId, equipIds = [], muscleIds = [], onChange, onResultsChange, onSearch, initialSelected }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ordered, setOrdered] = useState(() => {
    try {
      const v = storage.get("dynamiSelected");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [dismissed, setDismissed] = useState(() => {
    try {
      const v = storage.get("dynamiDismissed");
      return new Set(v ? JSON.parse(v) : []);
    } catch {
      return new Set();
    }
  });
  const [hasTouched, setHasTouched] = useState(() => {
    try {
      const v = storage.get("dynamiHasTouched");
      return v === "1";
    } catch {
      return false;
    }
  });
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
  }, []);

  useEffect(() => {
    try { storage.set("dynamiHasTouched", hasTouched ? "1" : "0"); } catch (e) {
      logger.error("Failed to save dynamiHasTouched:", e);
    }
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
      try { storage.set("dynamiLastResults", JSON.stringify(results)); } catch (e) {
        logger.error("Failed to save dynamiLastResults:", e);
      }
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

  // Commenté: Ce useEffect supprimait les exercices ajoutés manuellement
  // qui ne correspondaient pas aux filtres actuels
  // useEffect(() => {
  //   if (!Array.isArray(results)) return;

  //   if (results.length === 0) {
  //     setOrdered((prev) => {
  //       if (!Array.isArray(prev) || prev.length === 0) return prev;
  //       return [];
  //     });
  //     setDismissed((prev) => {
  //       if (!(prev instanceof Set) || prev.size === 0) return prev;
  //       return new Set();
  //     });
  //     return;
  //   }

  //   const allowedIds = new Set(results.map((ex) => idOf(ex)));

  //   setOrdered((prev) => {
  //     if (!Array.isArray(prev) || prev.length === 0) return prev;
  //     const filtered = prev.filter((item) => allowedIds.has(idOf(item)));
  //     if (sameIds(prev, filtered)) return prev;
  //     return filtered;
  //   });

  //   setDismissed((prev) => {
  //     if (!(prev instanceof Set) || prev.size === 0) return prev;
  //     let changed = false;
  //     const next = new Set();
  //     prev.forEach((id) => {
  //       if (allowedIds.has(id)) next.add(id);
  //       else changed = true;
  //     });
  //     return changed ? next : prev;
  //   });
  // }, [results]);

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
      // Ne plus filtrer prev - garder tous les exercices ajoutés manuellement
      let working = Array.isArray(prev) ? prev : [];

      if (!incoming.length) {
        return working;
      }

      // Ne plus filtrer validIncoming - accepter tous les exercices
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
      // NE PAS réinitialiser dismissed - garder les exercices supprimés par l'utilisateur
      // setDismissed(new Set());
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
    try { storage.set("dynamiDismissed", JSON.stringify(Array.from(dismissed))); } catch (e) {
      logger.error("Failed to save dynamiDismissed:", e);
    }
  }, [dismissed]);

  function broadcastSelection(next) {
    const arr = Array.isArray(next) ? next : [];
    try {
      const str = JSON.stringify(arr);
      if (arr.length > 0) {
        storage.set("dynamiSelected", str);
        storage.set("formSelectedExercises", str);
      } else {
        storage.remove("dynamiSelected");
        storage.set("formSelectedExercises", "[]");
      }
      storage.set("dynamiHasTouched", arr.length > 0 ? "1" : "0");
    } catch (e) {
      logger.error("Failed to save selection to localStorage:", e);
    }
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("dynami:selected:update", { detail: { items: arr } }));
      } catch (e) {
        logger.error("Failed to dispatch dynami:selected:update:", e);
      }
      try {
        if (onResultsChange) onResultsChange(arr);
        else if (onChange) onChange(arr);
      } catch (e) {
        logger.error("Failed to call onResultsChange/onChange:", e);
      }
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

  if (loading) return <p className={styles.loadingText}>Chargement des exercices…</p>;
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

              {ordered.length > 0 && proposed.length > 0 && !showProposed && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Button
                    type="button"
                    onClick={() => setShowProposed(true)}
                    className={styles.showProposedBtn}
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

              {showProposed && proposed.length > 0 && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Button
                    type="button"
                    onClick={() => setShowProposed(false)}
                    className={styles.hideProposedBtn}
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
