import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image, Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipe } from '../../contexts/RecipeContext';
import { useTheme } from '../../theme';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#F7B186';
const HIT    = { top: 10, bottom: 10, left: 10, right: 10 };

const UNITS = ['g', 'kg', 'ml', 'cl', 'L', 'pièce', 'tranche', 'c. à café', 'c. à soupe', 'pincée', 'poignée'];

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Facile',    icon: 'happy-outline' },
  { value: 'medium', label: 'Moyen',     icon: 'flash-outline' },
  { value: 'hard',   label: 'Difficile', icon: 'flame-outline' },
];

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Petit-déj',  icon: 'sunny-outline' },
  { value: 'lunch',     label: 'Déjeuner',   icon: 'restaurant-outline' },
  { value: 'dinner',    label: 'Dîner',      icon: 'moon-outline' },
  { value: 'snack',     label: 'Snack',      icon: 'nutrition-outline' },
];

const DIETARY_OPTIONS = [
  { value: 'vegetarian',   label: 'Végétarien' },
  { value: 'vegan',        label: 'Vegan' },
  { value: 'pescatarian',  label: 'Pescatarien' },
  { value: 'keto',         label: 'Keto' },
  { value: 'paleo',        label: 'Paleo' },
  { value: 'gluten_free',  label: 'Sans gluten' },
  { value: 'lactose_free', label: 'Sans lactose' },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const T = {
  light: {
    bg:          '#F2F4F8',
    surface:     '#FFFFFF',
    inputBg:     '#F6F7FA',
    border:      '#E8EAF0',
    text:        '#111318',
    textSec:     '#868C9C',
    placeholder: '#BEC3D0',
    divider:     '#ECEEF4',
  },
  dark: {
    bg:          '#0B0D12',
    surface:     '#13151D',
    inputBg:     '#1A1D28',
    border:      '#252A38',
    text:        '#E8EAF4',
    textSec:     '#55607A',
    placeholder: '#323848',
    divider:     '#1C1F2C',
  },
};

// ─── Nutrition helpers ────────────────────────────────────────────────────────

function toGramsFactor(qty, unit) {
  const q = parseFloat(qty);
  if (!q || isNaN(q)) return null;
  switch (unit) {
    case 'g':  return q / 100;
    case 'kg': return q * 10;
    case 'ml': return q / 100;
    case 'cl': return q / 10;
    case 'L':  return q * 10;
    default:   return null;
  }
}

function calcNutrition(ingredients) {
  const t = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  let hasAny = false;
  for (const ing of ingredients) {
    if (!ing.nutritionPer100g) continue;
    const f = toGramsFactor(ing.quantity, ing.unit);
    if (f === null) continue;
    t.calories += (ing.nutritionPer100g.calories || 0) * f;
    t.proteins += (ing.nutritionPer100g.proteins || 0) * f;
    t.carbs    += (ing.nutritionPer100g.carbs    || 0) * f;
    t.fats     += (ing.nutritionPer100g.fats     || 0) * f;
    hasAny = true;
  }
  if (!hasAny) return null;
  return {
    calories: String(Math.round(t.calories)),
    proteins: String(Math.round(t.proteins * 10) / 10),
    carbs:    String(Math.round(t.carbs    * 10) / 10),
    fats:     String(Math.round(t.fats     * 10) / 10),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, action }) {
  return (
    <View style={sh.row}>
      <Text style={sh.label}>{label}</Text>
      {action || null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: '700', color: ACCENT, letterSpacing: 1.2, textTransform: 'uppercase' },
});

function Stepper({ value, onDecrement, onIncrement, C }) {
  return (
    <View style={[sp.wrap, { backgroundColor: C.inputBg, borderColor: C.border }]}>
      <TouchableOpacity style={sp.btn} onPress={onDecrement} hitSlop={HIT}>
        <Ionicons name="remove" size={14} color={C.textSec} />
      </TouchableOpacity>
      <Text style={[sp.val, { color: C.text }]}>{value}</Text>
      <TouchableOpacity style={sp.btn} onPress={onIncrement} hitSlop={HIT}>
        <Ionicons name="add" size={14} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}
const sp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  btn:  { padding: 8 },
  val:  { minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: '700' },
});

