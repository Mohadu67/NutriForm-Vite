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
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductByBarcode } from '../api/barcode';
import { theme } from '../theme';

export default function BarcodeScannerModal({ visible, onClose, onProductFound }) {
  const isDark = useColorScheme() === 'dark';
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState('scan');
  const [product, setProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  // Délai court pour éviter le scan immédiat dès l'ouverture
  const [cameraReady, setCameraReady] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setStep('scan');
      setProduct(null);
      setErrorMsg('');
      setManualCode('');
      scannedRef.current = false;
      // Laisser la modal s'animer avant d'activer le scan
      const t = setTimeout(() => setCameraReady(true), 600);
      return () => clearTimeout(t);
    } else {
      setCameraReady(false);
    }
  }, [visible]);

  const handleBarcodeScan = async ({ data }) => {
    if (scannedRef.current || !cameraReady) return;
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
    // Re-arm camera
    setCameraReady(false);
    setTimeout(() => setCameraReady(true), 300);
  };

  const handleUseProduct = () => {
    if (product) { onProductFound(product); onClose(); }
  };

  const requestAndScan = async () => {
    const { granted } = await requestPermission();
    if (!granted) setStep('manual');
  };

  const bg = isDark ? '#1A1A1A' : '#fff';
  const text = isDark ? '#E0E0E0' : '#1f2937';
  const muted = isDark ? '#888' : '#6b7280';
  const border = isDark ? '#333' : '#e5e7eb';
  const inputBg = isDark ? '#2A2A2A' : '#f9fafb';

  const renderContent = () => {
    // Permissions en cours de chargement
    if (!permission) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    // Permission non accordée
    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={52} color={muted} />
          <Text style={[styles.errorText, { color: text, marginTop: 12 }]}>
            L'accès à la caméra est nécessaire pour scanner un code-barres.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
            onPress={requestAndScan}
          >
            <Text style={styles.primaryBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>
              Entrer le code manuellement
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Vue caméra
    if (step === 'scan') {
      return (
        <View style={styles.scanContainer}>
          {/* CameraView monté seulement quand modal visible + délai écoulé */}
          {cameraReady && (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean8', 'ean13', 'upc_a', 'upc_e', 'code128'],
              }}
              onBarcodeScanned={handleBarcodeScan}
            >
              <View style={styles.cameraOverlay} pointerEvents="none">
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Text style={styles.scanHint}>Pointez vers le code-barres</Text>
              </View>
            </CameraView>
          )}
          {!cameraReady && (
            <View style={[styles.camera, styles.cameraPlaceholder]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          <TouchableOpacity style={styles.manualLink} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>
              Entrer le code manuellement
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Saisie manuelle
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
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.colors.primary },
              !/^\d{8,14}$/.test(manualCode) && styles.btnDisabled,
            ]}
            onPress={handleManualSubmit}
            disabled={!/^\d{8,14}$/.test(manualCode)}
          >
            <Text style={styles.primaryBtnText}>Rechercher</Text>
          </TouchableOpacity>
          {permission?.granted && (
            <TouchableOpacity style={styles.linkBtn} onPress={handleRescan}>
              <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>
                ← Revenir à la caméra
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Chargement
    if (step === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.hint, { color: muted, marginTop: 12 }]}>Recherche du produit…</Text>
        </View>
      );
    }

    // Erreur
    if (step === 'error') {
      return (
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="close" size={26} color="#dc2626" />
          </View>
          <Text style={[styles.errorText, { color: text }]}>{errorMsg}</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, marginTop: 8 }]}
            onPress={handleRescan}
          >
            <Text style={styles.primaryBtnText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('manual')}>
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>
              Saisir manuellement
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Résultat
    if (step === 'result' && product) {
      return (
        <View style={styles.result}>
          <View style={[styles.productHeader, { backgroundColor: inputBg, borderColor: border }]}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImg}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.productImgPlaceholder, { borderColor: border }]}>
                <Ionicons name="barcode-outline" size={30} color={muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: text }]} numberOfLines={2}>
                {product.name || 'Produit sans nom'}
              </Text>
              {product.brand ? (
                <Text style={[styles.productMeta, { color: muted }]}>{product.brand}</Text>
              ) : null}
              {product.quantity ? (
                <Text style={[styles.productMeta, { color: muted }]}>{product.quantity}</Text>
              ) : null}
            </View>
          </View>

          <Text style={[styles.perLabel, { color: muted }]}>Valeurs nutritionnelles pour 100g</Text>

          <View style={styles.macrosRow}>
            {[
              { label: 'kcal', value: product.nutrition.calories },
              { label: 'Prot.', value: `${product.nutrition.proteins}g` },
              { label: 'Gluc.', value: `${product.nutrition.carbs}g` },
              { label: 'Lip.', value: `${product.nutrition.fats}g` },
            ].map((m) => (
              <View
                key={m.label}
                style={[styles.macroItem, { backgroundColor: inputBg, borderColor: border }]}
              >
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
    <Modal
      visible={visible}
      animationType="slide"
      // PAS de presentationStyle — cause des bugs caméra sur iOS avec New Arch
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { borderBottomColor: border }]}>
          <Text style={[styles.headerTitle, { color: text }]}>Scanner un produit</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={text} />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>{renderContent()}</View>
      </SafeAreaView>
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  body: { flex: 1, padding: 20 },

  // Scanner
  scanContainer: { flex: 1, gap: 16 },
  camera: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: Platform.OS === 'ios' ? 340 : 300,
  },
  cameraPlaceholder: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 200, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: theme.colors.primary, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanHint: {
    color: '#fff',
    fontSize: 13,
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    overflow: 'hidden',
  },
  manualLink: { alignItems: 'center' },

  // Manual
  manualForm: { gap: 14 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    letterSpacing: 1.5,
  },

  // States
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  hint: { fontSize: 14, textAlign: 'center' },
  errorIcon: {
    width: 52, height: 52,
    backgroundColor: '#fee2e2',
    borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  // Result
  result: { gap: 14 },
  productHeader: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  productImg: { width: 66, height: 66, borderRadius: 10, backgroundColor: '#fff' },
  productImgPlaceholder: {
    width: 66, height: 66, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  productName: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  productMeta: { fontSize: 12, marginTop: 3 },
  perLabel: { fontSize: 12, textAlign: 'center' },
  macrosRow: { flexDirection: 'row', gap: 8 },
  macroItem: {
    flex: 1, alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  macroValue: { fontSize: 15, fontWeight: '700' },
  macroLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },

  // Buttons
  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5 },
  secondaryBtnText: { fontWeight: '500', fontSize: 14 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { fontSize: 14, textDecorationLine: 'underline' },
});
