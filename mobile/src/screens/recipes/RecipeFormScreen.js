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
import logger from '../../services/logger';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

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
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanningIndex, setScanningIndex] = useState(null);

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

  const openScannerForIngredient = (index) => {
    setScanningIndex(index);
    setScannerVisible(true);
  };

  const handleIngredientProductFound = (product) => {
    if (scanningIndex === null) return;
    const newIngredients = [...ingredients];
    const parsedQty = parseInt(product.quantity) || 100;
    newIngredients[scanningIndex] = {
      ...newIngredients[scanningIndex],
      name: product.name + (product.brand ? ` (${product.brand})` : ''),
      quantity: String(parsedQty),
      unit: 'g',
      nutritionPer100g: product.nutrition,
    };
    setIngredients(newIngredients);

    // Auto-fill nutrition from scanned ingredients
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    for (const ing of newIngredients) {
      if (ing.nutritionPer100g && ing.quantity && ing.unit === 'g') {
        const ratio = Number(ing.quantity) / 100;
        totalCal += (ing.nutritionPer100g.calories || 0) * ratio;
        totalProt += (ing.nutritionPer100g.proteins || 0) * ratio;
        totalCarbs += (ing.nutritionPer100g.carbs || 0) * ratio;
        totalFat += (ing.nutritionPer100g.fats || 0) * ratio;
      }
    }
    if (totalCal > 0) {
      setCalories(String(Math.round(totalCal)));
      setProtein(String(Math.round(totalProt * 10) / 10));
      setCarbs(String(Math.round(totalCarbs * 10) / 10));
      setFat(String(Math.round(totalFat * 10) / 10));
    }

    setScanningIndex(null);
    Alert.alert('Produit scanné', `${product.name} ajouté aux ingrédients`);
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
      logger.app.error('Error saving recipe:', error);
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
        <Ionicons name="lock-closed" size={64} color="#72baa1" />
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
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backBtnText, isDark && styles.backBtnTextDark]}>
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <BarcodeScannerModal
      visible={scannerVisible}
      onClose={() => { setScannerVisible(false); setScanningIndex(null); }}
      onProductFound={handleIngredientProductFound}
    />
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={isDark ? '#f3f3f6' : '#1c1917'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {mode === 'edit' ? 'Modifier la recette' : 'Nouvelle recette'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Image Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Image
          </Text>
          <TouchableOpacity style={[styles.imagePicker, isDark && styles.imagePickerDark]} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={[styles.imagePlaceholder, isDark && styles.imagePlaceholderDark]}>
                <Ionicons name="camera" size={48} color="#a8a29e" />
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
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          />

          <Text style={[styles.label, isDark && styles.labelDark]}>
            Description
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre recette..."
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
              <Ionicons name="add-circle" size={28} color="#72baa1" />
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={[styles.ingredientRow, ingredient.nutritionPer100g && styles.ingredientScanned]}>
              <View style={styles.ingredientInputs}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }, isDark && styles.inputDark]}
                    value={ingredient.name}
                    onChangeText={value => updateIngredient(index, 'name', value)}
                    placeholder="Ingrédient"
                    placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
                  />
                  <TouchableOpacity
                    style={[styles.scanIngredientBtn, isDark && styles.scanIngredientBtnDark]}
                    onPress={() => openScannerForIngredient(index)}
                  >
                    <Ionicons name="barcode-outline" size={18} color="#72baa1" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.ingredientQuantity, isDark && styles.inputDark]}
                  value={ingredient.quantity}
                  onChangeText={value => updateIngredient(index, 'quantity', value)}
                  placeholder="Qté"
                  placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.ingredientUnit, isDark && styles.inputDark]}
                  value={ingredient.unit}
                  onChangeText={value => updateIngredient(index, 'unit', value)}
                  placeholder="Unité"
                  placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
                />
              </View>
              {ingredient.nutritionPer100g && (
                <Text style={styles.ingredientMacroHint}>
                  Pour 100g : {ingredient.nutritionPer100g.calories}kcal · {ingredient.nutritionPer100g.proteins}g prot
                </Text>
              )}
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
              <Ionicons name="add-circle" size={28} color="#72baa1" />
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
                placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
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
    </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  headerTitleDark: {
    color: '#f3f3f6',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#f3f3f6',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716c',
    marginBottom: 6,
    marginTop: 10,
  },
  labelDark: {
    color: '#c1c1cb',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: '#1c1917',
  },
  inputDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#f3f3f6',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 14,
    overflow: 'hidden',
  },
  pickerContainerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  picker: {
    color: '#1c1917',
    fontSize: 15,
  },
  pickerDark: {
    color: '#f3f3f6',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  optionButtonDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    borderColor: '#72baa1',
  },
  optionButtonSelectedDark: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    borderColor: '#72baa1',
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#78716c',
  },
  optionButtonTextDark: {
    color: '#c1c1cb',
  },
  optionButtonTextSelected: {
    color: '#72baa1',
    fontWeight: '700',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 110,
  },
  gridOptionDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  dietaryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f4',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  dietaryChipDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dietaryChipSelected: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    borderColor: '#72baa1',
  },
  dietaryChipSelectedDark: {
    backgroundColor: 'rgba(114,186,161,0.12)',
    borderColor: '#72baa1',
  },
  dietaryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78716c',
  },
  dietaryChipTextDark: {
    color: '#c1c1cb',
  },
  dietaryChipTextSelected: {
    color: '#72baa1',
    fontWeight: '700',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  imagePickerDark: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f4',
  },
  imagePlaceholderDark: {
    backgroundColor: '#18181d',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 15,
    color: '#a8a29e',
  },
  addButton: {
    padding: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientScanned: {
    backgroundColor: 'rgba(114, 186, 161, 0.06)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(114, 186, 161, 0.15)',
  },
  scanIngredientBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(114, 186, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  scanIngredientBtnDark: {
    backgroundColor: 'rgba(114, 186, 161, 0.15)',
  },
  ingredientMacroHint: {
    fontSize: 11,
    color: '#72baa1',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
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
    marginBottom: 12,
    gap: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#72baa1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: '#72baa1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  premiumGate: {
    flex: 1,
    backgroundColor: '#fcfbf9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  premiumGateDark: {
    backgroundColor: '#0e0e11',
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  premiumTitleDark: {
    color: '#f3f3f6',
  },
  premiumMessage: {
    fontSize: 15,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  premiumMessageDark: {
    color: '#c1c1cb',
  },
  premiumButton: {
    backgroundColor: '#72baa1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  premiumButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  backBtn: {
    padding: 10,
  },
  backBtnText: {
    color: '#72baa1',
    fontSize: 15,
  },
  backBtnTextDark: {
    color: '#72baa1',
  },
});

export default RecipeFormScreen;
