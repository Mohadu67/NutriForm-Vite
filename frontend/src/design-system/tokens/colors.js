/**
 * Design System Harmonith - Palette de Couleurs
 * Basé sur la charte graphique: Mint (#B5EAD7) et Cream (#F7F6F2)
 */

export const colors = {
  // Palette principale - Mint
  primary: {
    50: '#F0FBF7',   // Plus clair
    100: '#E1F7EF',
    200: '#D4F1E8',
    300: '#C5EDDF',
    400: '#B5EAD7',  // Couleur principale
    500: '#9DE3C8',
    600: '#7DD9B5',
    700: '#5DCD9F',
    800: '#3DBE87',
    900: '#2A9B6B',
  },

  // Neutres
  neutral: {
    cream: '#F7F6F2',    // Couleur secondaire
    sand: '#E8E6DF',
    stone: '#D1CFC7',
    gray: '#A8A6A0',
    charcoal: '#2C3E50',
    midnight: '#1A252F',
    white: '#FFFFFF',
    black: '#000000',
  },

  // Accents pour les interactions
  accent: {
    coral: '#FFB4B4',      // Erreurs douces
    peach: '#FFDAB4',      // Warnings
    gold: '#FFD93D',       // Premium/Badges
    lavender: '#C8B6E2',   // Features spéciales
    sky: '#B4E4FF',        // Info
    emerald: '#4ADE80',    // Succès
  },

  // Gradients magiques
  gradients: {
    mint: 'linear-gradient(135deg, #B5EAD7 0%, #7DD9B5 100%)',
    sunset: 'linear-gradient(135deg, #FFB4B4 0%, #FFDAB4 100%)',
    mystic: 'linear-gradient(135deg, #C8B6E2 0%, #B4E4FF 100%)',
    premium: 'linear-gradient(135deg, #FFD93D 0%, #FFA93D 100%)',
    aurora: 'linear-gradient(135deg, #B5EAD7 0%, #C8B6E2 50%, #FFB4B4 100%)',
    ocean: 'linear-gradient(135deg, #B4E4FF 0%, #5DCD9F 100%)',
    warm: 'linear-gradient(135deg, #FFDAB4 0%, #FFB4B4 100%)',
  },

  // Glassmorphism
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    whiteLight: 'rgba(255, 255, 255, 0.2)',
    mint: 'rgba(181, 234, 215, 0.1)',
    mintLight: 'rgba(181, 234, 215, 0.2)',
    dark: 'rgba(0, 0, 0, 0.1)',
    darkLight: 'rgba(0, 0, 0, 0.2)',
  },

  // Ombres colorées
  shadows: {
    mint: 'rgba(181, 234, 215, 0.3)',
    lavender: 'rgba(200, 182, 226, 0.3)',
    coral: 'rgba(255, 180, 180, 0.3)',
    gold: 'rgba(255, 217, 61, 0.3)',
  }
};

// Helper functions
export const getColorWithOpacity = (color, opacity) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getDarkVariant = (color) => {
  // Assombrit une couleur de 20%
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 51);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 51);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 51);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const getLightVariant = (color) => {
  // Éclaircit une couleur de 20%
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 51);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 51);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 51);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};