import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { theme } from '../../theme';

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const GOAL_HINTS = {
  1: 'Parfait pour débuter doucement',
  2: 'Parfait pour débuter doucement',
  3: 'Un bon équilibre repos/effort',
  4: 'Idéal pour progresser',
  5: 'Pour les sportifs réguliers',
  6: 'Mode intensif activé !',
  7: 'Mode intensif activé !',
};

/**
 * Modal de sélection de l'objectif hebdomadaire (nombre de séances/semaine).
 */
export function GoalModal({ visible, currentGoal, onSave, onClose }) {
  const isDark = useColorScheme() === 'dark';
  const [tempGoal, setTempGoal] = useState(currentGoal);

  // Sync quand le modal s'ouvre avec une nouvelle valeur
  const handleShow = useCallback(() => {
    setTempGoal(currentGoal);
  }, [currentGoal]);

  const handleSave = useCallback(() => {
    onSave(tempGoal);
    onClose();
  }, [tempGoal, onSave, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.content, isDark && styles.contentDark]}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Objectif hebdomadaire
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Combien de séances par semaine ?
          </Text>

          <View style={styles.options}>
            {GOAL_OPTIONS.map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.option,
                  tempGoal === num && styles.optionActive,
                  isDark && tempGoal !== num && styles.optionDark,
                ]}
                onPress={() => setTempGoal(num)}
              >
                <Text
                  style={[
                    styles.optionText,
                    tempGoal === num && styles.optionTextActive,
                    isDark && tempGoal !== num && styles.optionTextDark,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.hint, isDark && styles.hintDark]}>
            {GOAL_HINTS[tempGoal] || ''}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isDark && styles.cancelButtonDark]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, isDark && styles.cancelTextDark]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  contentDark: {
    backgroundColor: '#2A2A2A',
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  subtitleDark: {
    color: '#888888',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  option: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: theme.colors.primary,
  },
  optionDark: {
    backgroundColor: '#3A3A3A',
  },
  optionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionTextDark: {
    color: '#888888',
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  hintDark: {
    color: '#888888',
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonDark: {
    backgroundColor: '#3A3A3A',
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  cancelTextDark: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#FFFFFF',
  },
});
