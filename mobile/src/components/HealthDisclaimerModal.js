import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const DISCLAIMER_KEY = '@harmonith_health_disclaimer_accepted';

export default function HealthDisclaimerModal() {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    checkDisclaimerStatus();
  }, []);

  const checkDisclaimerStatus = async () => {
    try {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking disclaimer status:', error);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
      setVisible(false);
    } catch (error) {
      console.error('Error saving disclaimer status:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, isDark && styles.containerDark]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="fitness" size={32} color="#FFF" />
            </View>
            <Text style={[styles.title, isDark && styles.textWhite]}>
              Avertissement Sante
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.intro, isDark && styles.textMuted]}>
              Harmonith est une application de fitness a but informatif et educatif uniquement.
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <Text style={styles.warningText}>
                Les programmes et conseils fournis ne remplacent pas l'avis d'un professionnel de sante.
              </Text>
            </View>

            <View style={styles.bulletPoints}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.bulletText, isDark && styles.textMuted]}>
                  Consultez votre medecin avant de commencer tout programme d'exercice, en particulier si vous avez des problemes de sante preexistants.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.bulletText, isDark && styles.textMuted]}>
                  Arretez immediatement l'exercice en cas de douleur, malaise ou essoufflement anormal.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.bulletText, isDark && styles.textMuted]}>
                  Les resultats varient selon les individus et ne sont pas garantis.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.bulletText, isDark && styles.textMuted]}>
                  Les calculs nutritionnels et caloriques sont des estimations et peuvent varier.
                </Text>
              </View>
            </View>

            <Text style={[styles.disclaimer, isDark && styles.textMuted]}>
              En utilisant cette application, vous reconnaissez que vous faites de l'exercice a vos propres risques et que vous avez lu et compris cet avertissement.
            </Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>
                J'ai lu et j'accepte
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  textWhite: {
    color: '#FFF',
  },
  textMuted: {
    color: '#AAA',
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  intro: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 20,
  },
  bulletPoints: {
    marginBottom: 20,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
