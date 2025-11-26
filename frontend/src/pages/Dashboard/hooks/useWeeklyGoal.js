import { useState, useEffect, useCallback } from "react";
import { storage } from "../../../shared/utils/storage.js";

/**
 * Hook pour gérer l'objectif hebdomadaire
 */
export const useWeeklyGoal = (stats) => {
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [tempGoal, setTempGoal] = useState(3);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Charger l'objectif sauvegardé
  useEffect(() => {
    const savedGoal = storage.get("weeklyGoal");
    if (savedGoal) {
      const goal = parseInt(savedGoal, 10);
      if (goal > 0 && goal <= 14) {
        setWeeklyGoal(goal);
        setTempGoal(goal);
      }
    }
  }, []);

  const handleSaveGoal = useCallback(() => {
    if (tempGoal > 0 && tempGoal <= 14) {
      setWeeklyGoal(tempGoal);
      storage.set("weeklyGoal", tempGoal);
      setShowGoalModal(false);
    }
  }, [tempGoal]);

  const handleOpenGoalModal = useCallback(() => {
    setTempGoal(weeklyGoal);
    setShowGoalModal(true);
  }, [weeklyGoal]);

  const weeklyProgress = Math.min((stats.last7Days / weeklyGoal) * 100, 100);

  return {
    weeklyGoal,
    tempGoal,
    showGoalModal,
    weeklyProgress,
    handleOpenGoalModal,
    handleSaveGoal,
    setShowGoalModal,
    setTempGoal
  };
};
