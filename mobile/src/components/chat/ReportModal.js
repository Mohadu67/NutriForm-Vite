import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme, useTheme } from '../../theme';
import { blurIntensity } from '../../theme/glassmorphism';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam ou publicité', icon: 'megaphone-outline' },
  { id: 'harassment', label: 'Harcèlement', icon: 'alert-circle-outline' },
  { id: 'inappropriate', label: 'Contenu inapproprié', icon: 'warning-outline' },
  { id: 'fake', label: 'Faux profil', icon: 'person-remove-outline' },
  { id: 'other', label: 'Autre raison', icon: 'help-circle-outline' },
];

export default function ReportModal({ visible, onClose, onSubmit, userName }) {
  const { isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Erreur', 'Veuillez sélectionner une raison');
      return;
    }

    if (selectedReason === 'other' && !description.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire la raison');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ reason: selectedReason, description: description.trim() });

      // Reset form
      setSelectedReason(null);
      setDescription('');
      onClose();

      Alert.alert('Merci', 'Votre signalement a été envoyé. Nous examinerons le cas.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReasonOption = ({ reason }) => (
    <TouchableOpacity
      style={[
        styles.reasonOption,
        selectedReason === reason.id && styles.reasonOptionSelected,
      ]}
      onPress={() => setSelectedReason(reason.id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={reason.icon}
        size={24}
        color={selectedReason === reason.id ? theme.colors.primary : theme.colors.text.secondary}
      />
      <Text
        style={[
          styles.reasonText,
          {
            color: selectedReason === reason.id ? theme.colors.primary : theme.colors.text.primary,
          },
        ]}
      >
        {reason.label}
      </Text>
      {selectedReason === reason.id && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView
          intensity={blurIntensity.strong}
          tint={isDark ? 'dark' : 'light'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Signaler {userName}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Pourquoi signalez-vous cet utilisateur ?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <ReasonOption key={reason.id} reason={reason} />
            ))}

            {selectedReason === 'other' && (
              <View style={styles.descriptionContainer}>
                <Text style={[styles.descriptionLabel, { color: theme.colors.text.primary }]}>
                  Décrivez la raison :
                </Text>
                <TextInput
                  style={[styles.descriptionInput, { color: theme.colors.text.primary }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Veuillez décrire le problème..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: theme.colors.text.tertiary }]}>
                  {description.length}/500
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.text.tertiary }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.primary }]}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Envoi...' : 'Envoyer'}
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    gap: 12,
  },
  reasonOptionSelected: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
