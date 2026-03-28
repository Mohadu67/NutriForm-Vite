import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductByBarcode } from '../api/barcode';
import { theme } from '../theme';

export default function BarcodeScannerModal({ visible, onClose, onProductFound }) {
  const isDark = useColorScheme() === 'dark';
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState('scan'); // 'scan' | 'loading' | 'result' | 'error' | 'manual'
  const [product, setProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setStep('scan');
      setProduct(null);
      setErrorMsg('');
      setManualCode('');
      scannedRef.current = false;
    }
  }, [visible]);

  const handleBarcodeScan = async ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    await fetchProduct(data);
  };

  const fetchProduct = async (barcode) => {
    setStep('loading');
    const result = await getProductByBarcode(barcode);
    if (result.success) {
      setProduct(result.product);
      setStep('result');
    } else {
      setErrorMsg(result.error);
      setStep('error');
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!/^\d{8,14}$/.test(code)) {
      Alert.alert('Code invalide', 'Entrez un code EAN-8 ou EAN-13 (8 à 14 chiffres).');
      return;
    }
    fetchProduct(code);
  };

  const handleRescan = () => {
    scannedRef.current = false;
    setProduct(null);
    setErrorMsg('');
    setManualCode('');
    setStep('scan');
  };

  const handleUseProduct = () => {
    if (product) {
      onProductFound(product);
      onClose();
    }
  };

  const requestAndScan = async () => {
    const { granted } = await requestPermission();
    if (!granted) {
      setStep('manual');
    }
  };

  const bg = isDark ? '#1A1A1A' : '#fff';
  const text = isDark ? '#E0E0E0' : '#1f2937';
  const muted = isDark ? '#888' : '#6b7280';
  const border = isDark ? '#333' : '#e5e7eb';
  const inputBg = isDark ? '#2A2A2A' : '#f9fafb';

  const renderContent = () => {
    if (!permission) {
      return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />;
    }

    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={48} color={muted} />
          <Text style={[styles.errorText, { color: text }]}>
            L'accès à la caméra est nécessaire pour scanner un code-barres.
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={requestAndScan}>
            <Text style={styles.primaryBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>Entrer le code manuellement</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'scan') {
      return (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'upc_a', 'upc_e', 'code128'] }}
            onBarcodeScanned={handleBarcodeScan}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanHint}>Pointez vers le code-barres</Text>
            </View>
          </CameraView>
          <TouchableOpacity style={styles.manualLink} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>Entrer le code manuellement</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'manual') {
      return (
        <View style={styles.manualForm}>
          <Text style={[styles.label, { color: text }]}>Code-barres (EAN-8 / EAN-13)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text }]}
            value={manualCode}
            onChangeText={(v) => setManualCode(v.replace(/\D/g, ''))}
            placeholder="Ex : 3017620422003"
            placeholderTextColor={muted}
            keyboardType="numeric"
            maxLength={14}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: /^\d{8,14}$/.test(manualCode) ? 1 : 0.4 }]}
            onPress={handleManualSubmit}
            disabled={!/^\d{8,14}$/.test(manualCode)}
          >
            <Text style={styles.primaryBtnText}>Rechercher</Text>
          </TouchableOpacity>
          {permission?.granted && (
            <TouchableOpacity style={styles.linkBtn} onPress={handleRescan}>
              <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>← Revenir à la caméra</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (step === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.hint, { color: muted }]}>Recherche du produit…</Text>
        </View>
      );
    }

    if (step === 'error') {
      return (
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="close" size={24} color="#dc2626" />
          </View>
          <Text style={[styles.errorText, { color: text }]}>{errorMsg}</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={handleRescan}>
            <Text style={styles.primaryBtnText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>Saisir manuellement</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'result' && product) {
      return (
        <View style={styles.result}>
          <View style={[styles.productHeader, { backgroundColor: inputBg, borderColor: border }]}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImg} resizeMode="contain" />
            ) : (
              <View style={[styles.productImgPlaceholder, { borderColor: border }]}>
                <Ionicons name="barcode-outline" size={28} color={muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: text }]} numberOfLines={2}>
                {product.name || 'Produit sans nom'}
              </Text>
              {product.brand ? <Text style={[styles.productMeta, { color: muted }]}>{product.brand}</Text> : null}
              {product.quantity ? <Text style={[styles.productMeta, { color: muted }]}>{product.quantity}</Text> : null}
            </View>
          </View>

          <Text style={[styles.perLabel, { color: muted }]}>Valeurs nutritionnelles pour 100g</Text>

          <View style={styles.macrosRow}>
            {[
              { label: 'kcal', value: product.nutrition.calories },
              { label: 'Protéines', value: `${product.nutrition.proteins}g` },
              { label: 'Glucides', value: `${product.nutrition.carbs}g` },
              { label: 'Lipides', value: `${product.nutrition.fats}g` },
            ].map((m) => (
              <View key={m.label} style={[styles.macroItem, { backgroundColor: inputBg, borderColor: border }]}>
                <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{m.value}</Text>
                <Text style={[styles.macroLabel, { color: muted }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleUseProduct}
          >
            <Text style={styles.primaryBtnText}>Utiliser ce produit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: border }]}
            onPress={handleRescan}
          >
            <Text style={[styles.secondaryBtnText, { color: text }]}>Rescanner</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { borderBottomColor: border }]}>
          <Text style={[styles.headerTitle, { color: text }]}>Scanner un produit</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={text} />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  body: { flex: 1, padding: 20 },

  // Caméra
  cameraContainer: { flex: 1 },
  camera: { flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 300 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanHint: { color: '#fff', fontSize: 13, marginTop: 20, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  manualLink: { alignItems: 'center', marginTop: 16 },

  // Manual
  manualForm: { gap: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 1,
  },

  // Centered states
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  hint: { fontSize: 14, textAlign: 'center' },
  errorIcon: {
    width: 48, height: 48,
    backgroundColor: '#fee2e2',
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  // Result
  result: { gap: 14 },
  productHeader: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  productImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#fff' },
  productImgPlaceholder: {
    width: 64, height: 64,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  productName: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  productMeta: { fontSize: 12, marginTop: 2 },
  perLabel: { fontSize: 12, textAlign: 'center' },
  macrosRow: { flexDirection: 'row', gap: 8 },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  macroValue: { fontSize: 15, fontWeight: '700' },
  macroLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },

  // Buttons
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontWeight: '500', fontSize: 14 },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkBtnText: { fontSize: 14, textDecorationLine: 'underline' },
});
