import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe } from '../../contexts/RecipeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  NutritionCard,
  IngredientList,
  InstructionsList,
} from '../../components/recipes';
import RatingDisplay from '../../components/common/RatingDisplay';
import { logRecipe } from '../../api/nutrition';
import { getSimilarRecipes } from '../../api/recipes';
import logger from '../../services/logger';

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
    rateRecipe,
    proposeRecipe,
    unpublishRecipe,
  } = useRecipe();

  const { user } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    loadRecipeDetail();
    loadSimilarRecipes();
  }, [recipeId]);

  const loadRecipeDetail = async () => {
    setLoadingDetail(true);
    try {
      // Always fetch from API to get full details (ingredients & instructions)
      // The list view excludes these fields for performance
      const result = await fetchRecipeById(recipeId);
      if (result) {
        logger.app.debug('[RecipeDetail] Recipe loaded:', {
          title: result.title,
          avgRating: result.avgRating,
          ratingsCount: result.ratingsCount,
          hasIngredients: !!result.ingredients,
          ingredientsCount: result.ingredients?.length,
          hasInstructions: !!result.instructions,
          instructionsCount: result.instructions?.length,
        });
        setRecipe(result);
        // Set user rating if available
        if (result.userRating !== undefined) {
          setUserRating(result.userRating || 0);
        }
      } else {
        Alert.alert('Erreur', 'Recette introuvable');
        navigation.goBack();
      }
    } catch (error) {
      logger.app.error('Error loading recipe:', error);
      Alert.alert('Erreur', 'Impossible de charger la recette');
      navigation.goBack();
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadSimilarRecipes = async () => {
    setLoadingSimilar(true);
    try {
      const result = await getSimilarRecipes(recipeId);
      if (result.success) {
        setSimilarRecipes(result.data);
      }
    } catch (error) {
      logger.app.debug('[RecipeDetail] Error loading similar:', error);
    } finally {
      setLoadingSimilar(false);
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

  const handleRate = async (rating) => {
    const result = await rateRecipe(recipeId, rating);
    logger.app.debug('[RecipeDetail] handleRate result:', result, 'recipe exists:', !!recipe);
    // Update local and recipe state with new ratings data
    if (result.success && recipe) {
      setUserRating(result.userRating);
      setRecipe({
        ...recipe,
        avgRating: result.avgRating,
        ratingsCount: result.ratingsCount,
      });
      Alert.alert(
        'Succès',
        'Votre note a été enregistrée avec succès!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer votre note. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogRecipe = async (mealType) => {
    const result = await logRecipe({
      recipeId,
      servingsConsumed: recipe.servings || 1,
      mealType,
    });
    if (result.success) {
      Alert.alert('Ajouté', 'Recette ajoutée à votre suivi nutritionnel !', [{ text: 'OK' }]);
    } else {
      Alert.alert('Erreur', result.error || 'Impossible d\'ajouter la recette.', [{ text: 'OK' }]);
    }
  };

  if (loadingDetail || !recipe) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color="#72baa1" />
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
  logger.app.debug('[RecipeDetail] Owner check:', {
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

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? '#f3f3f6' : '#1c1917'} />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.actionButton, isDark && styles.actionButtonDark]}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#ef4444' : '#a8a29e'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isDark && styles.actionButtonDark]}
              onPress={handleToggleSaved}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? '#72baa1' : '#a8a29e'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        <View style={[styles.content, isDark && styles.contentDark]}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.heroTitle, isDark && styles.heroTitleDark]}>{recipe.title}</Text>
            {recipe.createdBy && (
              <Text style={[styles.heroAuthor, isDark && styles.heroAuthorDark]}>
                Par {recipe.createdBy.firstName} {recipe.createdBy.lastName}
              </Text>
            )}
          </View>

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
              <Ionicons name="time-outline" size={20} color="#72baa1" />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Préparation
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.prepTime || 0} min
              </Text>
            </View>

            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />

            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#72baa1" />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Cuisson
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.cookTime || 0} min
              </Text>
            </View>

            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />

            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color="#72baa1" />
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                Portions
              </Text>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                {recipe.servings || 1}
              </Text>
            </View>

            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />

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

          {/* Rating - Afficher la note moyenne si disponible */}
          <RatingDisplay
            avgRating={recipe.avgRating}
            ratingsCount={recipe.ratingsCount}
            size="large"
          />

          {/* Nutrition Card */}
          <NutritionCard nutrition={nutrition} />

          {/* Log Recipe Button */}
          {user && (
            <TouchableOpacity
              style={styles.logRecipeBtn}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Logger cette recette',
                  `Ajouter "${recipe.title}" à votre suivi nutritionnel ?`,
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Petit-déj',
                      onPress: () => handleLogRecipe('breakfast'),
                    },
                    {
                      text: 'Déjeuner',
                      onPress: () => handleLogRecipe('lunch'),
                    },
                    {
                      text: 'Dîner',
                      onPress: () => handleLogRecipe('dinner'),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.logRecipeBtnText}>J'ai préparé cette recette</Text>
            </TouchableOpacity>
          )}

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

          {/* Rating - afficher pour tous les non-propriétaires */}
          {!isOwnRecipe && (
            <View style={[styles.ratingSection, isDark && styles.ratingSectionDark]}>
              <Text style={[styles.ratingTitle, isDark && styles.ratingTitleDark]}>
                Noter cette recette
              </Text>
              <View style={styles.rateStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRate(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= (userRating || 0) ? 'star' : 'star-outline'}
                      size={36}
                      color="#d4a96a"
                    />
                  </TouchableOpacity>
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
              <Ionicons name="heart" size={16} color="#ef4444" />
              <Text style={[styles.likesText, isDark && styles.likesTextDark]}>
                {recipe.likesCount} {recipe.likesCount === 1 ? 'personne aime' : 'personnes aiment'} cette recette
              </Text>
            </View>
          )}

          {/* Similar Recipes */}
          {(similarRecipes.length > 0 || loadingSimilar) && (
            <View style={styles.similarSection}>
              <Text style={[styles.similarTitle, isDark && styles.similarTitleDark]}>
                Vous allez aimer aussi
              </Text>
              {loadingSimilar ? (
                <ActivityIndicator size="small" color="#72baa1" style={{ marginTop: 16 }} />
              ) : (
                <FlatList
                  data={similarRecipes}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.similarList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.similarCard, isDark && styles.similarCardDark]}
                      activeOpacity={0.8}
                      onPress={() => navigation.push('RecipeDetail', { recipeId: item._id })}
                    >
                      <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/160x100' }}
                        style={styles.similarImage}
                        resizeMode="cover"
                      />
                      <View style={styles.similarInfo}>
                        <Text style={[styles.similarName, isDark && styles.similarNameDark]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={styles.similarMeta}>
                          {item.nutrition?.calories > 0 && (
                            <Text style={[styles.similarMetaText, isDark && styles.similarMetaTextDark]}>
                              {Math.round(item.nutrition.calories)} kcal
                            </Text>
                          )}
                          {item.totalTime > 0 && (
                            <Text style={[styles.similarMetaText, isDark && styles.similarMetaTextDark]}>
                              {item.totalTime} min
                            </Text>
                          )}
                        </View>
                        {item.avgRating > 0 && (
                          <View style={styles.similarRating}>
                            <Ionicons name="star" size={12} color="#d4a96a" />
                            <Text style={styles.similarRatingText}>{item.avgRating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
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
    backgroundColor: '#fcfbf9',
  },
  containerDark: {
    backgroundColor: '#0e0e11',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfbf9',
  },
  loadingContainerDark: {
    backgroundColor: '#0e0e11',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#a8a29e',
  },
  loadingTextDark: {
    color: '#7a7a88',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDark: {
    backgroundColor: 'rgba(24,24,29,0.9)',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroTitleDark: {
    color: '#f3f3f6',
  },
  heroAuthor: {
    fontSize: 13,
    color: '#a8a29e',
  },
  heroAuthorDark: {
    color: '#7a7a88',
  },
  content: {
    backgroundColor: '#fcfbf9',
  },
  contentDark: {
    backgroundColor: '#0e0e11',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  sectionDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  description: {
    fontSize: 15,
    color: '#1c1917',
    lineHeight: 22,
  },
  descriptionDark: {
    color: '#f3f3f6',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  statsContainerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#7a7a88',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c1917',
    marginTop: 2,
  },
  statValueDark: {
    color: '#f3f3f6',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#efedea',
    marginHorizontal: 8,
  },
  statDividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tagsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  tagsSectionDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 10,
  },
  tagsTitleDark: {
    color: '#f3f3f6',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tagText: {
    fontSize: 13,
    color: '#78716c',
  },
  tagTextDark: {
    color: '#c1c1cb',
  },
  ownerActions: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  ownerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#72baa1',
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
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusPublished: {
    backgroundColor: '#22C55E',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusPrivate: {
    backgroundColor: '#a8a29e',
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  likesText: {
    fontSize: 13,
    color: '#78716c',
  },
  likesTextDark: {
    color: '#c1c1cb',
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  ratingSectionDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ratingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingTitleDark: {
    color: '#f3f3f6',
  },
  rateStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  starButton: {
    padding: 8,
  },
  similarSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  similarTitleDark: {
    color: '#f3f3f6',
  },
  similarList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  similarCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  similarCardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  similarImage: {
    width: '100%',
    height: 100,
  },
  similarInfo: {
    padding: 10,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1917',
    lineHeight: 17,
    marginBottom: 6,
  },
  similarNameDark: {
    color: '#f3f3f6',
  },
  similarMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  similarMetaText: {
    fontSize: 11,
    color: '#a8a29e',
  },
  similarMetaTextDark: {
    color: '#7a7a88',
  },
  similarRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  similarRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4a96a',
  },
  logRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  logRecipeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RecipeDetailScreen;