function UnitPicker({ value, onChange, C }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 5 }}
      contentContainerStyle={{ gap: 5, paddingRight: 4 }}
    >
      {UNITS.map(u => {
        const active = value === u;
        return (
          <TouchableOpacity
            key={u}
            onPress={() => onChange(u)}
            style={[up.chip, {
              backgroundColor: active ? ACCENT : C.inputBg,
              borderColor:     active ? ACCENT : C.border,
            }]}
          >
            <Text style={[up.txt, { color: active ? '#FFF' : C.textSec }]}>{u}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const up = StyleSheet.create({
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  txt:  { fontSize: 12, fontWeight: '600' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

const RecipeFormScreen = ({ route, navigation }) => {
  const { mode = 'create', recipe = null } = route.params || {};
  const { isDark } = useTheme();
  const C = isDark ? T.dark : T.light;
  const insets = useSafeAreaInsets();
  const { isPremium, createRecipe, updateRecipe } = useRecipe();
  const saveBtnScale = useRef(new Animated.Value(1)).current;

  const [loading,        setLoading]        = useState(false);
  const [imageUri,       setImageUri]       = useState(recipe?.image || null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanningIndex,  setScanningIndex]  = useState(null);
  const [autoNutrition,  setAutoNutrition]  = useState(false);

  const [title,       setTitle]       = useState(recipe?.title       || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [prepTime,    setPrepTime]    = useState(recipe?.prepTime    || 0);
  const [cookTime,    setCookTime]    = useState(recipe?.cookTime    || 0);
  const [servings,    setServings]    = useState(recipe?.servings    || 2);
  const [difficulty,  setDifficulty]  = useState(recipe?.difficulty  || '');
  const [mealType,    setMealType]    = useState(recipe?.mealType?.[0] || '');
  const [dietary,     setDietary]     = useState(recipe?.dietType   || []);

  const [calories, setCalories] = useState(recipe?.nutrition?.calories?.toString() || '');
  const [proteins, setProteins] = useState(recipe?.nutrition?.proteins?.toString() || '');
  const [carbs,    setCarbs]    = useState(recipe?.nutrition?.carbs?.toString()    || '');
  const [fats,     setFats]     = useState(recipe?.nutrition?.fats?.toString()     || '');

  const [ingredients,  setIngredients]  = useState(
    recipe?.ingredients?.length
      ? recipe.ingredients.map(i => ({ ...i, unit: i.unit || 'g' }))
      : [{ name: '', quantity: '', unit: 'g', optional: false, nutritionPer100g: null }]
  );
  const [instructions, setInstructions] = useState(
    recipe?.instructions?.length ? recipe.instructions : ['']
  );

  // ── Nutrition helpers ────────────────────────────────────────────────────
  const setMacros = useCallback((calc) => {
    if (!calc) return;
    setCalories(calc.calories);
    setProteins(calc.proteins);
    setCarbs(calc.carbs);
    setFats(calc.fats);
  }, []);

  const handleMacroChange = (setter) => (val) => {
    setAutoNutrition(false);
    setter(val);
  };

  // ── Image ────────────────────────────────────────────────────────────────
  const pickImage = async (fromCamera = false) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès nécessaire pour ajouter une photo.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Photo de la recette', 'Choisir depuis…', [
      { text: 'Appareil photo',  onPress: () => pickImage(true) },
      { text: 'Galerie',         onPress: () => pickImage(false) },
      ...(imageUri ? [{ text: 'Supprimer', style: 'destructive', onPress: () => setImageUri(null) }] : []),
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  // ── Ingredients ──────────────────────────────────────────────────────────
  const updateIngredient = useCallback((index, field, value) => {
    setIngredients(prev => {
      const next = prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing);
      if ((field === 'quantity' || field === 'unit') && autoNutrition) {
        const calc = calcNutrition(next);
        if (calc) setMacros(calc);
      }
      return next;
    });
  }, [autoNutrition, setMacros]);

  const addIngredient = () => setIngredients(prev => [
    ...prev,
    { name: '', quantity: '', unit: 'g', optional: false, nutritionPer100g: null },
  ]);

  const removeIngredient = useCallback((index) => {
    setIngredients(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (autoNutrition) {
        const calc = calcNutrition(next);
        if (calc) setMacros(calc);
      }
      return next;
    });
  }, [autoNutrition, setMacros]);

  const handleProductFound = useCallback((product) => {
    if (scanningIndex === null) return;
    Vibration.vibrate(60);
    setIngredients(prev => {
      const next = prev.map((ing, i) => i === scanningIndex ? {
        ...ing,
        name: product.name + (product.brand ? ` (${product.brand})` : ''),
        unit: 'g',
        nutritionPer100g: product.nutrition,
      } : ing);
      const calc = calcNutrition(next);
      if (calc) { setMacros(calc); setAutoNutrition(true); }
      return next;
    });
    setScanningIndex(null);
  }, [scanningIndex, setMacros]);

  // ── Instructions ─────────────────────────────────────────────────────────
  const updateInstruction = (index, value) =>
    setInstructions(prev => prev.map((inst, i) => i === index ? value : inst));
  const addInstruction    = () => setInstructions(prev => [...prev, '']);
  const removeInstruction = (index) => {
    if (instructions.length > 1)
      setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Donnez un nom à votre recette.');
      return;
    }
    if (!ingredients.some(i => i.name.trim())) {
      Alert.alert('Ingrédient requis', 'Ajoutez au moins un ingrédient.');
      return;
    }
    if (!instructions.some(i => i.trim())) {
      Alert.alert('Instructions requises', 'Ajoutez au moins une étape.');
      return;
    }

    Animated.sequence([
      Animated.timing(saveBtnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(saveBtnScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        image: imageUri,
        prepTime, cookTime, totalTime: prepTime + cookTime,
        servings,
        difficulty,
        mealType: mealType ? [mealType] : [],
        dietType: dietary,
        nutrition: {
          calories: calories ? parseFloat(calories) : 0,
          proteins: proteins ? parseFloat(proteins) : 0,
          carbs:    carbs    ? parseFloat(carbs)    : 0,
          fats:     fats     ? parseFloat(fats)     : 0,
        },
        ingredients: ingredients
          .filter(i => i.name.trim())
          .map(({ nutritionPer100g, ...rest }) => rest),
        instructions: instructions.filter(i => i.trim()),
      };

      const success = mode === 'edit'
        ? await updateRecipe(recipe._id, data)
        : await createRecipe(data);

      if (success) {
        Vibration.vibrate([0, 50, 50, 100]);
        Alert.alert(
          mode === 'edit' ? 'Recette modifiée' : 'Recette créée',
          mode === 'edit' ? 'Vos modifications ont été enregistrées.' : 'Votre recette est prête.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder la recette.');
      }
    } catch (err) {
      Alert.alert('Erreur', err?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // ── Premium gate ─────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <View style={[s.gate, { backgroundColor: C.bg }]}>
        <View style={[s.gateIconWrap, { backgroundColor: C.surface }]}>
          <Ionicons name="lock-closed" size={28} color={ACCENT} />
        </View>
        <Text style={[s.gateTitle, { color: C.text }]}>Fonctionnalité Premium</Text>
        <Text style={[s.gateMsg, { color: C.textSec }]}>
          La création de recettes personnalisées est réservée aux membres Premium.
        </Text>
        <TouchableOpacity
          style={s.gateBtn}
          onPress={() => { navigation.goBack(); navigation.navigate('Subscription'); }}
        >
          <LinearGradient colors={['#F7B186', '#E07A40']} style={s.gateBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.gateBtnTxt}>Découvrir Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: C.textSec, fontSize: 14 }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const scanned = calcNutrition(ingredients);

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => { setScannerVisible(false); setScanningIndex(null); }}
        onProductFound={handleProductFound}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >

        {/* ── Photo hero ────────────────────────────────────────────────── */}
        <TouchableOpacity onPress={showImageOptions} activeOpacity={0.88}>
          {imageUri ? (
            <View style={s.heroFull}>
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
              <View style={s.heroTag}>
                <Ionicons name="camera" size={13} color="#FFF" />
                <Text style={s.heroTagTxt}>Modifier</Text>
              </View>
            </View>
          ) : (
            <View style={[s.heroEmpty, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
              <View style={[s.heroCamCircle, { borderColor: C.border }]}>
                <Ionicons name="camera-outline" size={26} color={ACCENT} />
              </View>
              <Text style={[s.heroEmptyTxt, { color: C.textSec }]}>Ajouter une photo</Text>
              <Text style={[s.heroEmptyHint, { color: C.placeholder }]}>Galerie · Appareil photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={s.body}>

          {/* ── Informations ─────────────────────────────────────────────── */}
          <SectionHeader label="Informations" />

          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TextInput
              style={[s.titleIn, { color: C.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Nom de la recette *"
              placeholderTextColor={C.placeholder}
            />
            <View style={[s.cardDivider, { backgroundColor: C.divider }]} />
            <TextInput
              style={[s.descIn, { color: C.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optionnelle)…"
              placeholderTextColor={C.placeholder}
              multiline
            />
          </View>

          {/* ── Temps & Portions ─────────────────────────────────────────── */}
          <View style={[s.metaRow, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.metaCell}>
              <Ionicons name="time-outline" size={16} color={ACCENT} />
              <Text style={[s.metaCellLbl, { color: C.textSec }]}>Prépa.</Text>
              <Stepper
                value={prepTime}
                onDecrement={() => setPrepTime(v => Math.max(0, v - 5))}
                onIncrement={() => setPrepTime(v => v + 5)}
                C={C}
              />
              <Text style={[s.metaCellUnit, { color: C.textSec }]}>min</Text>
            </View>
            <View style={[s.metaSep, { backgroundColor: C.divider }]} />
            <View style={s.metaCell}>
              <Ionicons name="flame-outline" size={16} color={ACCENT} />
              <Text style={[s.metaCellLbl, { color: C.textSec }]}>Cuisson</Text>
              <Stepper
                value={cookTime}
                onDecrement={() => setCookTime(v => Math.max(0, v - 5))}
                onIncrement={() => setCookTime(v => v + 5)}
                C={C}
              />
              <Text style={[s.metaCellUnit, { color: C.textSec }]}>min</Text>
            </View>
            <View style={[s.metaSep, { backgroundColor: C.divider }]} />
            <View style={s.metaCell}>
              <Ionicons name="people-outline" size={16} color={ACCENT} />
              <Text style={[s.metaCellLbl, { color: C.textSec }]}>Portions</Text>
              <Stepper
                value={servings}
                onDecrement={() => setServings(v => Math.max(1, v - 1))}
                onIncrement={() => setServings(v => v + 1)}
                C={C}
              />
            </View>
          </View>

          {/* ── Ingrédients ──────────────────────────────────────────────── */}
          <SectionHeader
            label="Ingrédients"
            action={
              <TouchableOpacity onPress={addIngredient} style={s.sectionAction} hitSlop={HIT}>
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={[s.sectionActionTxt, { color: ACCENT }]}>Ajouter</Text>
              </TouchableOpacity>
            }
          />

          {ingredients.map((ing, idx) => (
            <View key={idx} style={[s.ingBlock, { backgroundColor: C.surface, borderColor: C.border }]}>
              {/* row 1 — name + scan + delete */}
              <View style={s.ingRow}>
                <View style={[s.ingIdx, { backgroundColor: isDark ? '#1C1F2E' : '#F2F4F8' }]}>
                  <Text style={[s.ingIdxTxt, { color: ACCENT }]}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={[s.ingNameIn, { color: C.text, backgroundColor: C.inputBg, borderColor: C.border }]}
                  value={ing.name}
                  onChangeText={v => updateIngredient(idx, 'name', v)}
                  placeholder="Nom de l'ingrédient"
                  placeholderTextColor={C.placeholder}
                />
                <TouchableOpacity
                  style={[s.scanBtn, {
                    backgroundColor: ing.nutritionPer100g ? ACCENT + '18' : C.inputBg,
                    borderColor:     ing.nutritionPer100g ? ACCENT + '55' : C.border,
                  }]}
                  onPress={() => { setScanningIndex(idx); setScannerVisible(true); }}
                  hitSlop={HIT}
                >
                  <Ionicons name="barcode-outline" size={17} color={ing.nutritionPer100g ? ACCENT : C.textSec} />
                </TouchableOpacity>
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngredient(idx)} hitSlop={HIT}>
                    <Ionicons name="close" size={18} color={C.textSec} />
                  </TouchableOpacity>
                )}
              </View>

              {/* row 2 — qty + unit picker */}
              <View style={[s.ingQtyRow, { paddingLeft: 36 }]}>
                <TextInput
                  style={[s.ingQtyIn, { color: C.text, backgroundColor: C.inputBg, borderColor: C.border }]}
                  value={ing.quantity}
                  onChangeText={v => updateIngredient(idx, 'quantity', v)}
                  placeholder="Qté"
                  placeholderTextColor={C.placeholder}
                  keyboardType="numeric"
                />
                <View style={{ flex: 1 }}>
                  <UnitPicker value={ing.unit || 'g'} onChange={v => updateIngredient(idx, 'unit', v)} C={C} />
                </View>
              </View>

              {/* nutrition badge */}
              {ing.nutritionPer100g && (
                <View style={[s.nutrBadge, { backgroundColor: isDark ? '#1A1E2C' : '#FFF5EE', paddingLeft: 36 + 8 }]}>
                  <Ionicons name="flash" size={10} color={ACCENT} />
                  <Text style={[s.nutrBadgeTxt, { color: ACCENT }]}>
                    {ing.nutritionPer100g.calories} kcal · {ing.nutritionPer100g.proteins}g P · {ing.nutritionPer100g.carbs}g G /100g
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* ── Instructions ─────────────────────────────────────────────── */}
          <SectionHeader
            label="Instructions"
            action={
              <TouchableOpacity onPress={addInstruction} style={s.sectionAction} hitSlop={HIT}>
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={[s.sectionActionTxt, { color: ACCENT }]}>Étape</Text>
              </TouchableOpacity>
            }
          />

          {instructions.map((inst, idx) => (
            <View key={idx} style={s.stepRow}>
              {/* timeline */}
              <View style={s.stepTimeline}>
                <View style={s.stepBadge}>
                  <Text style={s.stepBadgeTxt}>{idx + 1}</Text>
                </View>
                {idx < instructions.length - 1 && (
                  <View style={[s.stepLine, { backgroundColor: C.border }]} />
                )}
              </View>

              <View style={s.stepContent}>
                <View style={[s.stepCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <TextInput
                    style={[s.stepIn, { color: C.text }]}
                    value={inst}
                    onChangeText={v => updateInstruction(idx, v)}
                    placeholder={`Décrivez l'étape ${idx + 1}…`}
                    placeholderTextColor={C.placeholder}
                    multiline
                    textAlignVertical="top"
                  />
                  {instructions.length > 1 && (
                    <TouchableOpacity onPress={() => removeInstruction(idx)} style={s.stepDel} hitSlop={HIT}>
                      <Ionicons name="trash-outline" size={14} color={C.textSec} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* ── Nutrition ────────────────────────────────────────────────── */}
          <SectionHeader label="Valeurs nutritionnelles" />

          {autoNutrition && (
            <View style={[s.autoBanner, { backgroundColor: isDark ? '#0D1C12' : '#F0FDF4', borderColor: isDark ? '#1A3322' : '#BBF7D0' }]}>
              <Ionicons name="flash" size={12} color="#22C55E" />
              <Text style={[s.autoBannerTxt, { color: '#22C55E' }]}>Calculées depuis les ingrédients scannés</Text>
              <TouchableOpacity onPress={() => setAutoNutrition(false)}>
                <Text style={s.autoBannerEdit}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}

          {!autoNutrition && scanned && (
            <TouchableOpacity
              style={[s.autoRestore, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => { setMacros(scanned); setAutoNutrition(true); }}
            >
              <Ionicons name="flash-outline" size={13} color={ACCENT} />
              <Text style={[s.autoRestoreTxt, { color: ACCENT }]}>Recalculer depuis les scans</Text>
            </TouchableOpacity>
          )}

          <View style={s.macroGrid}>
            {[
              { key: 'calories', label: 'Calories',  unit: 'kcal', val: calories, set: setCalories },
              { key: 'proteins', label: 'Protéines', unit: 'g',    val: proteins, set: setProteins },
              { key: 'carbs',    label: 'Glucides',  unit: 'g',    val: carbs,    set: setCarbs    },
              { key: 'fats',     label: 'Lipides',   unit: 'g',    val: fats,     set: setFats     },
            ].map(({ key, label, unit, val, set }) => (
              <View key={key} style={[s.macroCell, { backgroundColor: C.surface, borderColor: C.border }]}>
                <TextInput
                  style={[s.macroVal, { color: autoNutrition ? ACCENT : C.text }]}
                  value={val}
                  onChangeText={handleMacroChange(set)}
                  placeholder="—"
                  placeholderTextColor={C.placeholder}
                  keyboardType="numeric"
                  editable={!autoNutrition}
                  textAlign="center"
                />
                <Text style={[s.macroLbl, { color: C.textSec }]}>{label}</Text>
                <Text style={[s.macroUnit, { color: C.placeholder }]}>{unit}</Text>
              </View>
            ))}
          </View>

          {/* ── Classification ───────────────────────────────────────────── */}
          <SectionHeader label="Classification" />

          <Text style={[s.subLbl, { color: C.textSec }]}>Difficulté</Text>
          <View style={s.chipRow}>
            {DIFFICULTY_OPTIONS.map(opt => {
              const active = difficulty === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chip, {
                    backgroundColor: active ? ACCENT       : C.surface,
                    borderColor:     active ? ACCENT       : C.border,
                  }]}
                  onPress={() => setDifficulty(opt.value)}
                >
                  <Ionicons name={opt.icon} size={14} color={active ? '#FFF' : C.textSec} />
                  <Text style={[s.chipTxt, { color: active ? '#FFF' : C.textSec }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.subLbl, { color: C.textSec, marginTop: 14 }]}>Type de repas</Text>
          <View style={s.chipRow}>
            {MEAL_TYPE_OPTIONS.map(opt => {
              const active = mealType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chip, {
                    backgroundColor: active ? ACCENT : C.surface,
                    borderColor:     active ? ACCENT : C.border,
                  }]}
                  onPress={() => setMealType(active ? '' : opt.value)}
                >
                  <Ionicons name={opt.icon} size={14} color={active ? '#FFF' : C.textSec} />
                  <Text style={[s.chipTxt, { color: active ? '#FFF' : C.textSec }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.subLbl, { color: C.textSec, marginTop: 14 }]}>Régimes alimentaires</Text>
          <View style={[s.chipRow, s.chipWrap]}>
            {DIETARY_OPTIONS.map(opt => {
              const active = dietary.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chip, {
                    backgroundColor: active ? ACCENT : C.surface,
                    borderColor:     active ? ACCENT : C.border,
                  }]}
                  onPress={() => setDietary(p => active ? p.filter(v => v !== opt.value) : [...p, opt.value])}
                >
                  <Text style={[s.chipTxt, { color: active ? '#FFF' : C.textSec }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* ── Footer save ──────────────────────────────────────────────────── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 8, backgroundColor: C.surface, borderTopColor: C.border }]}>
        <Animated.View style={{ transform: [{ scale: saveBtnScale }] }}>
          <TouchableOpacity
            style={[s.saveBtn, loading && { opacity: 0.65 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F7B186', '#D96830']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtnInner}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name={mode === 'edit' ? 'checkmark-circle-outline' : 'add-circle-outline'} size={20} color="#FFF" />
                  <Text style={s.saveTxt}>
                    {mode === 'edit' ? 'Enregistrer les modifications' : 'Créer la recette'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  heroFull: { width: '100%', height: 240 },
  heroEmpty: {
    height: 130, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderBottomWidth: 1,
  },
  heroCamCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  heroEmptyTxt:  { fontSize: 14, fontWeight: '600' },
  heroEmptyHint: { fontSize: 12 },
  heroTag: {
    position: 'absolute', bottom: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
  },
  heroTagTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },

  // Section action
  sectionAction:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionActionTxt: { fontSize: 13, fontWeight: '600' },

  // Info card
  card: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 12,
  },
  cardDivider: { height: 1 },
  titleIn: {
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 17, fontWeight: '600',
  },
  descIn: {
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, lineHeight: 20, minHeight: 60,
  },

  // Meta row (times + servings)
  metaRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    marginBottom: 4, overflow: 'hidden',
  },
  metaCell: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  metaCellLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaCellUnit: { fontSize: 10 },
  metaSep: { width: 1, marginVertical: 10 },

  // Ingredient block
  ingBlock: {
    borderRadius: 12, borderWidth: 1, marginBottom: 8,
    paddingTop: 10, paddingHorizontal: 10, paddingBottom: 10,
  },
  ingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8,
  },
  ingIdx: {
    width: 24, height: 24, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ingIdxTxt: { fontSize: 11, fontWeight: '700' },
  ingNameIn: {
    flex: 1, borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
  },
  scanBtn: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ingQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ingQtyIn: {
    width: 68, borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 7,
    fontSize: 14, textAlign: 'center', flexShrink: 0,
  },
  nutrBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingVertical: 5, paddingRight: 8,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  nutrBadgeTxt: { fontSize: 10, fontWeight: '600' },

  // Instructions timeline
  stepRow:      { flexDirection: 'row', gap: 10, marginBottom: 0 },
  stepTimeline: { alignItems: 'center', width: 26, paddingTop: 2 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  stepLine:     { flex: 1, width: 1, marginVertical: 2 },
  stepContent:  { flex: 1, paddingBottom: 8 },
  stepCard: {
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  stepIn: { fontSize: 14, minHeight: 54, lineHeight: 20 },
  stepDel: { alignSelf: 'flex-end', marginTop: 6 },

  // Nutrition
  autoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, marginBottom: 10,
  },
  autoBannerTxt:  { flex: 1, fontSize: 12, fontWeight: '500' },
  autoBannerEdit: { fontSize: 12, fontWeight: '700', color: '#22C55E', textDecorationLine: 'underline' },
  autoRestore: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, marginBottom: 10,
  },
  autoRestoreTxt: { fontSize: 13, fontWeight: '600' },
  macroGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 4,
  },
  macroCell: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', gap: 2,
  },
  macroVal:  { fontSize: 20, fontWeight: '800', minWidth: 55, textAlign: 'center' },
  macroLbl:  { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  macroUnit: { fontSize: 10, textAlign: 'center' },

  // Classification
  subLbl: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chipWrap: { marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
  },
  chipTxt: { fontSize: 13, fontWeight: '600' },

  // Footer
  footer: {
    paddingTop: 10, paddingHorizontal: 16, borderTopWidth: 1,
  },
  saveBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
  saveBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },

  // Premium gate
  gate:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gateIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  gateTitle:   { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  gateMsg:     { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  gateBtn:     { borderRadius: 12, overflow: 'hidden' },
  gateBtnInner: { paddingHorizontal: 32, paddingVertical: 14 },
  gateBtnTxt:  { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});

export default RecipeFormScreen;
