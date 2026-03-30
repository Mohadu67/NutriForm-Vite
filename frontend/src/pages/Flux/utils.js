// ─── Helpers ─────────────────────────────────────────────────────────────────

export const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`;
  return `${s}s`;
};

export const formatVolume = (kg) => {
  if (!kg) return null;
  return kg >= 1000
    ? `${(kg / 1000).toFixed(1).replace('.', ',')} t`
    : `${kg.toLocaleString('fr-FR')} kg`;
};

export const formatDateLong = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).replace(',', ' à');
};

export const formatDateRelative = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMin = Math.floor((now - d) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD}j`;
  return formatDateLong(date);
};

export const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

export const MUSCLE_COLORS = {
  'Pectoraux': '#E8895A',
  'Dos': '#7B9CFF',
  'Biceps': '#FF6B8A',
  'Triceps': '#A78BFA',
  'Épaules': '#34D399',
  'Jambes': '#FBBF24',
  'Abdos': '#60A5FA',
  'Mollets': '#F87171',
  'Cardio': '#22D3EE',
};

export const CHALLENGE_LABELS = {
  sessions: 'Nombre de séances',
  streak: 'Jours de streak',
  calories: 'Calories brûlées',
  duration: 'Minutes d\'entraînement',
  max_pushups: 'Max Pompes',
  max_pullups: 'Max Tractions',
  max_bench: 'Développé Couché — Max',
  max_squat: 'Squat — Max',
  max_deadlift: 'Soulevé de terre — Max',
  max_burpees: 'Max Burpees',
};

export const FEED_ZONE_MAP = {
  'Pectoraux': 'pectoraux', 'Épaules': 'epaules', 'Biceps': 'biceps',
  'Triceps': 'triceps', 'Abdos': 'abdos-centre', 'Dos': 'dos-inferieur',
  'Jambes': 'cuisses-externes', 'Mollets': 'mollets', 'Cardio': 'abdos-centre',
};

export const FEED_INACTIVE_FILL = 'rgba(52,72,94,0.08)';
export const FEED_INACTIVE_STROKE = 'rgba(38,48,68,0.2)';

export function getZoneName(raw) {
  if (!raw) return null;
  const l = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s._-]+/g, '');
  if (l.includes('pec') || l.includes('chest') || l.includes('pectoraux')) return 'pectoraux';
  if (l.includes('shoulder') || l.includes('epaule') || l.includes('deltoid')) return 'epaules';
  if (l.includes('oblique')) return 'abdos-lateraux';
  if (l.includes('abs') || l.includes('abdo')) return 'abdos-centre';
  if (l.includes('bicep')) return 'biceps';
  if (l.includes('tricep')) return 'triceps';
  if (l.includes('forearm') || l.includes('avantbras')) return 'avant-bras';
  if (l.includes('quad') || l.includes('cuisse') || l.includes('jambe')) return 'cuisses-externes';
  if (l.includes('hamstring') || l.includes('ischio')) return 'cuisses-internes';
  if (l.includes('calf') || l.includes('calves') || l.includes('mollet')) return 'mollets';
  if (l.includes('glute') || l.includes('fess')) return 'fessiers';
  if (l.includes('trap')) return 'dos-superieur';
  if (l.includes('back') || l.includes('dos') || l.includes('lat')) return 'dos-inferieur';
  return null;
}
