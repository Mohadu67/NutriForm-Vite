import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { storage } from '../../../shared/utils/storage';
import styles from "./FormExo.module.css";
import DynamiChoice from "../DynamiChoice/DynamiChoice.jsx";
import Progress from "../BarreDetape/Etapes.jsx";
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

// SVG Icon for welcome screen
const DumbbellIcon = ({ size = 48, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6.5 6.5a2 2 0 0 1 2-2h.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-.5a2 2 0 0 1-2-2V6.5Z" />
    <path d="M17.5 6.5a2 2 0 0 0-2-2h-.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h.5a2 2 0 0 0 2-2V6.5Z" />
    <path d="M11 12h2" />
    <path d="M4.5 8.5a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1v-7Z" />
    <path d="M19.5 8.5a1 1 0 0 0-1-1h-.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1v-7Z" />
  </svg>
);

// Scroll indicator chevron icon
const ChevronDownIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Titres dynamiques et accrocheurs pour chaque section
const HERO_TITLES = {
  withName: [
    (name) => `Salut ${name}, prêt à tout casser ?`,
    (name) => `${name} est dans la place !`,
    (name) => `Hey ${name}, on transpire aujourd'hui ?`,
    (name) => `${name}, mode bête activé ?`,
    (name) => `Alors ${name}, on se bouge ?`,
    (name) => `${name}, c'est l'heure de briller`,
    (name) => `Yo ${name}, les muscles t'attendent`,
  ],
  withoutName: [
    "Prêt à soulever des montagnes ?",
    "C'est l'heure de transpirer",
    "Les excuses, c'est fini",
    "Aujourd'hui, tu deviens légende",
    "Mode warrior activé",
    "Les muscles n'attendent pas",
    "On va tout déchirer",
  ]
};

const HERO_SUBTITLES = [
  "Construis ta séance sur mesure",
  "Ta meilleure version commence ici",
  "Chaque rep compte, chaque set aussi",
  "Le canapé peut attendre",
  "Ton futur toi te remerciera",
  "Moins de blabla, plus de gains",
];

const BUILDER_TITLES = [
  "Compose ton programme",
  "Choisis tes armes",
  "Construis ta légende",
  "Prépare le terrain",
  "À toi de jouer",
  "Mission du jour",
];

const SUIVI_TITLES = [
  "Ton palmarès",
  "Tes exploits récents",
  "La preuve que t'assures",
  "Ton historique de champion",
  "Tes stats de warrior",
  "Le chemin parcouru",
];

const SCROLL_HINTS = [
  "Voir mon historique",
  "Découvrir mes stats",
  "Explorer mes séances",
  "Mes performances",
  "En savoir plus",
];

// Helper pour sélectionner un élément aléatoire
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function FormExo({ user: userProp }) {
  const user = userProp || getCurrentUser();
  const [sessionName, setSessionName] = useState(() => {
    try { return storage.get("formSessionName") || ""; } catch { return ""; }
  });
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(storage.get("formCurrentStep"), 10) || 0; } catch { return 0; }
  });
  const [mode, setMode] = useState(() => {
    try { return storage.get("formMode") || "builder"; } catch { return "builder"; }
  });
  const [selectedExercises, setSelectedExercises] = useState(() => {
    try { return storage.get("formSelectedExercises") || []; } catch { return []; }
  });
  const [searchDraft, setSearchDraft] = useState(() => {
    try { return storage.get("dynamiSelected") || []; } catch { return []; }
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
  const [checkingLastWeek, setCheckingLastWeek] = useState(false);

  // Afficher l'écran d'accueil seulement si on est au début (step 0, mode builder, pas d'exercices sélectionnés)
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      const savedStep = parseInt(storage.get("formCurrentStep"), 10) || 0;
      const savedMode = storage.get("formMode") || "builder";
      const savedExercises = storage.get("formSelectedExercises") || [];
      // Afficher welcome si on est vraiment au début
      return savedMode === "builder" && savedStep === 0 && savedExercises.length === 0;
    } catch {
      return true;
    }
  });
  useEffect(() => { try { storage.set("formSessionName", sessionName); } catch (e) { logger.error("Failed to save sessionName:", e); } }, [sessionName]);
  useEffect(() => { try { storage.set("formCurrentStep", String(currentStep)); } catch (e) { logger.error("Failed to save currentStep:", e); } }, [currentStep]);
  useEffect(() => { try { storage.set("formMode", mode); } catch (e) { logger.error("Failed to save mode:", e); } }, [mode]);
  useEffect(() => { try { storage.set("formSelectedExercises", selectedExercises); } catch (e) { logger.error("Failed to save selectedExercises:", e); } }, [selectedExercises]);

  // Refs for scroll snap navigation
  const pageWrapperRef = useRef(null);
  const builderSectionRef = useRef(null);

  // Scroll to builder section (used by scroll indicator)
  const scrollToBuilder = useCallback(() => {
    if (builderSectionRef.current) {
      builderSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll down to info section
  const scrollToInfo = useCallback(() => {
    // Scroll vers la section info en bas de page
    const infoSection = document.querySelector('[class*="infoSection"]');
    if (infoSection) {
      infoSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Titres dynamiques sélectionnés aléatoirement au montage
  const dynamicTitles = useMemo(() => {
    let userName = null;
    try {
      const cached = storage.get("user") || null;
      userName = cached?.prenom || cached?.pseudo || cached?.displayName ||
        (cached?.email ? String(cached.email).split("@")[0] : null);
      if (userName) {
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
    } catch {}

    const heroTitle = userName
      ? pickRandom(HERO_TITLES.withName)(userName)
      : pickRandom(HERO_TITLES.withoutName);

    return {
      hero: heroTitle,
      heroSubtitle: pickRandom(HERO_SUBTITLES),
      builder: pickRandom(BUILDER_TITLES),
      suivi: pickRandom(SUIVI_TITLES),
      scrollHint: pickRandom(SCROLL_HINTS),
    };
  }, []);

  // Fonction appelée quand l'utilisateur clique sur "Commencer"
  const handleStartSession = async () => {
    // Si pas d'utilisateur connecté, passer directement au formulaire
    if (!user || !(user.id || user._id)) {
      setShowWelcome(false);
      return;
    }

    setCheckingLastWeek(true);
    try {
      const response = await secureApiCall("/workouts/last-week-session");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.sessions) && data.sessions.length > 0) {
          // Filtrer les séances qui ont au moins un exercice
          const sessionsWithExercises = data.sessions.filter(s =>
            Array.isArray(s.entries) && s.entries.length > 0
          );
          if (sessionsWithExercises.length > 0) {
            setLastWeekSession(sessionsWithExercises);
            setShowRepeatModal(true);
            setCheckingLastWeek(false);
            return;
          }
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la récupération de la séance:", error);
    }
    setCheckingLastWeek(false);
    setShowWelcome(false);
  };

  const defaultExerciseName = useMemo(() => "Exercice", []);

  const steps = useMemo(
    () => [
      {
        title: "Type d'entraînement",
        sub: "Sélectionne le type d'entraînement",
      },
      {
        title: "Équipement",
        sub: "Choisis ton équipement disponible",
      },
      {
        title: "Muscles ciblés",
        sub: "Sélectionne les muscles à travailler",
      },
      {
        title: "Exercices proposés",
        sub: "Choisis tes exercices",
      },
    ],
    []
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
            setHasCheckedLastWeek(false);
            setShowWelcome(true); // Revenir à l'écran d'accueil
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
            Nouvelle séance
          </button>
          <button className={styles.BtnReturn} type="button" onClick={() => setShowSummary(false)}>
            Retour
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

  const handleAcceptRepeat = async (sessionToRepeat) => {
    const sessionData = sessionToRepeat || (Array.isArray(lastWeekSession) ? lastWeekSession[0] : lastWeekSession);
    if (!sessionData || !Array.isArray(sessionData.entries)) return;

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
      const exercises = sessionData.entries.map((entry, index) => {
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
      setShowWelcome(false);
      setSessionName(sessionData.name || "");
      setDynamiKey(prev => prev + 1); // Force le remontage de DynamiChoice

      try {
        storage.set("formSelectedExercises", exercises);
        storage.set("dynamiSelected", exercises);
        storage.set("formSessionName", sessionData.name || "");
        storage.set("formCurrentStep", "3");
        // Sauvegarder les muscles pour filtrer les exercices proposés
        if (muscleIds.length > 0) {
          storage.set("dynamiMuscle", muscleIds);
          storage.set("dynamiType", "muscu");
          storage.set("dynamiStep", "3");
        }
      } catch (e) {
        logger.error("Failed to save repeat session to localStorage:", e);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des exercices:", error);
      // En cas d'erreur, utiliser quand même les données basiques
      const exercises = sessionData.entries.map((entry, index) => ({
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
      setShowWelcome(false);
      setSessionName(sessionData.name || "");
      setDynamiKey(prev => prev + 1); // Force le remontage de DynamiChoice

      try {
        storage.set("formSelectedExercises", exercises);
        storage.set("dynamiSelected", exercises);
        storage.set("formSessionName", sessionData.name || "");
        storage.set("formCurrentStep", "3");
        if (muscleIds.length > 0) {
          storage.set("dynamiMuscle", muscleIds);
          storage.set("dynamiType", "muscu");
          storage.set("dynamiStep", "3");
        }
      } catch (e) {
        logger.error("Failed to save fallback repeat session to localStorage:", e);
      }
    }
  };

  const handleDeclineRepeat = () => {
    setShowRepeatModal(false);
    setShowWelcome(false); // Passer au formulaire
  };

  return (
    <div className={styles.pageWrapper} ref={pageWrapperRef}>
      {showRepeatModal && lastWeekSession && (
        <RepeatSessionModal
          session={lastWeekSession}
          onAccept={handleAcceptRepeat}
          onDecline={handleDeclineRepeat}
        />
      )}

      {/* Écran d'accueil - Hero Section + Info Section */}
      {showWelcome && mode === "builder" && !showRepeatModal ? (
        <>
        <section className={styles.heroSection}>
          <div className={styles.form}>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIconWrapper}>
                <DumbbellIcon size={42} className={styles.welcomeIcon} />
              </div>
              <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeTitle}>
                  {dynamicTitles.hero}
                </h1>
                <p className={styles.welcomeSubtitle}>
                  {dynamicTitles.heroSubtitle}
                </p>
              </div>
              <button
                className={styles.welcomeButton}
                onClick={handleStartSession}
                disabled={checkingLastWeek}
              >
                {checkingLastWeek ? (
                  <>
                    <span className={styles.spinner}></span>
                    Chargement...
                  </>
                ) : "Commencer"}
              </button>
              <button
                className={styles.skipButton}
                onClick={scrollToInfo}
                type="button"
              >
                J'ai la flemme !
              </button>
            </div>
          </div>
        </section>

        </>
      ) : (
        <>
          {/* Builder Section */}
          <section className={styles.builderSection} ref={builderSectionRef}>
            <div className={styles.form}>


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
                storage.set("formSelectedExercises", next);
                storage.set("dynamiSelected", next);
                storage.set("dynamiHasTouched", "1");
              } catch (e) {
                logger.error("Failed to save results to localStorage:", e);
              }
            }}
            onChange={(arr) => {
              const next = Array.isArray(arr) ? arr : [];
              setSelectedExercises(next);
              try {
                storage.set("formSelectedExercises", next);
                storage.set("dynamiSelected", next);
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
                storage.set("dynamiSelected", safe);
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
                try { storage.set("formSelectedExercises", updated); } catch (e) {
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
          preselectedExercises={searchDraft}
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
              storage.set("dynamiSelected", merged);
              storage.set("formSelectedExercises", merged);
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
            </div>
          </section>
        </>
      )}

      {/* Suivi Section - Visible seulement quand l'utilisateur a lancé une séance */}
      {!showWelcome && (
        <section className={styles.suiviSection}>
          <div className={styles.form}>
            {user && (user.id || user._id) ? (
              <SuivieSeance user={user} />
            ) : (
              <ConseilJour />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
