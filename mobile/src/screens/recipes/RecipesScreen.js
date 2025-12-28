import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { useRecipe } from '../../contexts/RecipeContext';
import { useAuth } from '../../contexts/AuthContext';
import useRecipeFilters from '../../hooks/useRecipeFilters';
import RecipeCard from '../../components/recipes/RecipeCard';

const CUISINE_OPTIONS = [
  { value: 'francaise', label: 'Française', icon: '🇫🇷' },
  { value: 'italienne', label: 'Italienne', icon: '🇮🇹' },
  { value: 'asiatique', label: 'Asiatique', icon: '🥢' },
  { value: 'mexicaine', label: 'Mexicaine', icon: '🌮' },
  { value: 'americaine', label: 'Américaine', icon: '🍔' },
  { value: 'mediterraneenne', label: 'Méditerranéenne', icon: '🫒' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Facile', color: '#22C55E' },
  { value: 'medium', label: 'Moyen', color: '#F59E0B' },
  { value: 'hard', label: 'Difficile', color: '#EF4444' },
];

const COOKING_TIME_OPTIONS = [
  { value: '15', label: '< 15 min' },
  { value: '30', label: '< 30 min' },
  { value: '60', label: '< 1h' },
  { value: '120', label: '< 2h' },
];

const DIETARY_OPTIONS = [
  { value: 'vegetarien', label: 'Végétarien', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'sans-gluten', label: 'Sans gluten', icon: '🌾' },
  { value: 'sans-lactose', label: 'Sans lactose', icon: '🥛' },
  { value: 'paleo', label: 'Paléo', icon: '🥩' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
];

export default function RecipesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  const {
    recipes,
    myRecipes,
    favorites,
    loading,
    error,
    isPremium,
    fetchRecipes,
    fetchMyRecipes,
    toggleFavorite,
    loadFavorites,
  } = useRecipe();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
  const [refreshing, setRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Determine which recipes to show based on active tab
  const displayedRecipes = activeTab === 'my' ? myRecipes : recipes;

  // Use filters hook
  const {
    searchText,
    selectedCuisines,
    selectedDifficulty,
    selectedCookingTime,
    selectedDietary,
    showFavoritesOnly,
    setSearchText,
    setSelectedCuisines,
    setSelectedDifficulty,
    setSelectedCookingTime,
    setSelectedDietary,
    setShowFavoritesOnly,
    filteredRecipes,
    activeFiltersCount,
    clearFilters,
  } = useRecipeFilters({ recipes: displayedRecipes, favorites });

  useEffect(() => {
    loadData();
    loadFavorites();
  }, []);

  // Load myRecipes when switching to 'my' tab
  useEffect(() => {
    if (activeTab === 'my' && myRecipes.length === 0) {
      loadMyRecipes();
    }
  }, [activeTab]);

  const loadData = async () => {
    console.log('[RecipesScreen] Loading recipes...');
    const result = await fetchRecipes({ limit: 100 });
    console.log('[RecipesScreen] Recipes loaded:', result?.length || 0);
  };

  const loadMyRecipes = async () => {
    console.log('[RecipesScreen] Loading my recipes...');
    const result = await fetchMyRecipes();
    console.log('[RecipesScreen] My recipes loaded:', result?.length || 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'my') {
      await loadMyRecipes();
    } else {
      await loadData();
    }
    setRefreshing(false);
  };

  const handleRecipePress = useCallback((recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe._id });
  }, [navigation]);

  const handleCreateRecipe = useCallback(() => {
    if (!isPremium) {
      Alert.alert(
        'Premium Requis',
        'La création de recettes est une fonctionnalité Premium. Passez à Premium pour créer vos propres recettes et les partager avec la communauté.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'En savoir plus',
            onPress: () => navigation.navigate('ProfileTab', { screen: 'Subscription' }),
          },
        ]
      );
      return;
    }
    navigation.navigate('RecipeForm', { mode: 'create' });
  }, [isPremium, navigation]);

  const toggleCuisine = useCallback((cuisine) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  }, [setSelectedCuisines]);

  const toggleDietary = useCallback((dietary) => {
    setSelectedDietary(prev =>
      prev.includes(dietary)
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
  }, [setSelectedDietary]);

  const renderRecipe = useCallback(({ item }) => (
    <RecipeCard
      recipe={item}
      isFavorite={favorites.includes(item._id)}
      onPress={() => handleRecipePress(item)}
      onToggleFavorite={() => toggleFavorite(item._id)}
    />
  ), [favorites, handleRecipePress, toggleFavorite]);

  const ListHeader = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, isDark && styles.textDark]}>Recettes</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {filteredRecipes.length} recette{filteredRecipes.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Create button (Premium) */}
          <TouchableOpacity
            style={[styles.createButton, !isPremium && styles.createButtonDisabled]}
            onPress={handleCreateRecipe}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.tabActive,
            isDark && styles.tabDark,
            isDark && activeTab === 'all' && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'all' && styles.tabTextActive,
            isDark && styles.tabTextDark,
          ]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my' && styles.tabActive,
            isDark && styles.tabDark,
            isDark && activeTab === 'my' && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'my' && styles.tabTextActive,
            isDark && styles.tabTextDark,
          ]}>
            Mes recettes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, isDark && styles.cardDark]}>
        <Ionicons name="search" size={20} color={isDark ? '#888' : theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Rechercher une recette..."
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

      {/* Cuisine filter tabs */}
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, isDark && styles.textMutedDark]}>Cuisine</Text>
        {selectedCuisines.length > 0 && (
          <TouchableOpacity onPress={() => setSelectedCuisines([])}>
            <Text style={styles.clearSectionText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cuisineScroll}
        contentContainerStyle={styles.cuisineScrollContent}
      >
        {CUISINE_OPTIONS.map(cuisine => {
          const isSelected = selectedCuisines.includes(cuisine.value);
          return (
            <TouchableOpacity
              key={cuisine.value}
              style={[
                styles.cuisineChip,
                isSelected && styles.cuisineChipSelected,
                isDark && !isSelected && styles.chipDark,
              ]}
              onPress={() => toggleCuisine(cuisine.value)}
            >
              <Text style={styles.cuisineIcon}>{cuisine.icon}</Text>
              <Text style={[
                styles.cuisineText,
                isSelected && styles.cuisineTextSelected,
                isDark && !isSelected && styles.chipTextDark,
              ]}>
                {cuisine.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* More filters button */}
      <TouchableOpacity
        style={[styles.moreFiltersButton, isDark && styles.moreFiltersButtonDark]}
        onPress={() => setShowFiltersModal(true)}
      >
        <Ionicons name="options" size={18} color={theme.colors.primary} />
        <Text style={styles.moreFiltersText}>
          Plus de filtres
        </Text>
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  ), [
    isDark,
    filteredRecipes.length,
    searchText,
    selectedCuisines,
    activeFiltersCount,
    isPremium,
    activeTab,
    handleCreateRecipe,
    toggleCuisine,
  ]);

  if (loading && recipes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.textDark]}>
            Chargement des recettes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipe}
        keyExtractor={item => item._id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={isDark ? '#555' : '#CCC'} />
            <Text style={[styles.emptyText, isDark && styles.textDark]}>
              Aucune recette trouvée
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.containerDark]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Difficulty */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, isDark && styles.textDark]}>Difficulté</Text>
              <View style={styles.filterOptions}>
                {DIFFICULTY_OPTIONS.map(diff => {
                  const isSelected = selectedDifficulty === diff.value;
                  return (
                    <TouchableOpacity
                      key={diff.value}
                      style={[
                        styles.filterOption,
                        isSelected && [styles.filterOptionSelected, { borderColor: diff.color }],
                        isDark && !isSelected && styles.filterOptionDark,
                      ]}
                      onPress={() => setSelectedDifficulty(isSelected ? null : diff.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                        isDark && !isSelected && styles.filterOptionTextDark,
                      ]}>
                        {diff.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cooking Time */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, isDark && styles.textDark]}>Temps de cuisson</Text>
              <View style={styles.filterOptions}>
                {COOKING_TIME_OPTIONS.map(time => {
                  const isSelected = selectedCookingTime === time.value;
                  return (
                    <TouchableOpacity
                      key={time.value}
                      style={[
                        styles.filterOption,
                        isSelected && styles.filterOptionSelected,
                        isDark && !isSelected && styles.filterOptionDark,
                      ]}
                      onPress={() => setSelectedCookingTime(isSelected ? null : time.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                        isDark && !isSelected && styles.filterOptionTextDark,
                      ]}>
                        {time.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dietary */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, isDark && styles.textDark]}>Régime alimentaire</Text>
              <View style={styles.filterOptionsWrap}>
                {DIETARY_OPTIONS.map(diet => {
                  const isSelected = selectedDietary.includes(diet.value);
                  return (
                    <TouchableOpacity
                      key={diet.value}
                      style={[
                        styles.filterOptionChip,
                        isSelected && styles.filterOptionChipSelected,
                        isDark && !isSelected && styles.filterOptionDark,
                      ]}
                      onPress={() => toggleDietary(diet.value)}
                    >
                      <Text style={styles.dietIcon}>{diet.icon}</Text>
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                        isDark && !isSelected && styles.filterOptionTextDark,
                      ]}>
                        {diet.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Favorites Only */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[
                  styles.favoritesToggle,
                  showFavoritesOnly && styles.favoritesToggleActive,
                  isDark && !showFavoritesOnly && styles.filterOptionDark,
                ]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Ionicons
                  name={showFavoritesOnly ? 'heart' : 'heart-outline'}
                  size={24}
                  color={showFavoritesOnly ? '#EF4444' : (isDark ? '#888' : '#666')}
                />
                <Text style={[
                  styles.favoritesToggleText,
                  isDark && !showFavoritesOnly && styles.filterOptionTextDark,
                ]}>
                  Favoris uniquement
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, isDark && styles.modalHeaderDark]}>
            <TouchableOpacity
              style={[styles.clearButton, isDark && styles.clearButtonDark]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, isDark && styles.textDark]}>
                Effacer tout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.applyButtonText}>
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: '#666',
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  subtitleDark: {
    color: '#888',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: '#F0F0F0',
    borderRadius: theme.borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tabDark: {
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...theme.shadows.sm,
  },
  tabActiveDark: {
    backgroundColor: '#374151',
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: '#666',
  },
  tabTextDark: {
    color: '#999',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: '#1a1a1a',
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterSectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: '#666',
  },
  clearSectionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  cuisineScroll: {
    marginBottom: theme.spacing.md,
  },
  cuisineScrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cuisineChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipDark: {
    backgroundColor: '#2A2A2A',
  },
  cuisineIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  cuisineText: {
    fontSize: theme.fontSize.sm,
    color: '#1a1a1a',
    fontWeight: theme.fontWeight.medium,
  },
  cuisineTextSelected: {
    color: '#FFFFFF',
  },
  chipTextDark: {
    color: '#FFFFFF',
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  moreFiltersButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  moreFiltersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: '#666',
    marginTop: theme.spacing.md,
  },
  clearFiltersButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalHeaderDark: {
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginBottom: theme.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  filterOptionDark: {
    borderColor: '#333',
    backgroundColor: '#2A2A2A',
  },
  filterOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  filterOptionText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  filterOptionTextDark: {
    color: '#FFFFFF',
  },
  filterOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semiBold,
  },
  filterOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  filterOptionChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  dietIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  favoritesToggleActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  favoritesToggleText: {
    fontSize: theme.fontSize.md,
    color: '#1a1a1a',
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  clearButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  clearButtonDark: {
    borderColor: '#333',
  },
  clearButtonText: {
    fontSize: theme.fontSize.md,
    color: '#666',
    fontWeight: theme.fontWeight.semiBold,
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semiBold,
  },
});
