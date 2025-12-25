import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { BodyPicker, ZONE_LABELS } from '../../components/BodyPicker';

// Base de donnees locale des exercices
const EXERCICES_DATA = [
  // PECTORAUX
  { id: 'bench-press', name: 'Developpe couche', muscle: 'pectoraux', secondary: ['triceps', 'epaules'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'incline-bench', name: 'Developpe incline', muscle: 'pectoraux', secondary: ['epaules', 'triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'decline-bench', name: 'Developpe decline', muscle: 'pectoraux', secondary: ['triceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-fly', name: 'Ecarte couche', muscle: 'pectoraux', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'cable-crossover', name: 'Cable crossover', muscle: 'pectoraux', secondary: [], equipment: 'poulie', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'push-ups', name: 'Pompes', muscle: 'pectoraux', secondary: ['triceps', 'epaules'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'dips-chest', name: 'Dips pectoraux', muscle: 'pectoraux', secondary: ['triceps'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },

  // DOS
  { id: 'pull-ups', name: 'Tractions', muscle: 'dos-superieur', secondary: ['biceps'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'lat-pulldown', name: 'Tirage vertical', muscle: 'dos-superieur', secondary: ['biceps'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'barbell-row', name: 'Rowing barre', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-row', name: 'Rowing haltere', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'seated-row', name: 'Tirage horizontal', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'deadlift', name: 'Souleve de terre', muscle: 'dos-inferieur', secondary: ['fessiers', 'cuisses-externes'], equipment: 'barre', difficulty: 'avance', type: 'muscu', image: null },
  { id: 'face-pull', name: 'Face pull', muscle: 'dos-superieur', secondary: ['epaules'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },

  // EPAULES
  { id: 'overhead-press', name: 'Developpe militaire', muscle: 'epaules', secondary: ['triceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-shoulder', name: 'Developpe epaules', muscle: 'epaules', secondary: ['triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'lateral-raise', name: 'Elevations laterales', muscle: 'epaules', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'front-raise', name: 'Elevations frontales', muscle: 'epaules', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'rear-delt-fly', name: 'Oiseau', muscle: 'epaules', secondary: ['dos-superieur'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'arnold-press', name: 'Arnold press', muscle: 'epaules', secondary: ['triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'shrugs', name: 'Shrugs', muscle: 'dos-superieur', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },

  // BICEPS
  { id: 'barbell-curl', name: 'Curl barre', muscle: 'biceps', secondary: [], equipment: 'barre', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'dumbbell-curl', name: 'Curl halteres', muscle: 'biceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'hammer-curl', name: 'Curl marteau', muscle: 'biceps', secondary: ['avant-bras'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'preacher-curl', name: 'Curl pupitre', muscle: 'biceps', secondary: [], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'concentration-curl', name: 'Curl concentration', muscle: 'biceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'cable-curl', name: 'Curl poulie', muscle: 'biceps', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },

  // TRICEPS
  { id: 'triceps-pushdown', name: 'Pushdown triceps', muscle: 'triceps', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'skull-crushers', name: 'Barre au front', muscle: 'triceps', secondary: [], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'overhead-triceps', name: 'Extension triceps', muscle: 'triceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'dips-triceps', name: 'Dips triceps', muscle: 'triceps', secondary: ['pectoraux'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'close-grip-bench', name: 'Developpe serre', muscle: 'triceps', secondary: ['pectoraux'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'kickback', name: 'Kickback', muscle: 'triceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },

  // JAMBES - QUADRICEPS
  { id: 'squat', name: 'Squat', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'front-squat', name: 'Front squat', muscle: 'cuisses-externes', secondary: ['abdos-centre'], equipment: 'barre', difficulty: 'avance', type: 'muscu', image: null },
  { id: 'leg-press', name: 'Presse a cuisses', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'leg-extension', name: 'Leg extension', muscle: 'cuisses-externes', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'lunges', name: 'Fentes', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'bulgarian-split', name: 'Split squat bulgare', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },

  // JAMBES - ISCHIO
  { id: 'leg-curl', name: 'Leg curl', muscle: 'cuisses-internes', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'romanian-deadlift', name: 'Souleve de terre roumain', muscle: 'cuisses-internes', secondary: ['fessiers', 'dos-inferieur'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'good-morning', name: 'Good morning', muscle: 'cuisses-internes', secondary: ['dos-inferieur'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },

  // FESSIERS
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'glute-bridge', name: 'Pont fessier', muscle: 'fessiers', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'cable-kickback', name: 'Kickback fessier', muscle: 'fessiers', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'sumo-squat', name: 'Squat sumo', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },

  // MOLLETS
  { id: 'standing-calf', name: 'Mollets debout', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'seated-calf', name: 'Mollets assis', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'calf-press', name: 'Presse mollets', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },

  // ABDOS
  { id: 'crunch', name: 'Crunch', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'plank', name: 'Planche', muscle: 'abdos-centre', secondary: ['abdos-lateraux'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'leg-raise', name: 'Releve de jambes', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'russian-twist', name: 'Russian twist', muscle: 'abdos-lateraux', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'bicycle-crunch', name: 'Crunch bicyclette', muscle: 'abdos-lateraux', secondary: ['abdos-centre'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'cable-crunch', name: 'Crunch poulie', muscle: 'abdos-centre', secondary: [], equipment: 'poulie', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'ab-wheel', name: 'Roue abdominale', muscle: 'abdos-centre', secondary: [], equipment: 'accessoire', difficulty: 'avance', type: 'poids_du_corps', image: null },

  // CARDIO
  { id: 'running', name: 'Course a pied', muscle: 'cardio', secondary: ['cuisses-externes', 'mollets'], equipment: 'aucun', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'cycling', name: 'Velo', muscle: 'cardio', secondary: ['cuisses-externes'], equipment: 'velo', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'rowing-machine', name: 'Rameur', muscle: 'cardio', secondary: ['dos-inferieur', 'biceps'], equipment: 'rameur', difficulty: 'intermediaire', type: 'cardio', image: null },
  { id: 'jump-rope', name: 'Corde a sauter', muscle: 'cardio', secondary: ['mollets'], equipment: 'corde', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'burpees', name: 'Burpees', muscle: 'cardio', secondary: ['pectoraux', 'cuisses-externes'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'cardio', image: null },
];

// Mapping muscles vers zones body picker
const MUSCLE_TO_ZONE = {
  'pectoraux': 'pectoraux',
  'dos-superieur': 'dos-superieur',
  'dos-inferieur': 'dos-inferieur',
  'epaules': 'epaules',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'avant-bras': 'avant-bras',
  'cuisses-externes': 'cuisses-externes',
  'cuisses-internes': 'cuisses-internes',
  'fessiers': 'fessiers',
  'mollets': 'mollets',
  'abdos-centre': 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux',
};

const EQUIPMENT_LABELS = {
  'barre': 'Barre',
  'halteres': 'Halteres',
  'poulie': 'Poulie',
  'machine': 'Machine',
  'poids_corps': 'Poids du corps',
  'aucun': 'Aucun',
  'velo': 'Velo',
  'rameur': 'Rameur',
  'corde': 'Corde',
  'accessoire': 'Accessoire',
};

const DIFFICULTY_LABELS = {
  'debutant': { label: 'Debutant', color: '#22C55E' },
  'intermediaire': { label: 'Intermediaire', color: '#F59E0B' },
  'avance': { label: 'Avance', color: '#EF4444' },
};

export default function ExercicesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [showBodyPicker, setShowBodyPicker] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Filtrer les exercices
  const filteredExercices = useMemo(() => {
    let results = [...EXERCICES_DATA];

    // Filtre par recherche
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      results = results.filter(ex =>
        ex.name.toLowerCase().includes(search) ||
        ex.muscle.toLowerCase().includes(search)
      );
    }

    // Filtre par muscles selectionnes
    if (selectedMuscles.length > 0) {
      results = results.filter(ex => {
        const exZone = MUSCLE_TO_ZONE[ex.muscle];
        if (selectedMuscles.includes(exZone)) return true;
        // Verifier aussi les muscles secondaires
        return ex.secondary?.some(sec => selectedMuscles.includes(MUSCLE_TO_ZONE[sec]));
      });
    }

    // Filtre par equipement
    if (selectedEquipment) {
      results = results.filter(ex => ex.equipment === selectedEquipment);
    }

    return results;
  }, [searchText, selectedMuscles, selectedEquipment]);

  const handleExercicePress = useCallback((exercice) => {
    navigation.navigate('ExerciceDetail', { exercice });
  }, [navigation]);

  const handleApplyFilter = useCallback(() => {
    setShowBodyPicker(false);
  }, []);

  const handleClearMuscles = useCallback(() => {
    setSelectedMuscles([]);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedMuscles([]);
    setSearchText('');
    setSelectedEquipment(null);
  }, []);

  // Render exercice item
  const renderExercice = ({ item }) => {
    const difficulty = DIFFICULTY_LABELS[item.difficulty];
    const muscleLabel = ZONE_LABELS[MUSCLE_TO_ZONE[item.muscle]] || item.muscle;

    return (
      <TouchableOpacity
        style={[styles.exerciceCard, isDark && styles.exerciceCardDark]}
        onPress={() => handleExercicePress(item)}
        activeOpacity={0.7}
      >
        {/* Image placeholder */}
        <View style={[styles.exerciceImage, isDark && styles.exerciceImageDark]}>
          <Ionicons
            name={item.type === 'cardio' ? 'heart' : item.type === 'poids_du_corps' ? 'body' : 'barbell'}
            size={32}
            color={theme.colors.primary}
          />
        </View>

        {/* Info */}
        <View style={styles.exerciceInfo}>
          <Text style={[styles.exerciceName, isDark && styles.exerciceNameDark]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.exerciceMuscle, isDark && styles.exerciceMuscleDark]}>
            {muscleLabel}
          </Text>
          <View style={styles.exerciceTags}>
            <View style={[styles.difficultyTag, { backgroundColor: `${difficulty.color}20` }]}>
              <Text style={[styles.difficultyText, { color: difficulty.color }]}>
                {difficulty.label}
              </Text>
            </View>
            <Text style={[styles.equipmentText, isDark && styles.equipmentTextDark]}>
              {EQUIPMENT_LABELS[item.equipment]}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Exercices</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          {filteredExercices.length} exercice{filteredExercices.length !== 1 ? 's' : ''} disponible{filteredExercices.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, isDark && styles.cardDark]}>
        <Ionicons name="search" size={20} color={isDark ? '#888' : theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Rechercher un exercice..."
          placeholderTextColor={isDark ? '#888' : theme.colors.text.tertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#888' : theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter by muscle */}
      <TouchableOpacity
        style={[styles.filterButton, isDark && styles.cardDark]}
        onPress={() => setShowBodyPicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.filterButtonContent}>
          <Ionicons name="body" size={24} color={theme.colors.primary} />
          <View style={styles.filterTextContainer}>
            <Text style={[styles.filterTitle, isDark && styles.textDark]}>
              Filtrer par muscle
            </Text>
            <Text style={[styles.filterSubtitle, isDark && styles.subtitleDark]} numberOfLines={1}>
              {selectedMuscles.length > 0
                ? selectedMuscles.map(id => ZONE_LABELS[id]).join(', ')
                : 'Selectionne les zones a travailler'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : theme.colors.text.tertiary} />
      </TouchableOpacity>

      {/* Selected filters chips */}
      {(selectedMuscles.length > 0 || selectedEquipment) && (
        <View style={styles.filtersContainer}>
          <ScrollViewHorizontal style={styles.chipsScroll}>
            {selectedMuscles.map((muscleId) => (
              <TouchableOpacity
                key={muscleId}
                style={styles.filterChip}
                onPress={() => setSelectedMuscles(prev => prev.filter(id => id !== muscleId))}
              >
                <Text style={styles.filterChipText}>{ZONE_LABELS[muscleId]}</Text>
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            ))}
            {selectedEquipment && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => setSelectedEquipment(null)}
              >
                <Text style={styles.filterChipText}>{EQUIPMENT_LABELS[selectedEquipment]}</Text>
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearAllChip} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </ScrollViewHorizontal>
        </View>
      )}

      {/* Results header */}
      <Text style={[styles.resultsHeader, isDark && styles.resultsHeaderDark]}>
        {selectedMuscles.length > 0 || searchText ? 'Resultats' : 'Tous les exercices'}
      </Text>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={isDark ? '#555' : '#CCC'} />
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        Aucun exercice trouve
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        Essaie de modifier tes filtres ou ta recherche
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleClearAll}>
        <Text style={styles.emptyButtonText}>Effacer les filtres</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <FlatList
        data={filteredExercices}
        keyExtractor={(item) => item.id}
        renderItem={renderExercice}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal Body Picker */}
      <Modal
        visible={showBodyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBodyPicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.containerDark]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
            <TouchableOpacity onPress={() => setShowBodyPicker(false)}>
              <Ionicons name="close" size={28} color={isDark ? '#FFF' : theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              Selectionner les muscles
            </Text>
            <TouchableOpacity onPress={handleClearMuscles}>
              <Text style={styles.modalReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Body Picker */}
          <FlatList
            data={[1]}
            keyExtractor={() => 'body-picker'}
            renderItem={() => (
              <View style={styles.bodyPickerContainer}>
                <BodyPicker
                  value={selectedMuscles}
                  onChange={setSelectedMuscles}
                  multiple={true}
                  showLabels={true}
                  height={380}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />

          {/* Apply Button */}
          <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilter}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>
                {selectedMuscles.length > 0
                  ? `Voir ${filteredExercices.length} exercice${filteredExercices.length !== 1 ? 's' : ''}`
                  : 'Voir tous les exercices'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Horizontal ScrollView component
const ScrollViewHorizontal = ({ children, style }) => {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}>
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  subtitleDark: {
    color: '#888888',
  },
  textDark: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  filterTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  filterSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: theme.spacing.md,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  clearAllChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}26`,
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
  },
  resultsHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  resultsHeaderDark: {
    color: '#FFFFFF',
  },
  exerciceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciceCardDark: {
    backgroundColor: '#2A2A2A',
  },
  exerciceImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  exerciceImageDark: {
    backgroundColor: `${theme.colors.primary}25`,
  },
  exerciceInfo: {
    flex: 1,
  },
  exerciceName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  exerciceNameDark: {
    color: '#FFFFFF',
  },
  exerciceMuscle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: 2,
  },
  exerciceMuscleDark: {
    color: theme.colors.primary,
  },
  exerciceTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  difficultyTag: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  equipmentText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  equipmentTextDark: {
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#888',
  },
  emptyButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalHeaderDark: {
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalReset: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  bodyPickerContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  modalFooterDark: {
    borderTopColor: '#333',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
