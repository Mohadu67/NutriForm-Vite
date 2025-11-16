import { memo, useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { mergeById } from "../Shared/selectionUtils";
import CardChoice, { TYPE_CARDS, EQUIP_CARDS } from "./CardChoice/CardChoice.jsx";
import { useStepSubtitle, buildFunnyMessage } from "../subtitlePools";
import ExerciseResults from "../ExerciceResults/ExerciseResults.jsx";
import HIITPresets from "../ExerciceSuivie/ExerciceCard/HIITTimer/HIITPresets";
import styles from "./DynamiChoice.module.css";

// ========================================
// CONSTANTS
// ========================================

const MUSCLE_CARDS = Object.freeze([
  { id: "pectoraux", icon: "💥", label: "Pectoraux" },
  { id: "dos", icon: "🕸️", label: "Dos" },
  { id: "epaules", icon: "🏹", label: "Épaules" },
  { id: "bras", icon: "💪", label: "Bras" },
  { id: "jambes", icon: "🦵", label: "Jambes" },
  { id: "core", icon: "🎛️", label: "Core" },
]);

const SPECIAL_TYPES = Object.freeze(["natation", "yoga", "hiit"]);
const ALL_MUSCLE_IDS = Object.freeze(MUSCLE_CARDS.map(c => c.id));

// ========================================
// HELPERS
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

function isSpecialType(typeId) {
  return SPECIAL_TYPES.includes(typeId);
}

// ========================================
// MAIN COMPONENT
// ========================================

function DynamiChoice({ onComplete = () => {}, onStepChange, requestedStep, onSearch }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const didInitFromSelections = useRef(false);

  // State
  const [step, setStep] = useState(() => loadFromStorage("dynamiStep", 0));
  const [typeId, setTypeId] = useState(() => loadFromStorage("dynamiType"));
  const [equipIds, setEquipIds] = useState(() => loadFromStorage("dynamiEquip", []));
  const [muscleIds, setMuscleIds] = useState(() => loadFromStorage("dynamiMuscle", []));
  const [funnyMessage, setFunnyMessage] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState(() =>
    loadFromStorage("dynamiSelected", [])
  );
  const [showHIITModal, setShowHIITModal] = useState(false);

  // Memoized values
  const safeStep = useMemo(() => Math.max(0, Math.min(3, step)), [step]);

  const headings = useMemo(() => [
    { title: "Choisis ton entraînement" },
    { title: "Choisis ton équipement" },
    { title: "Choisis le muscle ciblé" },
    { title: "Exercices proposés" },
  ], []);

  const subtitle = useStepSubtitle(safeStep);

  const allowedEquipIds = useMemo(() => {
    if (!typeId) return EQUIP_CARDS.map(c => c.id);
    if (isSpecialType(typeId) || typeId === "etirement") {
      return ["poids-du-corps"];
    }
    return EQUIP_CARDS.map(c => c.id);
  }, [typeId]);

  const disabledEquipIds = useMemo(() =>
    EQUIP_CARDS.map(c => c.id).filter(id => !allowedEquipIds.includes(id)),
    [allowedEquipIds]
  );

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(typeId);
    if (step === 1) return Array.isArray(equipIds) && equipIds.length > 0;
    if (step === 2) return Array.isArray(muscleIds) && muscleIds.length > 0;
    return false;
  }, [step, typeId, equipIds, muscleIds]);

  // Persist to localStorage
  useEffect(() => saveToStorage("dynamiStep", step), [step]);
  useEffect(() => saveToStorage("dynamiType", typeId), [typeId]);
  useEffect(() => saveToStorage("dynamiEquip", equipIds), [equipIds]);
  useEffect(() => saveToStorage("dynamiMuscle", muscleIds), [muscleIds]);
  useEffect(() => saveToStorage("dynamiSelected", selectedExercises), [selectedExercises]);

  // Notify parent of step changes & scroll to top
  useEffect(() => {
    if (typeof onStepChange === "function") {
      onStepChange(step);
    }

    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step, onStepChange]);

  // Initialize step from saved selections
  useEffect(() => {
    if (didInitFromSelections.current) return;

    const derived = typeId
      ? (equipIds.length > 0
        ? (muscleIds.length > 0 ? 3 : 2)
        : 1)
      : 0;

    if (derived > step) {
      setStep(derived);
    }

    didInitFromSelections.current = true;
  }, [typeId, equipIds, muscleIds, step]);

  // Handle external step requests
  useEffect(() => {
    if (typeof requestedStep === "number") {
      setStep(prev => Math.max(prev, requestedStep));
    }
  }, [requestedStep]);

  // Auto-configure for special types
  useEffect(() => {
    if (!typeId) return;

    if (isSpecialType(typeId)) {
      setEquipIds(["poids-du-corps"]);
      setMuscleIds(ALL_MUSCLE_IDS);
    }
  }, [typeId]);

  // Filter equipment when allowed list changes
  useEffect(() => {
    setEquipIds(prev => prev.filter(id => allowedEquipIds.includes(id)));
  }, [allowedEquipIds]);

  // Handlers
  const handleEquipChange = useCallback((nextIds) => {
    const nextArr = Array.isArray(nextIds) ? nextIds : [nextIds];
    const safe = nextArr.filter(id => allowedEquipIds.includes(id));
    const invalid = nextArr.find(id => !allowedEquipIds.includes(id));

    if (invalid) {
      setFunnyMessage(buildFunnyMessage(typeId, invalid, EQUIP_CARDS));
      setTimeout(() => setFunnyMessage(null), 3000);
    }

    setEquipIds(safe);
  }, [allowedEquipIds, typeId]);

  const handleResultsChange = useCallback((next) => {
    setSelectedExercises(Array.isArray(next) ? next : []);
  }, []);

  const openSearch = useCallback((currentSelection) => {
    if (!onSearch) return;

    const arr = Array.isArray(currentSelection)
      ? currentSelection
      : Array.isArray(selectedExercises)
      ? selectedExercises
      : [];

    // Save selections
    const str = JSON.stringify(arr);
    saveToStorage("dynamiSelected", str);
    saveToStorage("formSelectedExercises", str);
    saveToStorage("dynamiHasTouched", "1");

    setSelectedExercises(arr);

    onSearch(arr, (next, options = {}) => {
      const mode = options.mode || 'replace';
      setSelectedExercises(prev => {
        const nextArr = Array.isArray(next) ? next : [];
        const merged = mode === 'merge' ? mergeById(prev, nextArr) : nextArr;

        const mergedStr = JSON.stringify(merged);
        saveToStorage("dynamiSelected", mergedStr);
        saveToStorage("formSelectedExercises", mergedStr);
        saveToStorage("dynamiHasTouched", "1");

        window.dispatchEvent(new CustomEvent('dynami:selected:replace', {
          detail: { items: merged }
        }));

        return merged;
      });
    });
  }, [onSearch, selectedExercises]);

  const handleHIITPresetSelect = useCallback((config) => {
    // Créer un exercice HIIT virtuel avec le preset sélectionné
    const hiitExercise = {
      id: 'hiit-session',
      _id: 'hiit-session',
      name: `HIIT - ${config.name}`,
      type: ['hiit'],
      category: 'hiit',
      equipment: ['poids-du-corps'],
      mode: 'hiit',
      data: {
        hiit: {
          config,
          rounds: [],
          totalRounds: config.rounds,
          completedRounds: 0,
        }
      }
    };

    setShowHIITModal(false);

    // Sauvegarder et compléter avec l'exercice HIIT
    const exercises = [hiitExercise];
    saveToStorage("dynamiSelected", exercises);
    saveToStorage("formSelectedExercises", exercises);
    saveToStorage("dynamiHasTouched", "1");

    onComplete({ typeId: 'hiit', equipIds: ['poids-du-corps'], muscleIds: [], exercises });
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (step < 3) {
      // HIIT ouvre directement la modal de presets
      if (step === 0 && typeId === 'hiit') {
        setShowHIITModal(true);
        return;
      }

      // Special types skip equipment & muscle selection
      if (step === 0 && isSpecialType(typeId)) {
        setStep(3);
      } else {
        setStep(step + 1);
      }
    } else {
      // Final step - complete flow
      const arr = loadFromStorage("dynamiSelected", selectedExercises);
      onComplete({ typeId, equipIds, muscleIds, exercises: arr });
    }
  }, [step, typeId, equipIds, muscleIds, selectedExercises, onComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      // Special types skip back to type selection
      if (step === 3 && isSpecialType(typeId)) {
        setStep(0);
      } else {
        setStep(step - 1);
      }
    }
  }, [step, typeId]);

  // Render appropriate card selection based on step
  const renderCards = useCallback(() => {
    switch (step) {
      case 0:
        return (
          <CardChoice
            value={typeId}
            onChange={setTypeId}
            cards={TYPE_CARDS}
            multiple={false}
          />
        );
      case 1:
        return (
          <CardChoice
            value={equipIds}
            onChange={handleEquipChange}
            cards={EQUIP_CARDS}
            multiple
            disabledIds={disabledEquipIds}
          />
        );
      case 2:
        return (
          <CardChoice
            value={muscleIds}
            onChange={setMuscleIds}
            cards={MUSCLE_CARDS}
            multiple
          />
        );
      case 3:
        return (
          <ExerciseResults
            typeId={typeId}
            equipIds={equipIds}
            muscleIds={muscleIds}
            onResultsChange={handleResultsChange}
            onSearch={onSearch ? openSearch : undefined}
            initialSelected={selectedExercises}
          />
        );
      default:
        return null;
    }
  }, [
    step,
    typeId,
    equipIds,
    muscleIds,
    selectedExercises,
    handleEquipChange,
    disabledEquipIds,
    handleResultsChange,
    openSearch,
    onSearch
  ]);

  return (
    <>
      <section className={styles.container} ref={containerRef} aria-label="Sélection d'exercices">
        <header className={styles.header}>
          <h2 className={styles.title}>{headings[safeStep].title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>

        {funnyMessage && (
          <div
            className={`${styles.funny} ${styles.funnyMessage}`}
            role="alert"
            aria-live="polite"
          >
            {funnyMessage}
          </div>
        )}

        <div className={styles.content}>
          {renderCards()}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.prevBtn}
            onClick={handlePrev}
            disabled={step === 0}
            aria-label={t('exercice.previous')}
          >
            {t('exercice.previous')}
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={step < 3 && !canNext}
            aria-label={
              step === 0 && typeId === 'hiit'
                ? 'Choisir programme HIIT'
                : step < 3
                ? t('exercice.next')
                : t('exercice.letsgo')
            }
          >
            {step === 0 && typeId === 'hiit'
              ? 'Choisir programme'
              : step < 3
              ? t('exercice.next')
              : t('exercice.letsgo')}
          </button>
        </footer>
      </section>

      {/* HIIT Presets Modal */}
      {showHIITModal && (
        <HIITPresets
          onSelect={handleHIITPresetSelect}
          onClose={() => setShowHIITModal(false)}
        />
      )}
    </>
  );
}

export default memo(DynamiChoice);
