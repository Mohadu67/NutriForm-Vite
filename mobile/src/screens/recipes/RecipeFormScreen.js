import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useRecipe } from '../../contexts/RecipeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Sélectionner la difficulté' },
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

const MEAL_TYPE_OPTIONS = [
  { value: '', label: 'Sélectionner le type de repas' },
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
];

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarien' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'lactose_free', label: 'Sans lactose' },
];

const RecipeFormScreen = ({ route, navigation }) => {
  const { mode = 'create', recipe = null } = route.params || {};
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { isPremium, createRecipe, updateRecipe } = useRecipe();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(recipe?.image || null);

  // Basic Info
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [prepTime, setPrepTime] = useState(recipe?.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime?.toString() || '');
  const [servings, setServings] = useState(recipe?.servings?.toString() || '');

  // Selectors
  const [difficulty, setDifficulty] = useState(recipe?.difficulty || '');
  const [mealType, setMealType] = useState(recipe?.mealType?.[0] || '');
  const [dietary, setDietary] = useState(recipe?.dietType || []);

  // Nutrition
  const [calories, setCalories] = useState(
    recipe?.nutrition?.calories?.toString() || ''
  );
  const [protein, setProtein] = useState(
    recipe?.nutrition?.proteins?.toString() || ''
  );
  const [carbs, setCarbs] = useState(
    recipe?.nutrition?.carbs?.toString() || ''
  );
  const [fat, setFat] = useState(recipe?.nutrition?.fats?.toString() || '');

  // Dynamic Arrays
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients || [{ name: '', quantity: '', unit: '' }]
  );
  const [instructions, setInstructions] = useState(
    recipe?.instructions || ['']
  );

  useEffect(() => {
    navigation.setOptions({
      title: mode === 'edit' ? 'Modifier la recette' : 'Nouvelle recette',
    });
  }, [mode]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre permission pour accéder à vos photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleDietary = (value) => {
    if (dietary.includes(value)) {
      setDietary(dietary.filter(item => item !== value));
    } else {
      setDietary([...dietary, value]);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length === 1) {
      Alert.alert('Erreur', 'Vous devez avoir au moins un ingrédient.');
      return;
    }
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index) => {
    if (instructions.length === 1) {
      Alert.alert('Erreur', 'Vous devez avoir au moins une étape.');
      return;
    }
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire.');
      return false;
    }

    if (title.trim().length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères.');
      return false;
    }

    // Check if at least one ingredient has a name
    const hasValidIngredient = ingredients.some(
      ing => ing.name && ing.name.trim().length > 0
    );
    if (!hasValidIngredient) {
      Alert.alert('Erreur', 'Ajoutez au moins un ingrédient.');
      return false;
    }

    // Check if at least one instruction is filled
    const hasValidInstruction = instructions.some(
      inst => inst && inst.trim().length > 0
    );
    if (!hasValidInstruction) {
      Alert.alert('Erreur', 'Ajoutez au moins une étape de préparation.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isPremium) {
      Alert.alert(
        'Premium requis',
        'La création et modification de recettes est une fonctionnalité premium.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      // Filter out empty ingredients and instructions
      const validIngredients = ingredients.filter(
        ing => ing.name && ing.name.trim().length > 0
      );
      const validInstructions = instructions.filter(
        inst => inst && inst.trim().length > 0
      );

      // Calculer prepTime, cookTime et totalTime avec valeurs par défaut
      const prepTimeValue = prepTime ? parseInt(prepTime) : 0;
      const cookTimeValue = cookTime ? parseInt(cookTime) : 0;
      const totalTimeValue = prepTimeValue + cookTimeValue;

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        image: imageUri,
        prepTime: prepTimeValue,
        cookTime: cookTimeValue,
        totalTime: totalTimeValue, // Ajout du champ totalTime requis
        servings: servings ? parseInt(servings) : 1, // Valeur par défaut 1
        difficulty,
        mealType: mealType ? [mealType] : [],
        dietType: dietary,
        nutrition: {
          calories: calories ? parseFloat(calories) : 0,
          proteins: protein ? parseFloat(protein) : 0,
          carbs: carbs ? parseFloat(carbs) : 0,
          fats: fat ? parseFloat(fat) : 0,
        },
        ingredients: validIngredients,
        instructions: validInstructions,
      };

      let success;
      if (mode === 'edit') {
        success = await updateRecipe(recipe._id, recipeData);
      } else {
        success = await createRecipe(recipeData);
      }

      if (success) {
        Alert.alert(
          'Succès',
          mode === 'edit'
            ? 'Recette modifiée avec succès'
            : 'Recette créée avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // En cas d'échec sans exception
        Alert.alert(
          'Erreur',
          'Impossible de sauvegarder la recette. Vérifiez que tous les champs requis sont remplis.'
        );
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      // Afficher un message plus détaillé si disponible
      const errorMsg = error?.response?.data?.message ||
                      error?.message ||
                      'Une erreur est survenue lors de l\'enregistrement de la recette.';
      Alert.alert('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Premium Gate
  if (!isPremium) {
    return (
      <View style={[styles.premiumGate, isDark && styles.premiumGateDark]}>
        <Ionicons name="lock-closed" size={64} color={theme.colors.primary} />
        <Text style={[styles.premiumTitle, isDark && styles.premiumTitleDark]}>
          Fonctionnalité Premium
        </Text>
        <Text
          style={[styles.premiumMessage, isDark && styles.premiumMessageDark]}
        >
          La création et la modification de recettes sont réservées aux membres
          Premium. Passez à Premium pour accéder à cette fonctionnalité et bien
          plus encore.
        </Text>
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => {
            navigation.goBack();
            navigation.navigate('Subscription');
          }}
        >
          <Text style={styles.premiumButtonText}>Découvrir Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, isDark && styles.backButtonTextDark]}>
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={[styles.scrollView, isDark && styles.scrollViewDark]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Image
          </Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color="#999" />
                <Text style={styles.imagePlaceholderText}>
                  Ajouter une photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Informations de base
          </Text>

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Tarte aux pommes maison"
            placeholderTextColor={isDark ? '#666' : '#999'}
          />

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Description
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre recette..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Préparation (min)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Cuisson (min)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Portions
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={servings}
            onChangeText={setServings}
            placeholder="4"
            placeholderTextColor={isDark ? '#666' : '#999'}
            keyboardType="numeric"
          />
        </View>

        {/* Selectors */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Catégories
          </Text>

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Difficulté
          </Text>
          <View style={styles.buttonGroup}>
            {DIFFICULTY_OPTIONS.filter(o => o.value).map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  difficulty === option.value && styles.optionButtonSelected,
                  isDark && styles.optionButtonDark,
                  isDark && difficulty === option.value && styles.optionButtonSelectedDark,
                ]}
                onPress={() => setDifficulty(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    difficulty === option.value && styles.optionButtonTextSelected,
                    isDark && styles.optionButtonTextDark,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Type de repas
          </Text>
          <View style={styles.optionsGrid}>
            {MEAL_TYPE_OPTIONS.filter(o => o.value).map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.gridOption,
                  mealType === option.value && styles.optionButtonSelected,
                  isDark && styles.gridOptionDark,
                  isDark && mealType === option.value && styles.optionButtonSelectedDark,
                ]}
                onPress={() => setMealType(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    mealType === option.value && styles.optionButtonTextSelected,
                    isDark && styles.optionButtonTextDark,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Régimes alimentaires
          </Text>
          <View style={styles.dietaryContainer}>
            {DIETARY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dietaryChip,
                  dietary.includes(option.value) && styles.dietaryChipSelected,
                  isDark && styles.dietaryChipDark,
                  isDark && dietary.includes(option.value) && styles.dietaryChipSelectedDark,
                ]}
                onPress={() => toggleDietary(option.value)}
              >
                <Text
                  style={[
                    styles.dietaryChipText,
                    dietary.includes(option.value) && styles.dietaryChipTextSelected,
                    isDark && styles.dietaryChipTextDark,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Valeurs nutritionnelles (par portion)
          </Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Calories (kcal)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={calories}
                onChangeText={setCalories}
                placeholder="250"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Protéines (g)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={protein}
                onChangeText={setProtein}
                placeholder="12"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Glucides (g)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="30"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Lipides (g)
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={fat}
                onChangeText={setFat}
                placeholder="8"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Ingrédients <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addIngredient}
            >
              <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  style={[styles.input, styles.ingredientName, isDark && styles.inputDark]}
                  value={ingredient.name}
                  onChangeText={value => updateIngredient(index, 'name', value)}
                  placeholder="Nom de l'ingrédient"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
                <TextInput
                  style={[styles.input, styles.ingredientQuantity, isDark && styles.inputDark]}
                  value={ingredient.quantity}
                  onChangeText={value =>
                    updateIngredient(index, 'quantity', value)
                  }
                  placeholder="Qté"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.ingredientUnit, isDark && styles.inputDark]}
                  value={ingredient.unit}
                  onChangeText={value => updateIngredient(index, 'unit', value)}
                  placeholder="Unité"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
              </View>
              {ingredients.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeIngredient(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Étapes de préparation <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addInstruction}
            >
              <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.instructionInput,
                  isDark && styles.inputDark,
                ]}
                value={instruction}
                onChangeText={value => updateInstruction(index, value)}
                placeholder="Décrivez cette étape..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeInstruction(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {mode === 'edit' ? 'Enregistrer les modifications' : 'Créer la recette'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewDark: {
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#1a1a1a',
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: '#1a1a1a',
    marginBottom: 6,
    marginTop: theme.spacing.sm,
  },
  labelDark: {
    color: '#FFFFFF',
  },
  selectedValue: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semiBold,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: '#1a1a1a',
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  pickerContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  picker: {
    color: '#000000',
    fontSize: theme.fontSize.md,
  },
  pickerDark: {
    color: '#FFFFFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  optionButtonSelectedDark: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionButtonTextDark: {
    color: '#F3F4F6',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  gridOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  dietaryChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dietaryChipDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  dietaryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dietaryChipSelectedDark: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dietaryChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  dietaryChipTextDark: {
    color: '#F3F4F6',
  },
  dietaryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: theme.fontSize.md,
    color: '#999',
  },
  addButton: {
    padding: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientQuantity: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  instructionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 4,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  premiumGate: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  premiumGateDark: {
    backgroundColor: '#1A1A1A',
  },
  premiumTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#1a1a1a',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  premiumTitleDark: {
    color: '#FFFFFF',
  },
  premiumMessage: {
    fontSize: theme.fontSize.md,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  premiumMessageDark: {
    color: '#999',
  },
  premiumButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  premiumButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
  backButtonTextDark: {
    color: theme.colors.primary,
  },
});

export default RecipeFormScreen;
