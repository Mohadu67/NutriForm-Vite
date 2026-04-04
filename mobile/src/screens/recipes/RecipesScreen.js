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

import { useRecipe } from '../../contexts/RecipeContext';
import { useAuth } from '../../contexts/AuthContext';
import useRecipeFilters from '../../hooks/useRecipeFilters';
import RecipeCard from '../../components/recipes/RecipeCard';
import logger from '../../services/logger';

const CUISINE_OPTIONS = [
  { value: 'francaise', label: 'Francaise', icon: 'flag-outline' },
  { value: 'italienne', label: 'Italienne', icon: 'pizza-outline' },
  { value: 'asiatique', label: 'Asiatique', icon: 'restaurant-outline' },
  { value: 'mexicaine', label: 'Mexicaine', icon: 'flame-outline' },
  { value: 'americaine', label: 'Americaine', icon: 'fast-food-outline' },
  { value: 'mediterraneenne', label: 'Mediterraneenne', icon: 'leaf-outline' },
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
  { value: 'vegetarien', label: 'Vegetarien', icon: 'nutrition-outline' },
  { value: 'vegan', label: 'Vegan', icon: 'leaf-outline' },
  { value: 'sans-gluten', label: 'Sans gluten', icon: 'warning-outline' },
  { value: 'sans-lactose', label: 'Sans lactose', icon: 'water-outline' },
  { value: 'paleo', label: 'Paleo', icon: 'fitness-outline' },
  { value: 'keto', label: 'Keto', icon: 'flash-outline' },
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
    logger.app.debug('[RecipesScreen] Loading recipes...');
    const result = await fetchRecipes({ limit: 100 });
    logger.app.debug('[RecipesScreen] Recipes loaded:', result?.length || 0);
  };

  const loadMyRecipes = async () => {
    logger.app.debug('[RecipesScreen] Loading my recipes...');
    const result = await fetchMyRecipes();
    logger.app.debug('[RecipesScreen] My recipes loaded:', result?.length || 0);
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
        'La creation de recettes est une fonctionnalite Premium. Passez a Premium pour creer vos propres recettes et les partager avec la communaute.',
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
            <Text style={[styles.title, isDark && styles.titleDark]}>Recettes</Text>
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
      <View style={[styles.tabsContainer, isDark && styles.tabsContainerDark]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && styles.tabActive,
            isDark && activeTab === 'all' && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'all' && styles.tabTextActive,
            isDark && activeTab !== 'all' && styles.tabTextDark,
          ]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my' && styles.tabActive,
            isDark && activeTab === 'my' && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'my' && styles.tabTextActive,
            isDark && activeTab !== 'my' && styles.tabTextDark,
          ]}>
            Mes recettes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
        <Ionicons name="search" size={20} color={isDark ? '#7a7a88' : '#a8a29e'} />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Rechercher une recette..."
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#7a7a88' : '#a8a29e'} />
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
              <Ionicons
                name={cuisine.icon}
                size={16}
                color={isSelected ? '#72baa1' : (isDark ? '#c1c1cb' : '#78716c')}
                style={styles.cuisineIcon}
              />
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
        <Ionicons name="options" size={18} color="#72baa1" />
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
          <ActivityIndicator size="large" color="#72baa1" />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
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
        contentContainerStyle={[styles.listContent, isDark && styles.listContentDark]}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#72baa1"
            colors={['#72baa1']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#a8a29e" />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Aucune recette trouvee
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Reinitialiser les filtres</Text>
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
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Ionicons name="close" size={28} color={isDark ? '#f3f3f6' : '#1c1917'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Difficulty */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]}>Difficulte</Text>
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
              <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]}>Temps de cuisson</Text>
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
              <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]}>Regime alimentaire</Text>
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
                      <Ionicons
                        name={diet.icon}
                        size={16}
                        color={isSelected ? '#72baa1' : (isDark ? '#c1c1cb' : '#78716c')}
                        style={styles.dietIcon}
                      />
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
                  color={showFavoritesOnly ? '#EF4444' : (isDark ? '#7a7a88' : '#78716c')}
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
          <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
            <TouchableOpacity
              style={[styles.clearButton, isDark && styles.clearButtonDark]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, isDark && styles.clearButtonTextDark]}>
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
    backgroundColor: '#fcfbf9',
  },
  containerDark: {
    backgroundColor: '#0e0e11',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#78716c',
  },
  loadingTextDark: {
    color: '#c1c1cb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleDark: {
    color: '#f3f3f6',
  },
  subtitle: {
    fontSize: 13,
    color: '#78716c',
  },
  subtitleDark: {
    color: '#7a7a88',
  },
  textMutedDark: {
    color: '#7a7a88',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#72baa1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f5f5f4',
    borderRadius: 14,
    padding: 4,
  },
  tabsContainerDark: {
    backgroundColor: '#1f1f26',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabActiveDark: {
    backgroundColor: '#18181d',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#78716c',
  },
  tabTextDark: {
    color: '#7a7a88',
  },
  tabTextActive: {
    color: '#72baa1',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efedea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchBarDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1c1917',
  },
  searchInputDark: {
    color: '#f3f3f6',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716c',
  },
  clearSectionText: {
    fontSize: 13,
    color: '#72baa1',
    fontWeight: '500',
  },
  cuisineScroll: {
    marginBottom: 16,
  },
  cuisineScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  cuisineChipSelected: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(114,186,161,0.3)',
  },
  chipDark: {
    backgroundColor: '#1f1f26',
  },
  cuisineIcon: {
    marginRight: 6,
  },
  cuisineText: {
    fontSize: 13,
    color: '#78716c',
    fontWeight: '500',
  },
  cuisineTextSelected: {
    color: '#72baa1',
  },
  chipTextDark: {
    color: '#c1c1cb',
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  moreFiltersButtonDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  moreFiltersText: {
    fontSize: 13,
    color: '#72baa1',
    fontWeight: '500',
    marginLeft: 6,
  },
  filterBadge: {
    backgroundColor: '#f0a47a',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 8,
    backgroundColor: '#fcfbf9',
  },
  listContentDark: {
    backgroundColor: '#0e0e11',
  },
  row: {
    gap: 10,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#78716c',
    marginTop: 16,
  },
  emptyTextDark: {
    color: '#c1c1cb',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#72baa1',
    borderRadius: 12,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fcfbf9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  modalHeaderDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1917',
  },
  modalTitleDark: {
    color: '#f3f3f6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1917',
    marginBottom: 10,
  },
  filterLabelDark: {
    color: '#f3f3f6',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#fff',
  },
  filterOptionDark: {
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#18181d',
  },
  filterOptionSelected: {
    borderColor: 'rgba(114,186,161,0.3)',
    backgroundColor: 'rgba(114,186,161,0.12)',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#78716c',
    fontWeight: '500',
  },
  filterOptionTextDark: {
    color: '#c1c1cb',
  },
  filterOptionTextSelected: {
    color: '#72baa1',
    fontWeight: '600',
  },
  filterOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#fff',
  },
  filterOptionChipSelected: {
    borderColor: 'rgba(114,186,161,0.3)',
    backgroundColor: 'rgba(114,186,161,0.12)',
  },
  dietIcon: {
    marginRight: 6,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#fff',
  },
  favoritesToggleActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  favoritesToggleText: {
    fontSize: 15,
    color: '#1c1917',
    fontWeight: '500',
    marginLeft: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#efedea',
  },
  modalFooterDark: {
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efedea',
    alignItems: 'center',
  },
  clearButtonDark: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  clearButtonText: {
    fontSize: 15,
    color: '#78716c',
    fontWeight: '600',
  },
  clearButtonTextDark: {
    color: '#c1c1cb',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#72baa1',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
