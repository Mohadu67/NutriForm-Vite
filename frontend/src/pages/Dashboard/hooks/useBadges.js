import { useState, useMemo } from "react";

/**
 * Hook pour gérer les badges et achievements
 */
export const useBadges = (stats, records) => {
  const [showBadgesPopup, setShowBadgesPopup] = useState(false);

  const imcPoints = useMemo(() => records.filter((r) => r.type === "imc"), [records]);

  const badges = useMemo(() => {
    return [
      { id: 'first', icon: 'target', name: 'Premier pas', desc: '1re séance', unlocked: stats.totalSessions >= 1 },
      { id: 'five', icon: 'star', name: 'Régulier', desc: '5 séances', unlocked: stats.totalSessions >= 5 },
      { id: 'ten', icon: 'fire', name: 'Motivé', desc: '10 séances', unlocked: stats.totalSessions >= 10 },
      { id: 'twentyfive', icon: 'muscle', name: 'Athlète', desc: '25 séances', unlocked: stats.totalSessions >= 25 },
      { id: 'fifty', icon: 'trophy', name: 'Champion', desc: '50 séances', unlocked: stats.totalSessions >= 50 },
      { id: 'streak3', icon: 'zap', name: 'Série de 3', desc: '3 jours consécutifs', unlocked: stats.streak >= 3 },
      { id: 'streak7', icon: 'check', name: 'Semaine parfaite', desc: '7 jours consécutifs', unlocked: stats.streak >= 7 },
      { id: 'streak14', icon: 'trending', name: 'Machine', desc: '14 jours consécutifs', unlocked: stats.streak >= 14 },
      { id: 'hours10', icon: 'clock', name: 'Endurant', desc: '10h d\'entraînement', unlocked: stats.totalHours >= 10 },
      { id: 'hours25', icon: 'running', name: 'Marathonien', desc: '25h d\'entraînement', unlocked: stats.totalHours >= 25 },
      { id: 'tracker', icon: 'chart', name: 'Tracker', desc: '5 suivis IMC', unlocked: imcPoints.length >= 5 },
    ];
  }, [stats, imcPoints]);

  const badgeCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

  const nextBadge = useMemo(() => {
    return badges.find(b => !b.unlocked);
  }, [badges]);

  return {
    badges,
    badgeCount,
    nextBadge,
    showBadgesPopup,
    setShowBadgesPopup
  };
};
