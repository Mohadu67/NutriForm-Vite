import { useState, useEffect } from "react";
import styles from "./EchauffementModal.module.css";

const getWarmupData = (muscleGroups, warmupDatabase) => {
  if (!warmupDatabase) {
    return {
      type: 'warmup',
      title: 'Échauffement recommandé',
      icon: '🔥',
      suggestions: [],
      needsTimer: true
    };
  }
  
  const softActivities = ['meditation', 'yoga', 'etirement', 'swim'];
  const hasSoftActivity = muscleGroups.some(group => softActivities.includes(group));

  if (hasSoftActivity) {
    const activityType = muscleGroups.find(group => softActivities.includes(group));
    const activityData = warmupDatabase.softActivities?.[activityType];

    if (activityData) {
      return {
        type: 'recommendations',
        title: activityData.title,
        icon: activityData.icon,
        suggestions: activityData.recommendations,
        needsTimer: activityData.needsTimer
      };
    }
  }

  
  if (!muscleGroups || muscleGroups.length === 0) {
    const defaultData = warmupDatabase.default;
    return {
      type: 'warmup',
      title: defaultData?.title || 'Échauffement recommandé',
      icon: defaultData?.icon || '🔥',
      suggestions: defaultData?.exercises || [],
      needsTimer: defaultData?.needsTimer !== false
    };
  }

  
  if (muscleGroups.includes("cardio")) {
    const cardioData = warmupDatabase.muscleGroups?.cardio;
    return {
      type: 'warmup',
      title: cardioData?.title || 'Échauffement cardio',
      icon: cardioData?.icon || '🔥',
      suggestions: cardioData?.exercises || [],
      needsTimer: cardioData?.needsTimer !== false
    };
  }

  
  const warmupSet = new Set();
  let combinedTitle = [];

  muscleGroups.forEach(group => {
    const groupData = warmupDatabase.muscleGroups?.[group];
    if (groupData && groupData.exercises) {
      groupData.exercises.forEach(ex => warmupSet.add(ex));
      combinedTitle.push(group);
    }
  });

  if (warmupSet.size > 0) {
    return {
      type: 'warmup',
      title: `Échauffement ${combinedTitle.join(' + ')}`,
      icon: '🔥',
      suggestions: Array.from(warmupSet),
      needsTimer: true
    };
  }

  
  const defaultData = warmupDatabase.default;
  return {
    type: 'warmup',
    title: defaultData?.title || 'Échauffement recommandé',
    icon: defaultData?.icon || '🔥',
    suggestions: defaultData?.exercises || [],
    needsTimer: defaultData?.needsTimer !== false
  };
};

export default function EchauffementModal({ onStart, onSkip, muscleGroups = [] }) {
  const [warmupDatabase, setWarmupDatabase] = useState(null);
  const [warmupTime, setWarmupTime] = useState(300); 
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

  
  useEffect(() => {
    fetch('/data/warmups.json')
      .then(res => res.json())
      .then(data => setWarmupDatabase(data))
      .catch(err => console.error('Erreur chargement warmups:', err));
  }, []);

  const warmupData = getWarmupData(muscleGroups, warmupDatabase);
  const isRecommendations = warmupData.type === 'recommendations';

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const startWarmup = () => {
    setIsWarmingUp(true);
    const interval = setInterval(() => {
      setWarmupTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishWarmup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleFinishWarmup = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setIsWarmingUp(false);
    onStart();
  };

  const handleSkip = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    onSkip();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {!isWarmingUp ? (
          <>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>{warmupData.icon || '🔥'}</span>
            </div>
            <h2 className={styles.title}>{warmupData.title}</h2>
            <p className={styles.subtitle}>
              {isRecommendations
                ? "Quelques recommandations pour profiter pleinement de votre séance."
                : "Un échauffement de 5 minutes est recommandé pour préparer votre corps et réduire les risques de blessures."
              }
            </p>

            <div className={styles.suggestions}>
              <h3>{isRecommendations ? 'Recommandations :' : 'Suggestions d\'échauffement :'}</h3>
              <ul>
                {warmupData.suggestions.map((item, index) => {
                  const text = typeof item === 'string' ? item :
                              item.duration ? `${item.text} - ${item.duration}` : item.text;
                  return <li key={index}>{text}</li>;
                })}
              </ul>
            </div>

            <div className={styles.actions}>
              {isRecommendations ? (
                <button className={styles.startBtn} onClick={handleSkip}>
                  Commencer la séance
                </button>
              ) : (
                <>
                  <button className={styles.skipBtn} onClick={handleSkip}>
                    Déjà fait
                  </button>
                  <button className={styles.startBtn} onClick={startWarmup}>
                    Commencer l'échauffement (5min)
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.timerWrapper}>
              <div className={styles.timerCircle}>
                <span className={styles.timerText}>{formatTime(warmupTime)}</span>
              </div>
            </div>
            <h2 className={styles.title}>Échauffement en cours</h2>
            <p className={styles.subtitle}>Prenez votre temps et préparez votre corps</p>

            <div className={styles.currentSuggestions}>
              {warmupData.suggestions.map((item, index) => {
                const text = typeof item === 'string' ? item :
                            item.duration ? `${item.text} - ${item.duration}` : item.text;
                return (
                  <div key={index} className={styles.suggestionItem}>
                    {text}
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              <button className={styles.finishBtn} onClick={handleFinishWarmup}>
                Terminer l'échauffement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
