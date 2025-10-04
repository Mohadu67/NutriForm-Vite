import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { mergeById } from "../Shared/selectionUtils";
import CardChoice, { TYPE_CARDS, EQUIP_CARDS } from "./CardChoice/CardChoice.jsx";
import { useStepSubtitle, buildFunnyMessage } from "../subtitlePools";
import ExerciseResults from "../ExerciceResults/ExerciseResults.jsx";
import styles from "./DynamiChoice.module.css";

const MUSCLE_CARDS = [
  { id: "pectoraux", icon: "💥", label: "Pectoraux" },
  { id: "dos", icon: "🕸️", label: "Dos" },
  { id: "epaules", icon: "🏹", label: "Épaules" },
  { id: "bras", icon: "💪", label: "Bras" },
  { id: "jambes", icon: "🦵", label: "Jambes" },
  { id: "core", icon: "🎛️", label: "Core" },
];

export default function DynamiChoice({ onComplete = () => {}, onStepChange, requestedStep, onSearch }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiStep");
      return v !== null ? parseInt(v, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [typeId, setTypeId] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiType");
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });
  const [equipIds, setEquipIds] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiEquip");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [muscleIds, setMuscleIds] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiMuscle");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const [funnyMessage, setFunnyMessage] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState(() => {
    try {
      const v = localStorage.getItem("dynamiSelected");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  const didInitFromSelections = useRef(false);

  useEffect(() => {
    if (typeof onStepChange === "function") onStepChange(step);
  }, [step, onStepChange]);

  useEffect(() => {
    try { localStorage.setItem("dynamiStep", String(step)); } catch {}
  }, [step]);

  useEffect(() => {
    try { localStorage.setItem("dynamiType", JSON.stringify(typeId)); } catch {}
  }, [typeId]);

  useEffect(() => {
    try { localStorage.setItem("dynamiEquip", JSON.stringify(equipIds)); } catch {}
  }, [equipIds]);

  useEffect(() => {
    try { localStorage.setItem("dynamiMuscle", JSON.stringify(muscleIds)); } catch {}
  }, [muscleIds]);

  useEffect(() => {
    try { localStorage.setItem("dynamiSelected", JSON.stringify(selectedExercises)); } catch {}
  }, [selectedExercises]);

  useEffect(() => {
    if (didInitFromSelections.current) return;
    const derived = typeId ? (Array.isArray(equipIds) && equipIds.length > 0
      ? (Array.isArray(muscleIds) && muscleIds.length > 0 ? 3 : 2)
      : 1) : 0;
    if (derived > step) setStep(derived);
    didInitFromSelections.current = true;
  }, [typeId, equipIds, muscleIds, step]);

  useEffect(() => {
    if (typeof requestedStep !== "number") return;
    setStep(prev => (requestedStep > prev ? requestedStep : prev));
  }, [requestedStep]);

  const headings = useMemo(() => [
    { title: "Choisis ton entraînement" },
    { title: "Choisis ton équipement" },
    { title: "Choisis le muscle ciblé" },
    { title: "Exercices proposés" },
  ], []);

  const safeStep = Math.max(0, Math.min(3, step));

  const subtitle = useStepSubtitle(safeStep);

  const allowedEquipIds = useMemo(() => {
    if (!typeId) return EQUIP_CARDS.map((c) => c.id);
    if (["natation", "meditation"].includes(typeId)) return ["poids-du-corps"];
    if (typeId === "etirement") return ["poids-du-corps"];
    return EQUIP_CARDS.map((c) => c.id);
  }, [typeId]);

  const filteredEquipCards = useMemo(
    () => EQUIP_CARDS.filter((c) => allowedEquipIds.includes(c.id)),
    [allowedEquipIds]
  );

  const disabledEquipIds = useMemo(
    () => EQUIP_CARDS.map(c => c.id).filter((id) => !allowedEquipIds.includes(id)),
    [allowedEquipIds]
  );

  const handleEquipChange = (nextIds) => {
    const nextArr = Array.isArray(nextIds) ? nextIds : [nextIds];
    const safe = nextArr.filter((id) => allowedEquipIds.includes(id));
    const invalid = nextArr.find((id) => !allowedEquipIds.includes(id));
    if (invalid) {
      setFunnyMessage(buildFunnyMessage(typeId, invalid, EQUIP_CARDS));
      setTimeout(() => setFunnyMessage(null), 3000);
    }
    setEquipIds(safe);
  };

  useEffect(() => {
    setEquipIds((prev) => prev.filter((id) => allowedEquipIds.includes(id)));
  }, [allowedEquipIds]);

  // Auto-sélection pour natation et méditation
  useEffect(() => {
    if (!typeId) return;

    // Natation : auto-sélection équipement + tous les muscles
    if (typeId === "natation") {
      setEquipIds(["poids-du-corps"]);
      setMuscleIds(MUSCLE_CARDS.map(c => c.id));
    }

    // Méditation : auto-sélection équipement sans muscles
    if (typeId === "meditation") {
      setEquipIds(["poids-du-corps"]);
      setMuscleIds([]);
    }
  }, [typeId]);

  const handleResultsChange = useCallback((next) => {
    Promise.resolve().then(() => {
      setSelectedExercises(Array.isArray(next) ? next : []);
    });
  }, []);

  const openSearch = useCallback((currentSelection) => {
    if (!onSearch) return;
    const arr = Array.isArray(currentSelection) ? currentSelection : (Array.isArray(selectedExercises) ? selectedExercises : []);
    try {
      const str = JSON.stringify(arr);
      localStorage.setItem("dynamiSelected", str);
      localStorage.setItem("formSelectedExercises", str);
      localStorage.setItem("dynamiHasTouched", "1");
    } catch {}
    setSelectedExercises(arr);

    onSearch(arr, (next, options = {}) => {
      const mode = options.mode || 'replace';
      setSelectedExercises((prev) => {
        const nextArr = Array.isArray(next) ? next : [];
        const merged = mode === 'merge' ? mergeById(prev, nextArr) : nextArr;
        try {
          const s = JSON.stringify(merged);
          localStorage.setItem("dynamiSelected", s);
          localStorage.setItem("formSelectedExercises", s);
          localStorage.setItem("dynamiHasTouched", "1");
        } catch {}
        return merged;
      });
    });
  }, [onSearch, selectedExercises]);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(typeId);
    if (step === 1) return Array.isArray(equipIds) && equipIds.length > 0;
    if (step === 2) return Array.isArray(muscleIds) && muscleIds.length > 0;
    return false;
  }, [step, typeId, equipIds, muscleIds]);

  function onNext() {
    if (step < 3) {
      // Si on est à l'étape 0 et que c'est natation ou méditation, sauter directement à l'étape 3
      if (step === 0 && (typeId === "natation" || typeId === "meditation")) {
        setStep(3);
      } else {
        setStep(step + 1);
      }
    } else {
      let arr = Array.isArray(selectedExercises) ? selectedExercises : [];
      try {
        const v = localStorage.getItem("dynamiSelected");
        const fromLS = v ? JSON.parse(v) : [];
        if (Array.isArray(fromLS) && fromLS.length) arr = fromLS;
      } catch {}
      onComplete({ typeId, equipIds, muscleIds, exercises: arr });
    }
  }

  function onPrev() {
    if (step > 0) {
      // Si on est à l'étape 3 et que c'est natation ou méditation, revenir directement à l'étape 0
      if (step === 3 && (typeId === "natation" || typeId === "meditation")) {
        setStep(0);
      } else {
        setStep(step - 1);
      }
    }
  }

  function renderCards() {
    if (step === 0) {
      return <CardChoice value={typeId} onChange={setTypeId} cards={TYPE_CARDS} multiple={false} />;
    }
    if (step === 1) {
      return (
        <CardChoice
          value={equipIds}
          onChange={handleEquipChange}
          cards={EQUIP_CARDS}
          multiple
          disabledIds={disabledEquipIds}
        />
      );
    }
    if (step === 2) {
      return <CardChoice value={muscleIds} onChange={setMuscleIds} cards={MUSCLE_CARDS} multiple />;
    }
    if (step === 3) {
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
    }
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>{headings[safeStep].title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {funnyMessage && <p className={`${styles.funny} ${styles.funnyMessage}`}>{funnyMessage}</p>}

      <div className={styles.content}>
        {renderCards()}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.prevBtn} onClick={onPrev} disabled={step === 0}>
          {t('exercice.previous')}
        </button>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={onNext}
          disabled={step < 3 ? !canNext : false}
        >
          {step < 3 ? t('exercice.next') : t('exercice.letsgo')}
        </button>
      </div>
    </section>
  );
}
