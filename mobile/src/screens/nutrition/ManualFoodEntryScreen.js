import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { theme } from '../../theme';
import { addFoodLog, updateFoodLog } from '../../api/nutrition';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Petit-déjeuner', icon: 'sunny-outline' },
  { value: 'lunch', label: 'Déjeuner', icon: 'partly-sunny-outline' },
  { value: 'dinner', label: 'Dîner', icon: 'moon-outline' },
  { value: 'snack', label: 'Collation', icon: 'nutrition-outline' },
];

export default function ManualFoodEntryScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType: defaultMealType, date, entry: editEntry } = route.params || {};
  const isEdit = Boolean(editEntry);

  const [name, setName] = useState(editEntry?.name || '');
  const [mealType, setMealType] = useState(editEntry?.mealType || defaultMealType || 'lunch');
  const [calories, setCalories] = useState(editEntry?.nutrition?.calories ? String(editEntry.nutrition.calories) : '');
  const [proteins, setProteins] = useState(editEntry?.nutrition?.proteins ? String(editEntry.nutrition.proteins) : '');
  const [carbs, setCarbs] = useState(editEntry?.nutrition?.carbs ? String(editEntry.nutrition.carbs) : '');
  const [fats, setFats] = useState(editEntry?.nutrition?.fats ? String(editEntry.nutrition.fats) : '');
  const [fiber, setFiber] = useState(editEntry?.nutrition?.fiber ? String(editEntry.nutrition.fiber) : '');
  const [notes, setNotes] = useState(editEntry?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState('100');

  const applyQuantity = (per100, grams, productName) => {
    const ratio = grams / 100;
    setName(`${productName} (${grams}g)`);
    setCalories(String(Math.round(per100.calories * ratio)));
    setProteins(String(Math.round(per100.proteins * ratio * 10) / 10));
    setCarbs(String(Math.round(per100.carbs * ratio * 10) / 10));
    setFats(String(Math.round(per100.fats * ratio * 10) / 10));
    setFiber(String(Math.round((per100.fiber || 0) * ratio * 10) / 10));
  };

  const handleQuantityChange = (val) => {
    setQuantity(val);
    const grams = Number(val) || 0;
    if (scannedProduct?.per100 && grams > 0) {
      applyQuantity(scannedProduct.per100, grams, scannedProduct.name);
    }
  };

  const handleProductFound = (product) => {
    const productName = product.name + (product.brand ? ` – ${product.brand}` : '');
    const defaultQty = product.defaultPortionG || 100;
    setScannedProduct({
      name: productName,
      imageUrl: product.imageUrl,
      productQuantity: product.quantity,
      per100: { ...product.nutrition },
    });
    setQuantity(String(defaultQty));
    applyQuantity(product.nutrition, defaultQty, productName);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !calories) {
      Alert.alert('Champs requis', 'Le nom et les calories sont obligatoires.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        mealType,
        nutrition: {
          calories: Number(calories),
          proteins: Number(proteins) || 0,
          carbs: Number(carbs) || 0,
          fats: Number(fats) || 0,
          fiber: Number(fiber) || 0,
        },
        notes: notes.trim() || undefined,
      };

      let result;
      if (isEdit) {
        result = await updateFoodLog(editEntry._id, payload);
      } else {
        payload.date = date || new Date().toISOString().split('T')[0];
        result = await addFoodLog(payload);
      }

      if (result.success) {
        navigation.goBack();
      } else if (result.errorData?.error === 'free_limit_reached') {
        Alert.alert('Limite atteinte', result.errorData.message);
      } else {
        Alert.alert('Erreur', result.error || (isEdit ? 'Impossible de modifier l\'aliment.' : 'Impossible d\'ajouter l\'aliment.'));
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onProductFound={handleProductFound}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>{isEdit ? 'Modifier l\'aliment' : 'Ajouter un aliment'}</Text>
        {!isEdit ? (
          <TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.scanBtn}>
            <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Scanned product card + quantity */}
          {scannedProduct && (
            <View style={[styles.scannedCard, isDark && styles.scannedCardDark]}>
              <Text style={[styles.scannedName, isDark && { color: '#FFF' }]}>{scannedProduct.name}</Text>
              {scannedProduct.productQuantity && (
                <Text style={styles.scannedHint}>Conditionnement : {scannedProduct.productQuantity}</Text>
              )}
              <Text style={styles.scannedPer100}>
                Pour 100g : {scannedProduct.per100.calories}kcal · {scannedProduct.per100.proteins}g prot · {scannedProduct.per100.carbs}g gluc · {scannedProduct.per100.fats}g lip
              </Text>
              <View style={styles.field}>
                <Text style={[styles.label, isDark && styles.labelDark]}>Quantité consommée (g)</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark, { fontSize: 18, fontWeight: '700' }]}
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.presetsRow}>
                {[50, 100, 150, 200, 250, 300].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.presetBtn, String(g) === quantity && styles.presetBtnActive]}
                    onPress={() => handleQuantityChange(String(g))}
                  >
                    <Text style={[styles.presetText, String(g) === quantity && styles.presetTextActive]}>{g}g</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Nom de l'aliment *</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Poulet grillé"
              placeholderTextColor="#999"
              maxLength={200}
            />
          </View>

          {/* Meal Type */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Type de repas</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.mealTypeBtn,
                    isDark && styles.mealTypeBtnDark,
                    mealType === opt.value && styles.mealTypeBtnActive,
                  ]}
                  onPress={() => setMealType(opt.value)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={mealType === opt.value ? '#FFF' : isDark ? '#AAA' : '#666'}
                  />
                  <Text style={[
                    styles.mealTypeBtnText,
                    mealType === opt.value && styles.mealTypeBtnTextActive,
                    isDark && mealType !== opt.value && styles.mealTypeBtnTextDark,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calories */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Calories (kcal) *</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Macros row */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Protéines (g)</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={proteins}
                onChangeText={setProteins}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Glucides (g)</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Lipides (g)</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={fats}
              onChangeText={setFats}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Fiber */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Fibres (g)</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={fiber}
              onChangeText={setFiber}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, isDark && styles.inputDark]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes optionnelles..."
              placeholderTextColor="#999"
              multiline
              maxLength={300}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? (isEdit ? 'Modification...' : 'Ajout en cours...') : (isEdit ? 'Modifier' : 'Ajouter')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.light },
  containerDark: { backgroundColor: '#1A1A1A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 4 },
  scanBtn: { padding: 4 },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semiBold, color: '#000' },
  titleDark: { color: '#FFF' },
  form: { padding: theme.spacing.lg, paddingBottom: 180 },
  field: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: '#555', marginBottom: 6 },
  labelDark: { color: '#AAA' },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: '#333',
  },
  inputDark: { backgroundColor: '#2A2A2A', borderColor: '#444', color: '#E0E0E0' },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  mealTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  mealTypeBtnDark: { backgroundColor: '#2A2A2A', borderColor: '#444' },
  mealTypeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  mealTypeBtnText: { fontSize: theme.fontSize.xs, color: '#666' },
  mealTypeBtnTextDark: { color: '#AAA' },
  mealTypeBtnTextActive: { color: '#FFF', fontWeight: theme.fontWeight.semiBold },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold },
  // Scanned product card
  scannedCard: {
    backgroundColor: '#f3f9f7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  scannedCardDark: { backgroundColor: 'rgba(114, 186, 161, 0.08)' },
  scannedName: { fontWeight: '700', fontSize: 15, color: '#1c1917' },
  scannedHint: { fontSize: 12, color: '#a8a29e' },
  scannedPer100: { fontSize: 12, color: '#5aa48a', fontWeight: '600' },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2dfdb',
    backgroundColor: 'transparent',
  },
  presetBtnActive: {
    backgroundColor: '#72baa1',
    borderColor: '#72baa1',
  },
  presetText: { fontSize: 13, fontWeight: '600', color: '#57534e' },
  presetTextActive: { color: '#fff' },
});
