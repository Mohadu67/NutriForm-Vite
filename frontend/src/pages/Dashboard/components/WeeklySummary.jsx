import { useState, useEffect, useMemo } from "react";
import style from "../Dashboard.module.css";
import { endpoints } from "../../../shared/api/endpoints.js";
import { secureApiCall } from "../../../utils/authService.js";
import { getBodyCompositionSummary } from "../../../shared/api/bodyComposition";
import { TargetIcon, TrendingUpIcon, CheckIcon, FireIcon, MuscleIcon, AlertTriangleIcon, ScaleIcon, ClockIcon, ZapIcon } from "../../../components/Navbar/NavIcons.jsx";

const ZONE_LABELS = {
  pectoraux: "Pectoraux", epaules: "Épaules", biceps: "Biceps", triceps: "Triceps",
  "abdos-centre": "Abdos", "dos-superieur": "Haut du dos", "dos-inferieur": "Dos",
  fessiers: "Fessiers", "cuisses-externes": "Quadriceps", "cuisses-internes": "Ischio-jambiers",
  mollets: "Mollets",
};

// ─── Mapping icône pour les tips ─────────────────────────────────────
const TIP_ICONS = {
  target: (props) => <TargetIcon {...props} />,
  trending: (props) => <TrendingUpIcon {...props} />,
  check: (props) => <CheckIcon {...props} />,
  fire: (props) => <FireIcon {...props} />,
  muscle: (props) => <MuscleIcon {...props} />,
  alert: (props) => <AlertTriangleIcon {...props} />,
  scale: (props) => <ScaleIcon {...props} />,
  clock: (props) => <ClockIcon {...props} />,
  zap: (props) => <ZapIcon {...props} />,
};

