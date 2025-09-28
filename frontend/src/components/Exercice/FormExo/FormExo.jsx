import { useState, useEffect } from "react";
import styles from "./FormExo.module.css";
import DynamiChoice from "../DynamiChoice/DynamiChoice.jsx";
import Progress from "../BarreDetape/Etapes.jsx";
import Salutation from "./salutation.jsx";
import SuivieExo from "../ExerciceSuivie/SuivieExo.jsx";
import ChercherExo from "../ExerciceSuivie/MoteurRechercheUser/ChercherExo.jsx";
import SuivieSeance from "../TableauBord/SuivieSeance.jsx";
import Stat from "../TableauBord/stats/Stat.jsx";
import { saveSession } from "../TableauBord/sessionApi.js";
import ConseilJour from "./ConseilJour.jsx";
import { idOf } from "../Shared/idOf.js";

export default function FormExo({ user }) {
  const [sessionName, setSessionName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("formSessionName")) || ""; } catch { return ""; }
  });
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(localStorage.getItem("formCurrentStep"), 10) || 0; } catch { return 0; }
  });
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("formMode") || "builder"; } catch { return "builder"; }
  });
  const [selectedExercises, setSelectedExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem("formSelectedExercises")) || []; } catch { return []; }
  });
  const [searchDraft, setSearchDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dynamiSelected")) || []; } catch { return []; }
  });
  const [showSummary, setShowSummary] = useState(false);
  const [lastStats, setLastStats] = useState(null);
  const [lastItems, setLastItems] = useState([]);
  const [searchCb, setSearchCb] = useState(null);
  useEffect(() => { try { localStorage.setItem("formSessionName", JSON.stringify(sessionName)); } catch {} }, [sessionName]);
  useEffect(() => { try { localStorage.setItem("formCurrentStep", String(currentStep)); } catch {} }, [currentStep]);
  useEffect(() => { try { localStorage.setItem("formMode", mode); } catch {} }, [mode]);
  useEffect(() => { try { localStorage.setItem("formSelectedExercises", JSON.stringify(selectedExercises)); } catch {} }, [selectedExercises]);
  useEffect(() => {
  }, [user]);

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
            return { type, sets: cardioSets.length ? cardioSets : muscuSets };
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
              KEYS.forEach(k => localStorage.removeItem(k));
            } catch {}
            try {
              const NS = "suivie_exo_inputs:";
              const toDelete = [];
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(NS)) toDelete.push(k);
              }
              toDelete.forEach(k => localStorage.removeItem(k));
            } catch {}
            try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
          }}>
            🔄 Recommencer
          </button>
          <button className={styles.BtnReturn} type="button" onClick={() => setShowSummary(false)}>
            ← Retour
          </button>
        </div>

        {user && (user.id || user._id) ? (
          <SuivieSeance user={user} lastSession={lastSessionForStat} />
        ) : null}
      </div>
    );
  }

  const steps = [
    { title: "Entrainement", sub: "Choisi ton entrainement" },
    { title: "Équipement", sub: "Sélectionne tes équipement" },
    { title: "Muscles", sub: "Cible les muscles" },
    { title: "Exercices", sub: "Personnalisez votre séance" },
  ];

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

  return (
    <div className={styles.form}>
      {mode === "builder" ? (
        <Salutation className={styles.title} />
      ) : (
        <Salutation className={styles.title} />
      )}

      {mode === "builder" && (
        <div className={styles.sessionName}>
          <label>Nom de ta séance :</label>
          <input
            type="text"
            placeholder="Ex: Séance Dos,Biceps"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>
      )}

      {mode === "builder" ? (
        <>
          <Progress steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

          <DynamiChoice
            requestedStep={currentStep}
            onStepChange={setCurrentStep}
            onResultsChange={(arr) => {
              const next = Array.isArray(arr) ? arr : [];
              setSelectedExercises(next);
              console.log("FormExo.onResultsChange next=", next);
              try {
                localStorage.setItem("formSelectedExercises", JSON.stringify(next));
                localStorage.setItem("dynamiSelected", JSON.stringify(next));
                localStorage.setItem("dynamiHasTouched", "1");
              } catch {}
            }}
            onChange={(arr) => {
              const next = Array.isArray(arr) ? arr : [];
              setSelectedExercises(next);
              console.log("FormExo.onChange next=", next);
              try {
                localStorage.setItem("formSelectedExercises", JSON.stringify(next));
                localStorage.setItem("dynamiSelected", JSON.stringify(next));
                localStorage.setItem("dynamiHasTouched", "1");
              } catch {}
            }}
            onComplete={(selection) => {
              console.log("Choix séance raw=", selection);
              const list = Array.isArray(selection)
                ? selection
                : (selection?.selectedExercises || selection?.exercises || []);
              console.log("Choix séance parsed=", list);
              setSelectedExercises(list);
              setMode("session");
            }}
            onSearch={(current, cb) => {
              const safe = Array.isArray(current) ? current : [];
              setSearchDraft(safe);
              setSearchCb(() => cb);
              try {
                localStorage.setItem("dynamiSelected", JSON.stringify(safe));
                localStorage.setItem("dynamiHasTouched", "1");
              } catch {}
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
                try { localStorage.setItem("formSelectedExercises", JSON.stringify(updated)); } catch {}
              }
              setMode("builder");
            }}
            onFinish={async (payload) => {
              const stats = {
                durationSec: payload?.durationSec ?? 0,
                savedCount: payload?.savedCount ?? 0,
                calories: payload?.calories ?? 0,
                doneExercises: payload?.doneExercises ?? 0,
                totalExercises: payload?.totalExercises ?? (Array.isArray(selectedExercises) ? selectedExercises.length : 0),
                exercisesCount: Array.isArray(selectedExercises) ? selectedExercises.length : 0,
                sessionName,
                when: new Date().toISOString(),
              };
              const items = Array.isArray(payload?.items) ? payload.items : [];

              try {
                if (user && (user.id || user._id)) {
                  const body = {
                    name: sessionName || `Séance – ${new Date().toLocaleDateString()}`,
                    startedAt: stats?.when || new Date().toISOString(),
                    endedAt: new Date().toISOString(),
                    notes: "",
                    items
                  };
                  const saved = await saveSession(body);
                  if (saved && (saved.id || saved._id)) {
                    stats.savedId = saved.id || saved._id;
                  }
                }
              } catch (e) {
                console.warn("Persist session failed:", e?.message || e);
              }

              setLastStats(stats);
              setLastItems(items);
              setShowSummary(true);
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
              localStorage.setItem("dynamiSelected", JSON.stringify(merged));
              localStorage.setItem("formSelectedExercises", JSON.stringify(merged));
            } catch {}
            if (typeof searchCb === 'function') {
              try { searchCb(merged, { mode: 'replace' }); } catch {}
              setSearchCb(null);
            }
            setMode("builder");
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
