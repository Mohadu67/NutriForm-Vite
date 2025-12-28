import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProgram } from '../../contexts/ProgramContext';
import { useAuth } from '../../contexts/AuthContext';
import ProgramCard from '../../components/programs/ProgramCard';
import { theme } from '../../theme';

// Configuration des types de programme
const PROGRAM_TYPES = [
  { value: 'all', label: 'Tous', icon: 'grid' },
  { value: 'hiit', label: 'HIIT', icon: 'flash' },
  { value: 'circuit', label: 'Circuit', icon: 'reload' },
  { value: 'tabata', label: 'Tabata', icon: 'timer' },
  { value: 'emom', label: 'EMOM', icon: 'stopwatch' },
  { value: 'amrap', label: 'AMRAP', icon: 'trending-up' },
  { value: 'superset', label: 'Superset', icon: 'swap-horizontal' },
  { value: 'custom', label: 'Custom', icon: 'construct' },
];

// Configuration des difficultés
const DIFFICULTIES = [
  { value: 'all', label: 'Toutes' },
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
];

// Tabs
const TABS = [
  { key: 'public', label: 'Publics' },
  { key: 'my', label: 'Mes programmes' },
  { key: 'favorites', label: 'Favoris' },
];

export default function ProgramsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuth();
  const {
    programs,
    myPrograms,
    favorites,
    loading,
    error,
    isPremium,
    fetchPrograms,
    fetchMyPrograms,
    fetchFavorites,
    toggleFavorite,
    proposeProgram,
    loadFavorites,
  } = useProgram();

  const [activeTab, setActiveTab] = useState('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadFavorites();
    fetchPrograms();
    if (isPremium) {
      fetchMyPrograms();
    }
  }, [isPremium]);

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'public') {
        await fetchPrograms();
      } else if (activeTab === 'my' && isPremium) {
        await fetchMyPrograms();
      } else if (activeTab === 'favorites' && isPremium) {
        await fetchFavorites();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, isPremium]);

  // Filtrer les programmes
  const filteredPrograms = useMemo(() => {
    let data = [];

    if (activeTab === 'public') {
      data = programs;
    } else if (activeTab === 'my') {
      data = myPrograms;
    } else if (activeTab === 'favorites') {
      data = programs.filter(p => favorites.includes(p._id));
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par type
    if (selectedType !== 'all') {
      data = data.filter(p => p.type === selectedType);
    }

    // Filtre par difficulté
    if (selectedDifficulty !== 'all') {
      data = data.filter(p => p.difficulty === selectedDifficulty);
    }

    return data;
  }, [programs, myPrograms, favorites, activeTab, searchQuery, selectedType, selectedDifficulty]);

  // Naviguer vers les détails
  const handleProgramPress = useCallback((program) => {
    navigation.navigate('ProgramDetail', { programId: program._id, program });
  }, [navigation]);

  // Créer un nouveau programme
  const handleCreatePress = useCallback(() => {
    if (!isPremium) {
      // TODO: Afficher modal premium
      return;
    }
    navigation.navigate('ProgramForm', { mode: 'create' });
  }, [isPremium, navigation]);

  // Toggle favori
  const handleToggleFavorite = useCallback((programId) => {
    toggleFavorite(programId);
  }, [toggleFavorite]);

  // Modifier un programme
  const handleEditProgram = useCallback((program) => {
    navigation.navigate('ProgramForm', { mode: 'edit', program });
  }, [navigation]);

  // Proposer un programme au public
  const handleProposeProgram = useCallback(async (programId) => {
    const success = await proposeProgram(programId);
    if (success) {
      // Rafraîchir la liste
      await fetchMyPrograms();
    }
  }, [proposeProgram, fetchMyPrograms]);

  // Render item
  const renderItem = useCallback(({ item }) => {
    // L'utilisateur est propriétaire seulement pour ses propres programmes (tab "my")
    const isOwnerProgram = activeTab === 'my';

    return (
      <View style={styles.cardWrapper}>
        <ProgramCard
          program={item}
          isFavorite={favorites.includes(item._id)}
          isOwner={isOwnerProgram}
          onPress={() => handleProgramPress(item)}
          onToggleFavorite={handleToggleFavorite}
          onEdit={isOwnerProgram ? handleEditProgram : undefined}
          onPropose={isOwnerProgram ? handleProposeProgram : undefined}
        />
      </View>
    );
  }, [favorites, activeTab, handleProgramPress, handleToggleFavorite, handleEditProgram, handleProposeProgram]);

  // Key extractor
  const keyExtractor = useCallback((item) => item._id, []);

  // Empty component
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="fitness-outline"
        size={64}
        color={isDark ? '#555' : '#CCC'}
      />
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        {activeTab === 'my'
          ? 'Aucun programme créé'
          : activeTab === 'favorites'
          ? 'Aucun favori'
          : 'Aucun programme trouvé'}
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        {activeTab === 'my' && isPremium
          ? 'Créez votre premier programme personnalisé'
          : activeTab === 'favorites'
          ? 'Ajoutez des programmes à vos favoris'
          : 'Essayez de modifier vos filtres'}
      </Text>
      {activeTab === 'my' && isPremium && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePress}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.emptyButtonText}>Créer un programme</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [isDark, activeTab, isPremium, handleCreatePress]);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Programmes</Text>
          {isPremium && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
          <Ionicons
            name="search"
            size={20}
            color={isDark ? '#888' : theme.colors.text.secondary}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Rechercher un programme..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isDisabled = (tab.key === 'my' || tab.key === 'favorites') && !isPremium;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.tabActive,
                  isDisabled && styles.tabDisabled,
                ]}
                onPress={() => !isDisabled && setActiveTab(tab.key)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                    isDisabled && styles.tabTextDisabled,
                  ]}
                >
                  {tab.label}
                </Text>
                {isDisabled && (
                  <Ionicons name="lock-closed" size={12} color="#999" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Type filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {PROGRAM_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.filterChip,
              isDark && styles.filterChipDark,
              selectedType === type.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(type.value)}
          >
            <Ionicons
              name={type.icon}
              size={14}
              color={selectedType === type.value ? '#FFF' : (isDark ? '#888' : theme.colors.text.secondary)}
            />
            <Text
              style={[
                styles.filterChipText,
                isDark && styles.filterChipTextDark,
                selectedType === type.value && styles.filterChipTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Difficulty filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.difficultyContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {DIFFICULTIES.map((diff) => (
          <TouchableOpacity
            key={diff.value}
            style={[
              styles.difficultyChip,
              isDark && styles.difficultyChipDark,
              selectedDifficulty === diff.value && styles.difficultyChipActive,
            ]}
            onPress={() => setSelectedDifficulty(diff.value)}
          >
            <Text
              style={[
                styles.difficultyChipText,
                isDark && styles.difficultyChipTextDark,
                selectedDifficulty === diff.value && styles.difficultyChipTextActive,
              ]}
            >
              {diff.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, isDark && styles.resultsCountDark]}>
          {filteredPrograms.length} programme{filteredPrograms.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Loading */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* List */}
      {!loading && (
        <FlatList
          data={filteredPrograms}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={10}
          windowSize={5}
        />
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#E0E0E0',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextDisabled: {
    color: '#999',
  },
  filtersContainer: {
    maxHeight: 44,
    marginBottom: theme.spacing.xs,
  },
  difficultyContainer: {
    maxHeight: 36,
    marginBottom: theme.spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: theme.spacing.sm,
    gap: 6,
  },
  filterChipDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  filterChipTextDark: {
    color: '#888',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  difficultyChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: theme.spacing.sm,
  },
  difficultyChipDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  difficultyChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  difficultyChipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  difficultyChipTextDark: {
    color: '#888',
  },
  difficultyChipTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  resultsCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  resultsCountDark: {
    color: '#888',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  cardWrapper: {
    width: '48%',
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTextDark: {
    color: '#888',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  errorContainer: {
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
});
