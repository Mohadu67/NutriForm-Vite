import { useState, useMemo } from "react";

/**
 * Hook pour gérer les badges et achievements
 */
export const useBadges = (stats, records) => {
  const [showBadgesPopup, setShowBadgesPopup] = useState(false);

  const imcPoints = useMemo(() => records.filter((r) => r.type === "imc"), [records]);

  const badges = useMemo(() => {
    return [
      { id: 'first', emoji: '🎯', name: 'Premier pas', desc: '1ère séance', unlocked: stats.totalSessions >= 1 },
      { id: 'five', emoji: '⭐', name: 'Régulier', desc: '5 séances', unlocked: stats.totalSessions >= 5 },
      { id: 'ten', emoji: '🔥', name: 'Motivé', desc: '10 séances', unlocked: stats.totalSessions >= 10 },
      { id: 'twentyfive', emoji: '💪', name: 'Athlète', desc: '25 séances', unlocked: stats.totalSessions >= 25 },
      { id: 'fifty', emoji: '🏆', name: 'Champion', desc: '50 séances', unlocked: stats.totalSessions >= 50 },
      { id: 'streak3', emoji: '🌟', name: 'Série de 3', desc: '3 jours consécutifs', unlocked: stats.streak >= 3 },
      { id: 'streak7', emoji: '🚀', name: 'Semaine parfaite', desc: '7 jours consécutifs', unlocked: stats.streak >= 7 },
      { id: 'streak14', emoji: '👑', name: 'Machine', desc: '14 jours consécutifs', unlocked: stats.streak >= 14 },
      { id: 'hours10', emoji: '⏱️', name: 'Endurant', desc: '10h d\'entraînement', unlocked: stats.totalHours >= 10 },
      { id: 'hours25', emoji: '🎖️', name: 'Marathonien', desc: '25h d\'entraînement', unlocked: stats.totalHours >= 25 },
      { id: 'tracker', emoji: '📊', name: 'Tracker', desc: '5 suivis IMC', unlocked: imcPoints.length >= 5 },
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
