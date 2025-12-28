import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

/**
 * Hook pour créer des styles adaptés au thème (light/dark)
 *
 * Simplifie la gestion du dark mode en évitant la duplication de styles.
 * Au lieu d'écrire: style={[styles.text, isDark && styles.textDark]}
 * On peut écrire: style={themedStyles.text}
 *
 * @param {Function} styleFactory - Fonction qui reçoit isDark et retourne un objet de styles
 * @returns {Object} Styles calculés selon le thème actuel
 *
 * @example
 * ```javascript
 * const themedStyles = useThemedStyles((isDark) => ({
 *   container: {
 *     backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
 *   },
 *   text: {
 *     color: isDark ? '#FFFFFF' : '#000000',
 *     fontSize: 16,
 *   },
 * }));
 *
 * return <Text style={themedStyles.text}>Hello</Text>;
 * ```
 */
export default function useThemedStyles(styleFactory) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => {
    if (typeof styleFactory !== 'function') {
      console.warn('[useThemedStyles] styleFactory must be a function');
      return {};
    }

    return styleFactory(isDark);
  }, [isDark, styleFactory]);

  return styles;
}

/**
 * Helper: Retourne si le thème actuel est dark
 * @returns {boolean} true si dark mode, false sinon
 */
export function useIsDarkMode() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
}

/**
 * Helper: Retourne une couleur selon le thème
 * @param {string} lightColor - Couleur pour le mode clair
 * @param {string} darkColor - Couleur pour le mode sombre
 * @returns {string} Couleur adaptée au thème actuel
 */
export function useThemedColor(lightColor, darkColor) {
  const isDark = useIsDarkMode();
  return isDark ? darkColor : lightColor;
}
