import { colors } from '../theme';

export const FITNESS_LEVELS = {
  beginner: { label: 'Débutant', color: '#22C55E', gradient: ['#22C55E', '#3D9140'] },
  intermediate: { label: 'Intermédiaire', color: '#F59E0B', gradient: ['#F59E0B', '#E0A800'] },
  advanced: { label: 'Avancé', color: '#EF4444', gradient: ['#EF4444', '#E55A5A'] },
  expert: { label: 'Expert', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
};

export const WORKOUT_TYPE_ICONS = {
  'muscu': 'barbell',
  'musculation': 'barbell',
  'cardio': 'heart',
  'crossfit': 'fitness',
  'yoga': 'flower',
  'running': 'walk',
  'cycling': 'bicycle',
  'swimming': 'water',
  'hiking': 'trail-sign',
  'boxing': 'hand-left',
  'dance': 'musical-notes',
};

export const THEME_COLORS = {
  primaryGradient: [colors.primary, colors.primaryDark],
  secondaryGradient: [colors.secondary, colors.secondaryDark],
  accentGradient: [colors.accent, '#E55A5A'],
  warmGradient: colors.gradients.warm,
};
