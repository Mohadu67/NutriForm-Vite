import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { theme } from '../../theme';
import { MUSCLE_ZONES, ZONE_LABELS } from './muscleZones';
import { FRONT_PATHS, BACK_PATHS, SVG_VIEWBOX_FRONT, SVG_VIEWBOX_BACK, ELEM_TO_ZONE } from './bodyPaths';

// Couleurs pour les zones musculaires
const MUSCLE_COLORS = {
  default: {
    light: '#A8A8A8',
    dark: '#5A5A5A',
  },
  selected: {
    fill: theme.colors.primary,
    stroke: theme.colors.primaryDark,
  },
  outline: {
    light: '#F0F0F0',
    dark: '#3A3A3A',
  },
  stroke: {
    light: '#777777',
    dark: '#6A6A6A',
  },
};

// Composant pour un groupe de paths d'une zone musculaire
function MuscleGroup({ paths, zoneId, isSelected, onPress, isDark }) {
  const fillColor = useMemo(() => {
    if (isSelected) return MUSCLE_COLORS.selected.fill;
    return isDark ? MUSCLE_COLORS.default.dark : MUSCLE_COLORS.default.light;
  }, [isSelected, isDark]);

  const strokeColor = useMemo(() => {
    if (isSelected) return MUSCLE_COLORS.selected.stroke;
    return isDark ? MUSCLE_COLORS.stroke.dark : MUSCLE_COLORS.stroke.light;
  }, [isSelected, isDark]);

  return (
    <G onPress={onPress}>
      {paths.map((pathData, index) => {
        const hasStroke = pathData.stroke && parseFloat(pathData.strokeWidth || 0) > 0;
        return (
          <Path
            key={index}
            d={pathData.d}
            fill={fillColor}
            stroke={hasStroke ? pathData.stroke : strokeColor}
            strokeWidth={hasStroke ? parseFloat(pathData.strokeWidth) : (isSelected ? 2.5 : 1)}
            strokeLinejoin="round"
          />
        );
      })}
    </G>
  );
}

export default function BodyPicker({
  value,
  onChange,
  multiple = false,
  showLabels = true,
  height = 450,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [view, setView] = useState('front'); // 'front' ou 'back'

  // Paths et viewBox selon la vue
  const currentPaths = view === 'front' ? FRONT_PATHS : BACK_PATHS;
  const currentViewBox = view === 'front' ? SVG_VIEWBOX_FRONT : SVG_VIEWBOX_BACK;

  // Normaliser la valeur en Set
  const selectedZones = useMemo(() => {
    if (multiple) {
      return new Set(Array.isArray(value) ? value : []);
    }
    return new Set(value ? [value] : []);
  }, [value, multiple]);

  // Labels des zones selectionnees
  const selectedLabels = useMemo(() => {
    const orderedIds = MUSCLE_ZONES.map(z => z.id);
    return Array.from(selectedZones)
      .sort((a, b) => orderedIds.indexOf(a) - orderedIds.indexOf(b))
      .map(id => ZONE_LABELS[id] || id);
  }, [selectedZones]);

  // Gestion du clic sur une zone
  const handleZonePress = useCallback((zoneId) => {
    if (!zoneId || !onChange) return;

    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const index = current.indexOf(zoneId);

      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(zoneId);
      }

      const orderedIds = MUSCLE_ZONES.map(z => z.id);
      current.sort((a, b) => orderedIds.indexOf(a) - orderedIds.indexOf(b));
      onChange(current);
    } else {
      onChange(value === zoneId ? null : zoneId);
    }
  }, [multiple, onChange, value]);

  const instructions = multiple
    ? 'Touche les zones a cibler'
    : 'Touche une zone pour la selectionner';

  return (
    <View style={styles.container}>
      {/* Toggle Face/Dos */}
      <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === 'front' && styles.toggleButtonActive,
            view === 'front' && isDark && styles.toggleButtonActiveDark,
          ]}
          onPress={() => setView('front')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            view === 'front' && styles.toggleTextActive,
            isDark && view !== 'front' && styles.toggleTextDark,
          ]}>
            Face
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === 'back' && styles.toggleButtonActive,
            view === 'back' && isDark && styles.toggleButtonActiveDark,
          ]}
          onPress={() => setView('back')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            view === 'back' && styles.toggleTextActive,
            isDark && view !== 'back' && styles.toggleTextDark,
          ]}>
            Dos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Corps SVG */}
      <View style={[
        styles.svgContainer,
        { height },
        isDark ? styles.svgContainerDark : styles.svgContainerLight
      ]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={currentViewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Elements decoratifs (tete, mains, pieds) - rendus en premier (fond) */}
          {currentPaths.DECORATIVE && currentPaths.DECORATIVE.map((pathData, index) => {
            const hasStroke = pathData.stroke && parseFloat(pathData.strokeWidth || 0) > 0;
            const defaultStroke = isDark ? MUSCLE_COLORS.stroke.dark : MUSCLE_COLORS.stroke.light;
            return (
              <Path
                key={`deco-${index}`}
                d={pathData.d}
                fill={isDark ? '#4A4A4A' : '#B8B8B8'}
                stroke={hasStroke ? pathData.stroke : defaultStroke}
                strokeWidth={hasStroke ? parseFloat(pathData.strokeWidth) : 0.8}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Zones musculaires cliquables */}
          {Object.entries(currentPaths).map(([elemName, paths]) => {
            // Skip DECORATIVE - deja rendu au-dessus
            if (elemName === 'DECORATIVE') return null;

            const zoneId = ELEM_TO_ZONE[elemName];
            if (!zoneId) return null;

            const isSelected = selectedZones.has(zoneId);

            return (
              <MuscleGroup
                key={elemName}
                paths={paths}
                zoneId={zoneId}
                isSelected={isSelected}
                onPress={() => handleZonePress(zoneId)}
                isDark={isDark}
              />
            );
          })}
        </Svg>
      </View>

      {/* Instructions */}
      <Text style={[styles.legend, isDark && styles.legendDark]}>
        {instructions}
      </Text>

      {/* Badges des zones selectionnees */}
      {showLabels && selectedLabels.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesContainer}
        >
          {selectedLabels.map((label) => (
            <View key={label} style={styles.badge}>
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  toggleContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  toggleButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl + 8,
    borderRadius: theme.borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonActiveDark: {
    backgroundColor: '#444',
  },
  toggleText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  toggleTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  toggleTextDark: {
    color: '#888',
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  svgContainerLight: {
    backgroundColor: '#FAFAFA',
  },
  svgContainerDark: {
    backgroundColor: '#252525',
  },
  legend: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  legendDark: {
    color: '#999',
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});