// ─── Génération des conseils personnalisés ───────────────────────────
function generateTips(bc, weeklySessions) {
  if (!bc) return [];
  const tips = [];
  const { nutrition: n, muscleGain: mg, userMetrics: u } = bc;
  const goal = u?.goalType || "maintenance";
  const weight = u?.weight;

  // Fréquence
  if (weeklySessions === 0) {
    tips.push({ icon: "target", title: "Lance-toi", text: "Aucune séance cette semaine. Un seul entraînement peut relancer ta dynamique.", tint: "blue" });
  } else if (weeklySessions < 3) {
    tips.push({ icon: "trending", title: "Augmente la cadence", text: `${weeklySessions} séance${weeklySessions > 1 ? "s" : ""} cette semaine. Vise 3 à 5 pour des résultats visibles.`, tint: "amber" });
  } else if (weeklySessions <= 5) {
    tips.push({ icon: "check", title: "Fréquence idéale", text: `${weeklySessions} séances — c'est le sweet spot pour progresser sans se cramer.`, tint: "green" });
  } else {
    tips.push({ icon: "clock", title: "Pense au repos", text: `${weeklySessions} séances, c'est intense. Les muscles se construisent au repos.`, tint: "amber" });
  }

  // Protéines
  if (n?.daysLogged >= 1) {
    if (n.proteinStatus === "insufficient" && n.avgDaily?.proteins > 0) {
      const target = weight ? Math.round(weight * 1.6) : null;
      tips.push({ icon: "alert", title: "Plus de protéines", text: `${n.proteinPerKg}g/kg.${target ? ` Vise ${target}g/jour (1.6g/kg)` : " Vise 1.6g/kg"} pour maximiser tes gains.`, tint: "red" });
    } else if (n.proteinStatus === "adequate") {
      const gap = weight ? Math.round(weight * 1.6 - n.avgDaily.proteins) : null;
      tips.push({ icon: "muscle", title: "Protéines correctes", text: `${n.proteinPerKg}g/kg, bien joué.${gap ? ` Encore ${gap}g pour l'optimal.` : ""}`, tint: "green" });
    } else if (n.proteinStatus === "optimal") {
      tips.push({ icon: "fire", title: "Protéines au top", text: `${n.proteinPerKg}g/kg — synthèse musculaire maximisée.`, tint: "green" });
    }
  }

  // Balance calorique
  if (n?.dailyBalance !== undefined && n?.daysLogged >= 1) {
    const bal = n.dailyBalance;
    if (goal === "muscle_gain") {
      if (bal < 0) tips.push({ icon: "alert", title: "Mange plus", text: `Déficit de ${Math.abs(Math.round(bal))} kcal en prise de masse. Ajoute ${Math.abs(Math.round(bal)) + 200} kcal pour un surplus favorable.`, tint: "red" });
      else if (bal > 500) tips.push({ icon: "scale", title: "Surplus élevé", text: `+${Math.round(bal)} kcal/jour. Au-delà de 300-500 kcal, l'excès part en gras.`, tint: "amber" });
      else if (bal >= 100) tips.push({ icon: "check", title: "Surplus parfait", text: `+${Math.round(bal)} kcal/jour — idéal pour du muscle propre.`, tint: "green" });
    } else if (goal === "weight_loss") {
      if (bal > 0) tips.push({ icon: "alert", title: "Pas de déficit", text: `+${Math.round(bal)} kcal au-dessus de ta maintenance. Réduis pour relancer ta perte.`, tint: "red" });
      else if (bal < -800) tips.push({ icon: "alert", title: "Déficit agressif", text: `${Math.abs(Math.round(bal))} kcal de déficit — risque de perte musculaire. Reste autour de -500 kcal.`, tint: "amber" });
      else if (bal < 0) tips.push({ icon: "fire", title: "Bon déficit", text: `${Math.abs(Math.round(bal))} kcal de déficit — ~${Math.round(Math.abs(bal) * 7 / 7700 * 1000)}g de gras/semaine.`, tint: "green" });
    }
  }

  // Focus musculaire croisé avec nutrition
  if (mg?.byZone && weeklySessions > 0) {
    const zones = Object.entries(mg.byZone).filter(([, d]) => d.gainG > 0).sort((a, b) => b[1].gainG - a[1].gainG);
    if (zones.length > 0) {
      const topLabel = ZONE_LABELS[zones[0][0]] || zones[0][0];
      if (n?.proteinStatus === "insufficient") {
        tips.push({ icon: "target", title: `Focus ${topLabel}`, text: `Bon travail sur les ${topLabel.toLowerCase()} mais protéines insuffisantes. Plus de protéines = meilleurs résultats.`, tint: "amber" });
      }
    }

    const mainZones = ["pectoraux", "epaules", "dos-inferieur", "cuisses-externes", "fessiers"];
    const trained = new Set(zones.map(([z]) => z));
    const neglected = mainZones.filter(z => !trained.has(z));
    if (neglected.length > 0 && neglected.length <= 3) {
      const labels = neglected.slice(0, 2).map(z => (ZONE_LABELS[z] || z).toLowerCase()).join(" et ");
      tips.push({ icon: "scale", title: "Équilibre", text: `Pense à travailler les ${labels} pour un développement harmonieux.`, tint: "blue" });
    }
  }

  // Nutrition non renseignée
  if (!n?.daysLogged || n.daysLogged === 0) {
    tips.push({ icon: "target", title: "Log ta nutrition", text: "Aucun repas enregistré. Renseigne tes repas pour des conseils précis sur tes macros.", tint: "blue" });
  } else if (n.daysLogged < 3) {
    tips.push({ icon: "trending", title: "Continue de logger", text: `${n.daysLogged} jour${n.daysLogged > 1 ? "s" : ""} enregistré${n.daysLogged > 1 ? "s" : ""}. Plus de données = meilleurs conseils.`, tint: "blue" });
  }

  // Surentraînement + mauvaise nutrition
  if (weeklySessions > 5 && n?.proteinStatus !== "optimal") {
    tips.push({ icon: "clock", title: "Récupération", text: "Beaucoup de séances + protéines insuffisantes. Tu risques le surentraînement.", tint: "red" });
  }

  // Timing protéines (MPS)
  if (n?.mpsScore !== undefined && n.mpsScore < 0.3 && weeklySessions > 0) {
    tips.push({ icon: "zap", title: "Timing protéines", text: "Mange tes protéines le jour de l'entraînement et le lendemain. La fenêtre MPS dure 24-48h.", tint: "blue" });
  }

  return tips;
}

// ─── Icônes motivation ───────────────────────────────────────────────
const ICONS = {
  encourage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  good: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  champion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
};

// ─── Composant ───────────────────────────────────────────────────────
export const WeeklySummary = ({ weeklySessions, weeklyCalories, userName }) => {
  const [analytics, setAnalytics] = useState(null);
  const [bodyComp, setBodyComp] = useState(null);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    Promise.all([
      secureApiCall(endpoints.analytics.weekly).then(r => r.ok ? r.json() : null).catch(() => null),
      getBodyCompositionSummary(7).catch(() => null),
    ]).then(([analyticsRes, bodyCompData]) => {
      if (analyticsRes) setAnalytics(analyticsRes);
      if (bodyCompData) setBodyComp(bodyCompData);
    });
  }, []);

  // Message motivation
  const motivation = useMemo(() => {
    if (analytics?.motivation?.length > 0) {
      const m = analytics.motivation[0];
      return { type: m.type === "encourage" ? "encourage" : m.type === "progress" ? "progress" : m.type === "champion" ? "champion" : "good", title: m.title, message: m.text };
    }
    if (weeklySessions === 0) return { type: "encourage", title: "C'est pas grave !", message: "Reste focus, faut juste se lancer. Une séance et tu es reparti !" };
    if (weeklySessions <= 2) return { type: "progress", title: "Bon début !", message: `${weeklySessions} séance${weeklySessions > 1 ? "s" : ""} cette semaine, c'est un bon début !` };
    if (weeklySessions <= 4) return { type: "good", title: "Belle semaine !", message: `${weeklySessions} séances${weeklyCalories > 0 ? ` et ${weeklyCalories} kcal brûlées` : ""} !` };
    return { type: "champion", title: "Semaine incroyable !", message: `${weeklySessions} séances ! Tu es une machine !` };
  }, [analytics, weeklySessions, weeklyCalories]);

  // Calories brûlées : priorité bodyComp (inclut DailyHealthData) > analytics > props
  const burnedFromBodyComp = bodyComp?.nutrition?.avgDaily?.burned
    ? Math.round(bodyComp.nutrition.avgDaily.burned * (bodyComp.nutrition.daysLogged || 7))
    : 0;
  const bestCalories = burnedFromBodyComp || weeklyCalories;
  const thisWeek = analytics?.thisWeek || { sessions: weeklySessions, totalCalories: bestCalories };

  // Nutrition recap
  const nutritionRecap = bodyComp ? {
    dailyBalance: bodyComp.nutrition?.dailyBalance || 0,
    avgCalories: bodyComp.nutrition?.avgDaily?.calories || 0,
    avgProteins: bodyComp.nutrition?.avgDaily?.proteins || 0,
    proteinPerKg: bodyComp.nutrition?.proteinPerKg || 0,
    muscleGainG: bodyComp.muscleGain?.totalG || 0,
    fatChangeG: bodyComp.fatChange?.g || 0,
    projectedWeight: bodyComp.projectedWeight || null,
  } : null;

  // Tips personnalisés
  const tips = useMemo(() => generateTips(bodyComp, weeklySessions), [bodyComp, weeklySessions]);

  return (
    <section className={style.wsCard}>
      {/* Header motivation */}
      <div className={style.wsHeader}>
        <div className={`${style.wsIcon} ${style[`wsIcon_${motivation.type}`] || ""}`}>
          {ICONS[motivation.type] || ICONS.good}
        </div>
        <div className={style.wsHeaderContent}>
          <h3 className={style.wsTitle}>{motivation.title}</h3>
          <p className={style.wsMessage}>{motivation.message}</p>
        </div>
      </div>

      {/* Stats */}
      <div className={style.wsStatsRow}>
        <div className={style.wsStat}>
          <span className={style.wsStatVal}>{thisWeek.sessions}</span>
          <span className={style.wsStatLabel}>séance{thisWeek.sessions !== 1 ? "s" : ""}</span>
        </div>
        {thisWeek.totalCalories > 0 && (
          <div className={style.wsStat}>
            <span className={style.wsStatVal}>{thisWeek.totalCalories}</span>
            <span className={style.wsStatLabel}>kcal</span>
          </div>
        )}
        {thisWeek.totalDuration > 0 && (
          <div className={style.wsStat}>
            <span className={style.wsStatVal}>{thisWeek.totalDuration}</span>
            <span className={style.wsStatLabel}>min</span>
          </div>
        )}
        {thisWeek.trainingDays > 0 && (
          <div className={style.wsStat}>
            <span className={style.wsStatVal}>{thisWeek.trainingDays}</span>
            <span className={style.wsStatLabel}>jour{thisWeek.trainingDays !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Bilan nutrition */}
      {nutritionRecap && (
        <div className={style.wsNutrition}>
          <h4 className={style.wsNutritionTitle}>Bilan nutrition</h4>
          <div className={style.wsNutritionGrid}>
            <div className={style.wsNutritionItem}>
              <span className={style.wsNutritionValue}>{nutritionRecap.avgCalories}</span>
              <span className={style.wsNutritionLabel}>kcal/jour</span>
            </div>
            <div className={style.wsNutritionItem}>
              <span className={style.wsNutritionValue}>{nutritionRecap.avgProteins}g</span>
              <span className={style.wsNutritionLabel}>prot/jour ({nutritionRecap.proteinPerKg}g/kg)</span>
            </div>
            <div className={style.wsNutritionItem}>
              <span className={`${style.wsNutritionValue} ${nutritionRecap.dailyBalance >= 0 ? style.wsPositive : style.wsNegative}`}>
                {nutritionRecap.dailyBalance >= 0 ? "+" : ""}{nutritionRecap.dailyBalance}
              </span>
              <span className={style.wsNutritionLabel}>kcal/jour ({nutritionRecap.dailyBalance >= 0 ? "surplus" : "déficit"})</span>
            </div>
          </div>
          <div className={style.wsNutritionBody}>
            {nutritionRecap.muscleGainG > 0 && (
              <span className={`${style.wsTag} ${style.wsTagGood}`}>+{nutritionRecap.muscleGainG}g muscle</span>
            )}
            <span className={`${style.wsTag} ${nutritionRecap.fatChangeG > 0 ? style.wsTagBad : style.wsTagGood}`}>
              {nutritionRecap.fatChangeG >= 0 ? "+" : ""}{nutritionRecap.fatChangeG}g gras
            </span>
            {nutritionRecap.projectedWeight && (
              <span className={style.wsTag}>Poids proj. {nutritionRecap.projectedWeight} kg</span>
            )}
          </div>
        </div>
      )}

      {/* CTA conseils */}
      {tips.length > 0 && !showTips && (
        <button className={style.wsCta} onClick={() => setShowTips(true)}>
          Mes conseils personnalisés
          <span className={style.wsCtaChevron}>›</span>
        </button>
      )}

      {/* Tips carousel */}
      {showTips && tips.length > 0 && (
        <div className={style.wsTipsRow}>
          {tips.map((tip, i) => {
            const IconComponent = TIP_ICONS[tip.icon] || TIP_ICONS.target;
            return (
              <div key={i} className={`${style.wsTipCard} ${style[`wsTint_${tip.tint}`] || ""}`}>
                <span className={style.wsTipIcon}>{IconComponent({ size: 16 })}</span>
                <span className={style.wsTipTitle}>{tip.title}</span>
                <span className={style.wsTipText}>{tip.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
