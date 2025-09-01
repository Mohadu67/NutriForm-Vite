import { useMemo, useState, useEffect } from "react";
import CardChoice, { TYPE_CARDS, EQUIP_CARDS, MUSCLE_CARDS } from "./CardChoice";
import { useStepSubtitle, buildFunnyMessage } from "./subtitlePools";
import ExerciseResults from "./ExerciseResults";
import styles from "./DynamiChoice.module.css";

export default function DynamiChoice({ onComplete = () => {}, onStepChange, requestedStep }) {
  const [step, setStep] = useState(0);
  const [typeId, setTypeId] = useState(null);
  const [equipIds, setEquipIds] = useState([]);
  const [muscleIds, setMuscleIds] = useState([]);
  const [funnyMessage, setFunnyMessage] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);

  useEffect(() => {
    if (typeof onStepChange === "function") onStepChange(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (typeof requestedStep !== "number") return;
    setStep((prev) => (requestedStep < prev ? requestedStep : prev));
  }, [requestedStep]);

  const headings = useMemo(() => [
    { title: "Choisis ton entraînement" },
    { title: "Choisis ton équipement" },
    { title: "Choisis le muscle ciblé" },
    { title: "Exercices proposés" },
  ], []);

  const subtitle = useStepSubtitle(step);

  const allowedEquipIds = useMemo(() => {
    if (!typeId) return EQUIP_CARDS.map((c) => c.id);
    if (["yoga", "meditation"].includes(typeId)) return ["poids-du-corps"];
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

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(typeId);
    if (step === 1) return Array.isArray(equipIds) && equipIds.length > 0;
    if (step === 2) return Array.isArray(muscleIds) && muscleIds.length > 0;
    return false;
  }, [step, typeId, equipIds, muscleIds]);

  function onNext() {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ typeId, equipIds, muscleIds, exercises: selectedExercises });
    }
  }

  function onPrev() {
    if (step > 0) setStep(step - 1);
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
          onResultsChange={setSelectedExercises}
        />
      );
    }
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>{headings[step].title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div className={styles.body}>{renderCards()}</div>

      {funnyMessage && <p className={`${styles.funny} ${styles.funnyMessage}`}>{funnyMessage}</p>}

      <div className={styles.footer}>
        <button type="button" className={styles.prevBtn} onClick={onPrev} disabled={step === 0}>
          Précédent
        </button>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={onNext}
          disabled={step < 3 ? !canNext : false}
        >
          {step < 3 ? "Suivant" : "Lets go !"}
        </button>
      </div>
    </section>
  );
}