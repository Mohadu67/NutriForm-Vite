// Workout Type Icons - SVG icons for workout types
import {
  DumbbellIcon,
  ActivityIcon,
  HeartIcon,
  TrophyIcon,
  ZapIcon,
  FlameIcon,
  TargetIcon
} from './GlobalIcons';

// Additional workout-specific icons
export const RunningIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/>
    <path d="m9 20 3-6 3 6"/>
    <path d="m6 8 6 2 6-2"/>
    <path d="M12 10v4"/>
  </svg>
);

export const YogaIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0 0 5"/>
    <path d="M12 9.5V21"/>
    <path d="m6 15 6-6 6 6"/>
    <path d="M3 21h18"/>
  </svg>
);

export const PilatesIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="6" r="2"/>
    <path d="M12 8v8"/>
    <path d="m8 14 4 4 4-4"/>
    <path d="M8 18h8"/>
  </svg>
);

export const CyclingIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="18" r="3"/>
    <circle cx="19" cy="18" r="3"/>
    <polyline points="12 19 12 9 15 6"/>
    <path d="m5 18 7-7 7 7"/>
  </svg>
);

export const SwimmingIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 19c1.5 0 2.5-1.5 4-1.5s2.5 1.5 4 1.5 2.5-1.5 4-1.5 2.5 1.5 4 1.5 2.5-1.5 4-1.5"/>
    <path d="M10 8V3h4v5"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const BoxingIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 13a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6Z"/>
    <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/>
    <path d="M7 13h10"/>
  </svg>
);

export const DanceIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/>
    <path d="M10 8v8l-2 3"/>
    <path d="M14 8v8l2 3"/>
    <path d="m8 11 8 0"/>
    <path d="M10 8L8 5"/>
    <path d="M14 8l2-3"/>
  </svg>
);

export const StretchingIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/>
    <path d="M12 6v6"/>
    <path d="m8 8 4 4 4-4"/>
    <path d="M6 20l6-8 6 8"/>
  </svg>
);

export const ShoeIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 18h20l-2-8h-3l-2-4h-4l-3 4H5l-3 8z"/>
    <path d="M6 14h12"/>
  </svg>
);

export const CrossfitIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18"/>
    <path d="M12 3v18"/>
    <path d="m5 7 14 10"/>
    <path d="m5 17 14-10"/>
  </svg>
);

// Re-export commonly used icons with workout-specific naming
export const MuscleIcon = DumbbellIcon;
export const CardioIcon = ActivityIcon;
export const FunctionalIcon = ZapIcon;
export const HIITIcon = FlameIcon;
export const OtherIcon = TargetIcon;
export { DumbbellIcon, TargetIcon }; // Re-export for direct usage

// Workout type icon mapping
export const WORKOUT_ICONS = {
  musculation: MuscleIcon,
  cardio: CardioIcon,
  crossfit: CrossfitIcon,
  yoga: YogaIcon,
  pilates: PilatesIcon,
  running: RunningIcon,
  cycling: CyclingIcon,
  swimming: SwimmingIcon,
  boxing: BoxingIcon,
  dance: DanceIcon,
  functional: FunctionalIcon,
  hiit: HIITIcon,
  stretching: StretchingIcon,
  other: OtherIcon
};

// Helper function to get icon component by type
export const getWorkoutIcon = (type) => {
  return WORKOUT_ICONS[type] || OtherIcon;
};