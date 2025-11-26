import { useState, useEffect, useMemo } from "react";
import { storage } from '../../../shared/utils/storage';
import { useTranslation } from "react-i18next";
import styles from "./FormExo.module.css";
import DynamiChoice from "../DynamiChoice/DynamiChoice.jsx";
import Progress from "../BarreDetape/Etapes.jsx";
import Salutation from "./salutation.jsx";
import SuivieExo from "../ExerciceSuivie/SuivieExo.jsx";
import ChercherExo from "../ExerciceSuivie/MoteurRechercheUser/ChercherExo.jsx";
import SuivieSeance from "../../History/SessionTracking/SuivieSeance.jsx";
import Stat from "../../History/SessionTracking/stats/Stat.jsx";
import ConseilJour from "./ConseilJour.jsx";
import { idOf } from "../Shared/idOf.js";
import RepeatSessionModal from "../RepeatSessionModal/RepeatSessionModal.jsx";
import { secureApiCall, getCurrentUser } from "../../../utils/authService.js";
import { loadExercises } from "../../../utils/exercisesLoader.js";
import logger from '../../../shared/utils/logger.js';

export default function FormExo({ user: userProp }) {
  const user = userProp || getCurrentUser();
  const { t } = useTranslation();
  const [sessionName, setSessionName] = useState(() => {
    try { return JSON.parse(storage.get("formSessionName")) || ""; } catch { return ""; }
  });
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(storage.get("formCurrentStep"), 10) || 0; } catch { return 0; }
  });
  const [mode, setMode] = useState(() => {
    try { return storage.get("formMode") || "builder"; } catch { return "builder"; }
  });
  const [selectedExercises, setSelectedExercises] = useState(() => {
    try { return JSON.parse(storage.get("formSelectedExercises")) || []; } catch { return []; }
  });
  const [searchDraft, setSearchDraft] = useState(() => {
    try { return JSON.parse(storage.get("dynamiSelected")) || []; } catch { return []; }
  });
  const [showSummary, setShowSummary] = useState(false);
  const [lastStats, setLastStats] = useState(null);
  const [lastItems, setLastItems] = useState([]);
  const [lastSummary, setLastSummary] = useState(null);
  const [searchCb, setSearchCb] = useState(null);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [lastWeekSession, setLastWeekSession] = useState(null);
  const [hasCheckedLastWeek, setHasCheckedLastWeek] = useState(false);
  const [dynamiKey, setDynamiKey] = useState(0);
  useEffect(() => { try { storage.set("formSessionName", JSON.stringify(sessionName)); } catch (e) { logger.error("Failed to save sessionName:", e); } }, [sessionName]);
  useEffect(() => { try { storage.set("formCurrentStep", String(currentStep)); } catch (e) { logger.error("Failed to save currentStep:", e); } }, [currentStep]);
  useEffect(() => { try { storage.set("formMode", mode); } catch (e) { logger.error("Failed to save mode:", e); } }, [mode]);
  useEffect(() => { try { storage.set("formSelectedExercises", JSON.stringify(selectedExercises)); } catch (e) { logger.error("Failed to save selectedExercises:", e); } }, [selectedExercises]);
  useEffect(() => {
    const checkLastWeekSession = async () => {
      if (hasCheckedLastWeek) return;
      if (!user || !(user.id || user._id)) return;
      if (mode !== "builder" || currentStep !== 0) return;

      try {
        const response = await secureApiCall("/workouts/last-week-session");
        if (!response.ok) {
          setHasCheckedLastWeek(true);
          return;
        }

        const data = await response.json();
        if (data.session && Array.isArray(data.session.entries) && data.session.entries.length > 0) {
          setLastWeekSession(data.session);
          setShowRepeatModal(true);
        }
        setHasCheckedLastWeek(true);
      } catch (error) {
        logger.error("Erreur lors de la récupération de la séance:", error);
        setHasCheckedLastWeek(true);
      }
    };

    checkLastWeekSession();
  }, [user, mode, currentStep, hasCheckedLastWeek]);

  const defaultExerciseName = useMemo(() => t("exercise.form.defaultExerciseName"), [t]);

  const steps = useMemo(
    () => [
      {
        title: t("exercise.form.steps.training.title"),
        sub: t("exercise.form.steps.training.subtitle"),
      },
      {
        title: t("exercise.form.steps.equipment.title"),
        sub: t("exercise.form.steps.equipment.subtitle"),
      },
      {
        title: t("exercise.form.steps.muscles.title"),
        sub: t("exercise.form.steps.muscles.subtitle"),
      },
      {
        title: t("exercise.form.steps.exercises.title"),
        sub: t("exercise.form.steps.exercises.subtitle"),
      },
    ],
    [t]
  );

  function getBodyMassKg(u) {
    if (!u) return undefined;
    const candidates = [
      u.weightKg, u.poidsKg, u.poids, u.weight,
      u.profile?.weightKg, u.profile?.poids,
      u.metrics?.weightKg, u.metrics?.poids,
    ];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return undefined;
  }

  if (showSummary) {
    const lastSessionForStat = {
      name: sessionName,
      durationSec: lastStats?.durationSec || 0,
      calories: lastStats?.calories || 0,
      plannedExercises: lastSummary?.plannedExercises ?? lastStats?.totalExercises ?? undefined,
      completedExercises: lastSummary?.completedExercises ?? lastStats?.doneExercises ?? undefined,
      clientSummary: lastSummary || undefined,
      entries: Array.isArray(lastItems)
        ? lastItems.map(it => {
            const d = it?.data || {};
            const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
            const muscuSets = Array.isArray(d.sets) ? d.sets : [];
            const type = cardioSets.length > 0
              ? 'cardio'
              : (muscuSets.length > 0
                  ? (muscuSets.some(s => (s.weight ?? s.weightKg ?? '') !== '') ? 'muscu' : 'poids_du_corps')
                  : (it?.mode === 'cardio' ? 'cardio' : (it?.mode === 'muscu' ? 'muscu' : 'poids_du_corps')));
            return {
              type,
              sets: cardioSets.length ? cardioSets : muscuSets,
              notes: typeof d?.notes === 'string' ? d.notes : undefined,
              name: it?.name || it?.label || it?.exoName,
            };
          })
        : [],
    };
    return (
      <div className={styles.form}>

        <Stat
          lastSession={lastSessionForStat}
          items={lastItems}
          bodyMassKg={getBodyMassKg(user)}
        />

        <div className={styles.summaryActions}>
          <button className={styles.BtnRestart} type="button" onClick={() => {
            setMode("builder");
            setCurrentStep(0);
            setShowSummary(false);
            setSessionName("");
            setSelectedExercises([]);
            setSearchDraft([]);
            setSearchCb(null);
            setLastItems([]);
            setLastStats(null);
            setLastSummary(null);
            try {
              const KEYS = [
                "dynamiSelected",
                "dynamiHasTouched",
                "dynamiStep",
                "dynamiType",
                "dynamiEquip",
                "dynamiMuscle",
                "dynamiLastResults",
                "dynamiDismissed",
                "formSelectedExercises",
                "formCurrentStep",
                "formMode",
                "formSessionName",
                "suivieStartedAt",
                "SuivieExoDraft",
                "suivie_exo_draft",
                "DRAFT_KEY",
                "forceDynamiStart"
              ];
              KEYS.forEach(k => storage.remove(k));
            } catch (e) {
              logger.error("Failed to clear localStorage keys:", e);
            }
            try {
              const NS = "suivie_exo_inputs:";
              const toDelete = [];
              for (let i = 0; i < storage.length; i++) {
                const k = storage.key(i);
                if (k && k.startsWith(NS)) toDelete.push(k);
              }
              toDelete.forEach(k => storage.remove(k));
            } catch (e) {
              logger.error("Failed to clear suivie_exo_inputs:", e);
            }
            try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {
              logger.error("Failed to scroll:", e);
            }
          }}>
            {t("exercise.form.actions.restart")}
          </button>
          <button className={styles.BtnReturn} type="button" onClick={() => setShowSummary(false)}>
            {t("exercise.form.actions.back")}
          </button>
        </div>

        {user && (user.id || user._id) ? (
          <SuivieSeance user={user} lastSession={lastSessionForStat} />
        ) : null}
      </div>
    );
  }

  const suiviKey = (() => {
    try {
      const ids = Array.isArray(selectedExercises)
        ? selectedExercises.map(idOf).join("|")
        : "";
      return `${sessionName}|${ids}`;
    } catch {
      return `${sessionName}|len:${Array.isArray(selectedExercises) ? selectedExercises.length : 0}`;
    }
  })();

  const handleAcceptRepeat = async () => {
    if (!lastWeekSession || !Array.isArray(lastWeekSession.entries)) return;

    try {
      // Charger tous les exercices disponibles depuis les JSONs
      const allExercises = await loadExercises('all');

      // Créer une map par ID pour matching rapide
      const byId = new Map();
      allExercises.forEach(ex => {
        if (ex.id) {
          byId.set(ex.id, ex);
        }
      });

      // Convertir les entries en exercices complets depuis le JSON
      const exercises = lastWeekSession.entries.map((entry, index) => {
        let matchedExercise = null;

        // Stratégie 1 : Match par ID (le plus fiable)
        if (entry.exerciseId) {
          matchedExercise = byId.get(entry.exerciseId);
        }

        // Stratégie 2 : Fallback sur nom exact (insensible à la casse)
        if (!matchedExercise) {
          const entryNameLower = (entry.exerciseName || '').toLowerCase().trim();
          matchedExercise = allExercises.find(ex =>
            (ex.name || '').toLowerCase().trim() === entryNameLower
          );
        }

        // Stratégie 3 : Recherche floue
        if (!matchedExercise) {
          const entryNameLower = (entry.exerciseName || '').toLowerCase().trim();
          matchedExercise = allExercises.find(ex => {
            const exNameLower = (ex.name || '').toLowerCase().trim();
            return exNameLower.includes(entryNameLower) || entryNameLower.includes(exNameLower);
          });
        }

        if (matchedExercise) {
          // Retourner l'exercice complet du JSON
          return {
            ...matchedExercise,
            order: entry.order ?? index,
          };
        } else {
          logger.warn(`❌ Aucun match trouvé pour: "${entry.exerciseName}" (ID: ${entry.exerciseId || 'N/A'})`);
          // Fallback : utiliser un exercice minimal
          return {
            id: entry.exerciseId || `repeat-${index}`,
            name: entry.exerciseName || "Exercice",
            type: entry.type || "muscu",
            muscleGroup: entry.muscleGroup,
            muscles: entry.muscles || [],
            order: entry.order ?? index,
            _incomplete: true,
          };
        }
      });

      // Extraire les muscles travaillés pour proposer des exercices similaires
      const musclesSet = new Set();
      exercises.forEach(ex => {
        if (Array.isArray(ex.muscles)) {
          ex.muscles.forEach(m => {
            const normalized = String(m || '').toLowerCase();
            // Mapper vers les IDs de MUSCLE_CARDS de DynamiChoice
            if (normalized.includes('pector')) musclesSet.add('pectoraux');
            else if (normalized.includes('dos') || normalized.includes('back')) musclesSet.add('dos');
            else if (normalized.includes('epaule') || normalized.includes('shoulder')) musclesSet.add('epaules');
            else if (normalized.includes('biceps') || normalized.includes('triceps') || normalized.includes('bras')) musclesSet.add('bras');
            else if (normalized.includes('jambe') || normalized.includes('quadri') || normalized.includes('fessier') || normalized.includes('mollet')) musclesSet.add('jambes');
            else if (normalized.includes('abdo') || normalized.includes('core') || normalized.includes('gainage')) musclesSet.add('core');
          });
        }
      });
      const muscleIds = Array.from(musclesSet);

      setSelectedExercises(exercises);
      setCurrentStep(3);
      setShowRepeatModal(false);
      setSessionName(lastWeekSession.name || "");
      setDynamiKey(prev => prev + 1); // Force le remontage de DynamiChoice

      try {
        storage.set("formSelectedExercises", JSON.stringify(exercises));
        storage.set("dynamiSelected", JSON.stringify(exercises));
        storage.set("formSessionName", JSON.stringify(lastWeekSession.name || ""));
        storage.set("formCurrentStep", "3");
        // Sauvegarder les muscles pour filtrer les exercices proposés
        if (muscleIds.length > 0) {
          storage.set("dynamiMuscle", JSON.stringify(muscleIds));
          storage.set("dynamiType", JSON.stringify("muscu"));
          storage.set("dynamiStep", "3");
        }
      } catch (e) {
        logger.error("Failed to save repeat session to localStorage:", e);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des exercices:", error);
      // En cas d'erreur, utiliser quand même les données basiques
      const exercises = lastWeekSession.entries.map((entry, index) => ({
        id: entry._id || `repeat-${index}`,
        name: entry.exerciseName || "Exercice",
        type: entry.type || "muscu",
        muscleGroup: entry.muscleGroup,
        muscles: entry.muscles,
        order: entry.order ?? index,
      }));

      // Extraire les muscles même en cas d'erreur
      const musclesSet = new Set();
      exercises.forEach(ex => {
        if (Array.isArray(ex.muscles)) {
          ex.muscles.forEach(m => {
            const normalized = String(m || '').toLowerCase();
            if (normalized.includes('pector')) musclesSet.add('pectoraux');
            else if (normalized.includes('dos') || normalized.includes('back')) musclesSet.add('dos');
            else if (normalized.includes('epaule') || normalized.includes('shoulder')) musclesSet.add('epaules');
            else if (normalized.includes('biceps') || normalized.includes('triceps') || normalized.includes('bras')) musclesSet.add('bras');
            else if (normalized.includes('jambe') || normalized.includes('quadri') || normalized.includes('fessier') || normalized.includes('mollet')) musclesSet.add('jambes');
            else if (normalized.includes('abdo') || normalized.includes('core') || normalized.includes('gainage')) musclesSet.add('core');
          });
        }
      });
      const muscleIds = Array.from(musclesSet);

      setSelectedExercises(exercises);
      setCurrentStep(3);
      setShowRepeatModal(false);
      setSessionName(lastWeekSession.name || "");
      setDynamiKey(prev => prev + 1); // Force le remontage de DynamiChoice

      try {
        storage.set("formSelectedExercises", JSON.stringify(exercises));
        storage.set("dynamiSelected", JSON.stringify(exercises));
        storage.set("formSessionName", JSON.stringify(lastWeekSession.name || ""));
        storage.set("formCurrentStep", "3");
        if (muscleIds.length > 0) {
          storage.set("dynamiMuscle", JSON.stringify(muscleIds));
          storage.set("dynamiType", JSON.stringify("muscu"));
          storage.set("dynamiStep", "3");
        }
      } catch (e) {
        logger.error("Failed to save fallback repeat session to localStorage:", e);
      }
    }
  };

  const handleDeclineRepeat = () => {
    setShowRepeatModal(false);
  };

  return (
    <div className={styles.form}>
      {showRepeatModal && lastWeekSession && (
        <RepeatSessionModal
          session={lastWeekSession}
          onAccept={handleAcceptRepeat}
          onDecline={handleDeclineRepeat}
        />
      )}

      {mode === "builder" ? (
        <Salutation className={styles.title} />
      ) : (
        <Salutation className={styles.title} />
      )}

      {mode === "builder" && (
        <div className={styles.sessionName}>
          <label>{t("exercise.form.sessionName.label")}</label>
          <input
            type="text"
            placeholder={t("exercise.form.sessionName.placeholder")}
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>
      )}

      {mode === "builder" ? (
        <>
          <Progress steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

          <DynamiChoice
            key={dynamiKey}
            requestedStep={currentStep}
            onStepChange={setCurrentStep}
            onResultsChange={(arr) => {
              const next = Array.isArray(arr) ? arr : [];
              setSelectedExercises(next);
              try {
                storage.set("formSelectedExercises", JSON.stringify(next));
                storage.set("dynamiSelected", JSON.stringify(next));
                storage.set("dynamiHasTouched", "1");
              } catch (e) {
                logger.error("Failed to save results to localStorage:", e);
              }
            }}
            onChange={(arr) => {
              const next = Array.isArray(arr) ? arr : [];
              setSelectedExercises(next);
              try {
                storage.set("formSelectedExercises", JSON.stringify(next));
                storage.set("dynamiSelected", JSON.stringify(next));
                storage.set("dynamiHasTouched", "1");
              } catch (e) {
                logger.error("Failed to save changes to localStorage:", e);
              }
            }}
            onComplete={(selection) => {
              const list = Array.isArray(selection)
                ? selection
                : (selection?.selectedExercises || selection?.exercises || []);
              setSelectedExercises(list);
              setMode("session");
            }}
            onSearch={(current, cb) => {
              const safe = Array.isArray(current) ? current : [];
              setSearchDraft(safe);
              setSearchCb(() => cb);
              try {
                storage.set("dynamiSelected", JSON.stringify(safe));
                storage.set("dynamiHasTouched", "1");
              } catch (e) {
                logger.error("Failed to save search draft to localStorage:", e);
              }
              setMode("search");
            }}
          />
        </>
      ) : mode === "session" ? (
        <>
          <SuivieExo
            key={suiviKey}
            sessionName={sessionName}
            exercises={selectedExercises}
            onBack={(updated) => {
              if (Array.isArray(updated)) {
                setSelectedExercises(updated);
                try { storage.set("formSelectedExercises", JSON.stringify(updated)); } catch (e) {
                  logger.error("Failed to save updated exercises:", e);
                }
              }
              setMode("builder");
            }}
            onFinish={async (payload) => {
              const summary = payload?.summary && typeof payload.summary === 'object'
                ? payload.summary
                : null;
              const totalExercises = (() => {
                const fromSummary = Number(summary?.plannedExercises);
                if (Number.isFinite(fromSummary) && fromSummary > 0) return fromSummary;
                const fromPayload = Number(payload?.totalExercises);
                if (Number.isFinite(fromPayload) && fromPayload > 0) return fromPayload;
                return Array.isArray(selectedExercises) ? selectedExercises.length : 0;
              })();
              const doneExercises = (() => {
                const fromSummary = Number(summary?.completedExercises);
                if (Number.isFinite(fromSummary) && fromSummary >= 0) return fromSummary;
                const fromPayload = Number(payload?.doneExercises);
                if (Number.isFinite(fromPayload) && fromPayload >= 0) return fromPayload;
                return 0;
              })();

              const stats = {
                durationSec: payload?.durationSec ?? 0,
                savedCount: payload?.savedCount ?? 0,
                calories: payload?.calories ?? 0,
                doneExercises,
                totalExercises,
                exercisesCount: Array.isArray(selectedExercises) ? selectedExercises.length : 0,
                sessionName,
                when: new Date().toISOString(),
              };
              const items = Array.isArray(payload?.items) ? payload.items : [];

              const summaryForSave = summary || (() => {
                const exercisesList = items.map(it => {
                  const data = it?.data || {};
                  return {
                    exerciseName: it?.name || it?.label || it?.exoName || defaultExerciseName,
                    done: Boolean(it?.done || data?.cardioSets?.length || data?.sets?.length),
                    note: typeof data?.notes === 'string' && data.notes.trim() ? data.notes.trim() : undefined,
                  };
                });
                const completed = Number.isFinite(doneExercises) && doneExercises >= 0
                  ? doneExercises
                  : exercisesList.filter(x => x.done).length;
                const planned = Number.isFinite(totalExercises) && totalExercises > 0
                  ? totalExercises
                  : exercisesList.length;
                const skipped = Math.max(0, planned - completed);
                return {
                  plannedExercises: planned,
                  completedExercises: completed,
                  skippedExercises: skipped,
                  exercises: exercisesList,
                };
              })();

              // Note: La séance est déjà sauvegardée par Chrono.jsx
              // Pas besoin de sauvegarder ici pour éviter les doublons
              try {
                // Récupérer l'ID de la séance déjà sauvegardée si disponible
                if (payload?.savedSessionId) {
                  stats.savedId = payload.savedSessionId;
                }
              } catch (e) {
                logger.warn("Get saved session ID failed:", e?.message || e);
              }

              setLastStats(stats);
              setLastItems(items);
              setLastSummary(summaryForSave);
              setShowSummary(true);

              // Nettoyer le localStorage après avoir terminé la séance
              try {
                const KEYS = [
                  "dynamiSelected",
                  "dynamiHasTouched",
                  "dynamiStep",
                  "dynamiType",
                  "dynamiEquip",
                  "dynamiMuscle",
                  "dynamiLastResults",
                  "formSelectedExercises",
                  "formCurrentStep",
                  "formMode",
                  "formSessionName",
                  "suivieStartedAt",
                  "SuivieExoDraft",
                  "suivie_exo_draft",
                ];
                KEYS.forEach(k => storage.remove(k));

                // Nettoyer les inputs de chaque exercice
                const NS = "suivie_exo_inputs:";
                const toDelete = [];
                for (let i = 0; i < storage.length; i++) {
                  const k = storage.key(i);
                  if (k && k.startsWith(NS)) toDelete.push(k);
                }
                toDelete.forEach(k => storage.remove(k));
              } catch (e) {
                logger.warn("Failed to clean localStorage:", e);
              }
            }}
          />
        </>
      ) : (
        <ChercherExo
          preselectedIds={searchDraft.map(e => e.id ?? e._id ?? e.slug ?? (e.name || e.title))}
          onBack={() => setMode("builder")}
          onCancel={() => setMode("builder")}
          onConfirm={(picked) => {
            const byId = (x) => x.id ?? x._id ?? x.slug ?? (x.name || x.title);
            const merged = (() => {
              const map = new Map(searchDraft.map(x => [byId(x), x]));
              (Array.isArray(picked) ? picked : []).forEach(p => map.set(byId(p), p));
              return Array.from(map.values());
            })();
            setSelectedExercises(merged);
            setSearchDraft(merged);
            try {
              storage.set("dynamiSelected", JSON.stringify(merged));
              storage.set("formSelectedExercises", JSON.stringify(merged));
            } catch (e) {
              logger.error("Failed to save merged exercises:", e);
            }
            if (typeof searchCb === 'function') {
              try { searchCb(merged, { mode: 'replace' }); } catch (e) {
                logger.error("Failed to call searchCb:", e);
              }
              setSearchCb(null);
            }
            setMode("builder");

            // Dispatcher l'événement APRÈS que le composant ExerciseResults soit remonté
            setTimeout(() => {
              try {
                window.dispatchEvent(new CustomEvent('dynami:selected:replace', { detail: { items: merged } }));
              } catch (e) {
                logger.error("Failed to dispatch dynami:selected:replace event:", e);
              }
            }, 100);
          }}
        />
      )}

      {user && (user.id || user._id) ? (
        <SuivieSeance user={user} />
      ) : (
        <ConseilJour />
      )}
    </div>
  );
}
