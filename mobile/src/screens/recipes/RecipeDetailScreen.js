import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRecipe } from '../../contexts/RecipeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import {
  NutritionCard,
  IngredientList,
  InstructionsList,
} from '../../components/recipes';

const { width } = Dimensions.get('window');

const RecipeDetailScreen = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    recipes,
    favorites,
    saved,
    loading,
    isPremium,
    fetchRecipeById,
    toggleFavorite,
    toggleSaved,
    deleteRecipe,
    proposeRecipe,
    unpublishRecipe,
  } = useRecipe();

  const { user } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    loadRecipeDetail();
  }, [recipeId]);

  const loadRecipeDetail = async () => {
    setLoadingDetail(true);
    try {
      // Always fetch from API to get full details (ingredients & instructions)
      // The list view excludes these fields for performance
      const result = await fetchRecipeById(recipeId);
      if (result) {
        console.log('[RecipeDetail] Recipe loaded:', {
          title: result.title,
          hasIngredients: !!result.ingredients,
          ingredientsCount: result.ingredients?.length,
          hasInstructions: !!result.instructions,
          instructionsCount: result.instructions?.length,
        });
        setRecipe(result);
      } else {
        Alert.alert('Erreur', 'Recette introuvable');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Erreur', 'Impossible de charger la recette');
      navigation.goBack();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour aimer une recette',
        [{ text: 'OK' }]
      );
      return;
    }

    await toggleFavorite(recipeId);
    // Update local state
    if (recipe) {
      setRecipe({
        ...recipe,
        likesCount: favorites.includes(recipeId)
          ? (recipe.likesCount || 0) - 1
          : (recipe.likesCount || 0) + 1,
      });
    }
  };

  const handleToggleSaved = async () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour enregistrer une recette',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isPremium) {
      Alert.alert(
        'Premium requis',
        'L\'enregistrement de recettes est une fonctionnalité premium. Passez à Premium pour accéder à cette fonctionnalité.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Voir Premium',
            onPress: () => navigation.navigate('Subscription'),
          },
        ]
      );
      return;
    }

    await toggleSaved(recipeId);
  };

  const handleEdit = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium requis',
        'La modification de recettes est une fonctionnalité premium.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Si la recette est publique, prévenir que la modification la repassera en validation
    if (recipe.status === 'public') {
      Alert.alert(
        'Modifier une recette publique',
        'Cette recette est actuellement publique. Si vous la modifiez, elle repassera en mode "En attente" et devra être re-validée par l\'équipe avant d\'être à nouveau publique.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer',
            onPress: () => {
              navigation.navigate('RecipeForm', {
                mode: 'edit',
                recipe,
              });
            },
          },
        ]
      );
    } else {
      navigation.navigate('RecipeForm', {
        mode: 'edit',
        recipe,
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la recette',
      'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRecipe(recipeId);
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handlePropose = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium requis',
        'La proposition de recettes au public est une fonctionnalité premium.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Proposer au public',
      'Voulez-vous proposer cette recette pour publication publique ? Elle sera examinée par notre équipe.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Proposer',
          onPress: async () => {
            const success = await proposeRecipe(recipeId);
            if (success) {
              Alert.alert(
                'Succès',
                'Votre recette a été proposée avec succès. Vous serez notifié une fois examinée.',
                [{ text: 'OK' }]
              );
              loadRecipeDetail();
            }
          },
        },
      ]
    );
  };

  const handleUnpublish = async () => {
    Alert.alert(
      'Dépublier la recette',
      'Voulez-vous retirer cette recette de la publication publique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dépublier',
          onPress: async () => {
            const success = await unpublishRecipe(recipeId);
            if (success) {
              Alert.alert('Succès', 'Recette dépubliée avec succès');
              loadRecipeDetail();
            }
          },
        },
      ]
    );
  };

  if (loadingDetail || !recipe) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          Chargement...
        </Text>
      </View>
    );
  }

  const isFavorite = favorites.includes(recipeId);
  const isSaved = saved.includes(recipeId);

  // Check if user owns this recipe (author can be ObjectId or populated object)
  // IMPORTANT: Only user-created recipes (createdBy === 'user') can be edited
  const authorId = recipe.author?._id || recipe.author;
  const isUserCreated = recipe.createdBy === 'user';
  const isOwnRecipe = user && authorId && isUserCreated && (
    authorId.toString() === user._id?.toString() ||
    authorId === user._id ||
    authorId.toString() === user.id?.toString()
  );

  const canEdit = isOwnRecipe && isPremium;
  const canPropose = isOwnRecipe && isPremium && recipe.status === 'private';
  const canUnpublish = isOwnRecipe && isPremium && (recipe.status === 'public' || recipe.status === 'pending');

  // Debug logging
  console.log('[RecipeDetail] Owner check:', {
    recipeTitle: recipe.title,
    userId: user?._id || user?.id,
    authorId: authorId,
    createdBy: recipe.createdBy,
    isUserCreated,
    isOwnRecipe,
    isPremium,
    status: recipe.status,
    canEdit,
    canPropose,
    canUnpublish,
  });

  // Prepare nutrition data
  const nutrition = {
    calories: recipe.nutrition?.calories || 0,
    proteins: recipe.nutrition?.proteins || 0,
    carbs: recipe.nutrition?.carbs || 0,
    fats: recipe.nutrition?.fats || 0,
  };

  // Get difficulty info
  const getDifficultyInfo = (difficulty) => {
    const difficultyMap = {
      easy: { label: 'Facile', color: '#22C55E' },
      medium: { label: 'Moyen', color: '#F59E0B' },
      hard: { label: 'Difficile', color: '#EF4444' },
      // Support legacy French values too
      facile: { label: 'Facile', color: '#22C55E' },
      moyen: { label: 'Moyen', color: '#F59E0B' },
      difficile: { label: 'Difficile', color: '#EF4444' },
    };
    return difficultyMap[difficulty] || difficultyMap.medium;
  };

  const difficultyInfo = getDifficultyInfo(recipe.difficulty);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: recipe.image || 'https://via.placeholder.com/400x300' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.actionButton, isFavorite && styles.actionButtonActive]}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#EF4444' : '#FFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isSaved && styles.actionButtonActive]}
              onPress={handleToggleSaved}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? theme.colors.primary : '#FFF'}
              />
            </TouchableOpacity>
          </View>

          {/* Title Overlay */}
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            {recipe.createdBy && (
              <Text style={styles.heroAuthor}>
                Par {recipe.createdBy.firstName} {recipe.createdBy.lastName}
              </Text>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={[styles.content, isDark && styles.contentDark]}>
          {/* Description */}
          {recipe.description && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.description, isDark && styles.descriptionDark]}>
                {recipe.description}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={[styles.statsContainer, isDark && styles.statsContainerDark]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Préparation
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.prepTime || 0} min
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Cuisson
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.cookTime || 0} min
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Portions
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.servings || 1}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: difficultyInfo.color },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {difficultyInfo.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Nutrition Card */}
          <NutritionCard nutrition={nutrition} />

          {/* Ingredients List */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <IngredientList
              ingredients={recipe.ingredients}
              servings={recipe.servings || 1}
            />
          )}

          {/* Instructions List */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <InstructionsList instructions={recipe.instructions} />
          )}

          {/* Tags Section */}
          {(recipe.cuisine || recipe.mealType || recipe.dietary?.length > 0) && (
            <View style={[styles.tagsSection, isDark && styles.tagsSectionDark]}>
              <Text style={[styles.tagsTitle, isDark && styles.tagsTitleDark]}>
                Tags
              </Text>
              <View style={styles.tagsContainer}>
                {recipe.cuisine && (
                  <View style={[styles.tag, isDark && styles.tagDark]}>
                    <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                      {recipe.cuisine}
                    </Text>
                  </View>
                )}
                {recipe.mealType && (
                  <View style={[styles.tag, isDark && styles.tagDark]}>
                    <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                      {recipe.mealType}
                    </Text>
                  </View>
                )}
                {recipe.dietary?.map((item, index) => (
                  <View key={index} style={[styles.tag, isDark && styles.tagDark]}>
                    <Text style={[styles.tagText, isDark && styles.tagTextDark]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Owner Actions */}
          {isOwnRecipe && (
            <View style={styles.ownerActions}>
              {canEdit && (
                <TouchableOpacity
                  style={[styles.ownerButton, styles.editButton]}
                  onPress={handleEdit}
                >
                  <Ionicons name="create-outline" size={20} color="#FFF" />
                  <Text style={styles.ownerButtonText}>Modifier</Text>
                </TouchableOpacity>
              )}

              {canEdit && (
                <TouchableOpacity
                  style={[styles.ownerButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFF" />
                  <Text style={styles.ownerButtonText}>Supprimer</Text>
                </TouchableOpacity>
              )}

              {canPropose && (
                <TouchableOpacity
                  style={[styles.ownerButton, styles.proposeButton]}
                  onPress={handlePropose}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                  <Text style={styles.ownerButtonText}>Proposer au public</Text>
                </TouchableOpacity>
              )}

              {canUnpublish && (
                <TouchableOpacity
                  style={[styles.ownerButton, styles.unpublishButton]}
                  onPress={handleUnpublish}
                >
                  <Ionicons name="cloud-offline-outline" size={20} color="#FFF" />
                  <Text style={styles.ownerButtonText}>Dépublier</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Status Badge for Own Recipes */}
          {isOwnRecipe && recipe.status && (
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  recipe.status === 'published' && styles.statusPublished,
                  recipe.status === 'pending' && styles.statusPending,
                  recipe.status === 'private' && styles.statusPrivate,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {recipe.status === 'published' && 'Publié'}
                  {recipe.status === 'pending' && 'En attente de validation'}
                  {recipe.status === 'private' && 'Privé'}
                </Text>
              </View>
            </View>
          )}

          {/* Like Count */}
          {recipe.likesCount > 0 && (
            <View style={styles.likesContainer}>
              <Ionicons name="heart" size={16} color="#EF4444" />
              <Text style={[styles.likesText, isDark && styles.likesTextDark]}>
                {recipe.likesCount} {recipe.likesCount === 1 ? 'personne aime' : 'personnes aiment'} cette recette
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingContainerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: '#666',
  },
  loadingTextDark: {
    color: '#999',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  heroSection: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroAuthor: {
    fontSize: theme.fontSize.sm,
    color: '#FFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    backgroundColor: '#F5F5F5',
  },
  contentDark: {
    backgroundColor: '#1A1A1A',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionDark: {
    backgroundColor: '#2A2A2A',
  },
  description: {
    fontSize: theme.fontSize.md,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  descriptionDark: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  statsContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#888',
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginTop: 2,
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semiBold,
  },
  tagsSection: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  tagsSectionDark: {
    backgroundColor: '#2A2A2A',
  },
  tagsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginBottom: theme.spacing.sm,
  },
  tagsTitleDark: {
    color: '#FFFFFF',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagDark: {
    backgroundColor: '#3A3A3A',
  },
  tagText: {
    fontSize: theme.fontSize.sm,
    color: '#1a1a1a',
  },
  tagTextDark: {
    color: '#FFFFFF',
  },
  ownerActions: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: 12,
  },
  ownerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  proposeButton: {
    backgroundColor: '#8B5CF6',
  },
  unpublishButton: {
    backgroundColor: '#F59E0B',
  },
  ownerButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPublished: {
    backgroundColor: '#22C55E',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusPrivate: {
    backgroundColor: '#666',
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: 6,
  },
  likesText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  likesTextDark: {
    color: '#888',
  },
});

export default RecipeDetailScreen;
