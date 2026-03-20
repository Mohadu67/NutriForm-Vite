import React, { useState, useEffect } from "react";
import style from "../Dashboard.module.css";
import { endpoints } from "../../../shared/api/endpoints.js";
import { secureApiCall } from "../../../utils/authService.js";
import { getBodyCompositionSummary } from "../../../shared/api/bodyComposition";

/**
 * WeeklySummary - Resume motivant enrichi de la semaine
 * Utilise l'API analytics pour des insights detailles
 */
export const WeeklySummary = ({ weeklySessions, weeklyCalories, userName }) => {
  const [analytics, setAnalytics] = useState(null);
  const [bodyComp, setBodyComp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les analytics enrichis + body comp
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, bodyCompData] = await Promise.all([
          secureApiCall(endpoints.analytics.weekly).then(r => r.ok ? r.json() : null).catch(() => null),
          getBodyCompositionSummary(7).catch(() => null),
        ]);
        if (analyticsRes) setAnalytics(analyticsRes);
        if (bodyCompData) setBodyComp(bodyCompData);
      } catch (error) {
        console.error("Erreur chargement analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Message principal base sur les donnees enrichies ou fallback simple
  const getMainMotivation = () => {
    // Si on a les analytics enrichis, utiliser les messages generes par le backend
    if (analytics?.motivation?.length > 0) {
      const main = analytics.motivation[0];
      return {
        type: main.type === 'encourage' ? 'encourage' :
              main.type === 'progress' ? 'progress' :
              main.type === 'champion' ? 'champion' : 'good',
        title: main.title,
        message: main.text
      };
    }

    // Fallback sur la logique simple
    if (weeklySessions === 0) {
      return {
        type: "encourage",
        title: "C'est pas grave!",
        message: "Reste focus, faut juste se lancer. Une seance et tu es reparti!"
      };
    } else if (weeklySessions <= 2) {
      return {
        type: "progress",
        title: "Bon debut!",
        message: `${weeklySessions} seance${weeklySessions > 1 ? 's' : ''} cette semaine, c'est un bon debut!`
      };
    } else if (weeklySessions <= 4) {
      return {
        type: "good",
        title: "Belle semaine!",
        message: `${weeklySessions} seances${weeklyCalories > 0 ? ` et ${weeklyCalories} kcal brulees` : ''}!`
      };
    } else {
      return {
        type: "champion",
        title: "Semaine incroyable!",
        message: `${weeklySessions} seances! Tu es une machine!`
      };
    }
  };

  const motivation = getMainMotivation();

  // Icone selon le type
  const getIcon = (type) => {
    switch (type) {
      case 'encourage':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'progress':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        );
      case 'good':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        );
      case 'champion':
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        );
    }
  };

  // Donnees a afficher
  const thisWeek = analytics?.thisWeek || { sessions: weeklySessions, totalCalories: weeklyCalories };
  const topMuscle = analytics?.topMuscle;
  const neglectedMuscles = analytics?.neglectedMuscles || [];
  const insights = analytics?.motivation?.slice(1) || []; // Messages supplementaires

  // Nutrition recap
  const nutritionRecap = bodyComp ? {
    dailyBalance: bodyComp.nutrition?.dailyBalance || 0,
    avgCalories: bodyComp.nutrition?.daily?.calories || 0,
    avgProteins: bodyComp.nutrition?.daily?.proteins || 0,
    proteinPerKg: bodyComp.nutrition?.proteinPerKg || 0,
    muscleGainG: bodyComp.muscleGain?.totalG || 0,
    fatChangeG: bodyComp.fatChange?.g || 0,
    projectedWeight: bodyComp.projectedWeight || null,
  } : null;

  return (
    <section className={`${style.weeklySummary} ${style[`weeklySummary_${motivation.type}`]}`}>
      {/* Icone principale */}
      <div className={style.weeklySummaryIcon}>
        {getIcon(motivation.type)}
      </div>

      {/* Message principal */}
      <div className={style.weeklySummaryContent}>
        <h3 className={style.weeklySummaryTitle}>{motivation.title}</h3>
        <p className={style.weeklySummaryMessage}>{motivation.message}</p>
      </div>

      {/* Stats principales */}
      <div className={style.weeklySummaryStats}>
        <div className={style.weeklySummaryStat}>
          <span className={style.weeklySummaryStatValue}>{thisWeek.sessions}</span>
          <span className={style.weeklySummaryStatLabel}>seance{thisWeek.sessions !== 1 ? 's' : ''}</span>
        </div>
        {thisWeek.totalCalories > 0 && (
          <div className={style.weeklySummaryStat}>
            <span className={style.weeklySummaryStatValue}>{thisWeek.totalCalories}</span>
            <span className={style.weeklySummaryStatLabel}>kcal</span>
          </div>
        )}
        {thisWeek.totalDuration > 0 && (
          <div className={style.weeklySummaryStat}>
            <span className={style.weeklySummaryStatValue}>{thisWeek.totalDuration}</span>
            <span className={style.weeklySummaryStatLabel}>min</span>
          </div>
        )}
        {thisWeek.trainingDays > 0 && (
          <div className={style.weeklySummaryStat}>
            <span className={style.weeklySummaryStatValue}>{thisWeek.trainingDays}</span>
            <span className={style.weeklySummaryStatLabel}>jour{thisWeek.trainingDays !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Recap Nutrition */}
      {nutritionRecap && (
        <div className={style.nutritionRecap}>
          <h4 className={style.nutritionRecapTitle}>Bilan nutrition</h4>
          <div className={style.nutritionRecapGrid}>
            <div className={style.nutritionRecapItem}>
              <span className={style.nutritionRecapValue}>{nutritionRecap.avgCalories}</span>
              <span className={style.nutritionRecapLabel}>kcal/jour</span>
            </div>
            <div className={style.nutritionRecapItem}>
              <span className={style.nutritionRecapValue}>{nutritionRecap.avgProteins}g</span>
              <span className={style.nutritionRecapLabel}>prot/jour ({nutritionRecap.proteinPerKg}g/kg)</span>
            </div>
            <div className={style.nutritionRecapItem}>
              <span className={`${style.nutritionRecapValue} ${nutritionRecap.dailyBalance >= 0 ? style.nutritionRecapPositive : style.nutritionRecapNegative}`}>
                {nutritionRecap.dailyBalance >= 0 ? '+' : ''}{nutritionRecap.dailyBalance}
              </span>
              <span className={style.nutritionRecapLabel}>kcal/jour ({nutritionRecap.dailyBalance >= 0 ? 'surplus' : 'deficit'})</span>
            </div>
          </div>
          <div className={style.nutritionRecapBody}>
            {nutritionRecap.muscleGainG > 0 && (
              <span className={style.nutritionRecapTag}>
                +{nutritionRecap.muscleGainG}g muscle
              </span>
            )}
            <span className={`${style.nutritionRecapTag} ${nutritionRecap.fatChangeG > 0 ? style.nutritionRecapTagBad : style.nutritionRecapTagGood}`}>
              {nutritionRecap.fatChangeG >= 0 ? '+' : ''}{nutritionRecap.fatChangeG}g gras
            </span>
            {nutritionRecap.projectedWeight && (
              <span className={style.nutritionRecapTag}>
                Poids proj. {nutritionRecap.projectedWeight} kg
              </span>
            )}
          </div>
        </div>
      )}

      {/* Insights supplementaires */}
      {insights.length > 0 && (
        <div className={style.weeklySummaryInsights}>
          {insights.slice(0, 2).map((insight, index) => (
            <div key={index} className={`${style.weeklySummaryInsight} ${style[`insight_${insight.type}`]}`}>
              <span className={style.insightIcon}>
                {insight.type === 'insight' && '💪'}
                {insight.type === 'tip' && '💡'}
                {insight.type === 'achievement' && '🏆'}
                {insight.type === 'engagement' && '🔔'}
              </span>
              <div className={style.insightContent}>
                <strong>{insight.title}</strong>
                <span>{insight.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Muscles negliges */}
      {neglectedMuscles.length > 0 && neglectedMuscles.length <= 3 && thisWeek.sessions > 0 && (
        <div className={style.weeklySummaryTip}>
          <span className={style.tipIcon}>💡</span>
          <span>N'oublie pas: {neglectedMuscles.slice(0, 2).join(', ')}</span>
        </div>
      )}

      {/* Top muscle */}
      {topMuscle && (
        <div className={style.weeklySummaryHighlight}>
          <span className={style.highlightIcon}>🎯</span>
          <span>Focus: <strong>{topMuscle.name}</strong> ({topMuscle.count} exos)</span>
        </div>
      )}
    </section>
  );
};
