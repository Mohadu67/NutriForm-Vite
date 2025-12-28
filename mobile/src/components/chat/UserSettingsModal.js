import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useTheme } from '../../theme';
import Avatar from '../ui/Avatar';

export default function UserSettingsModal({ visible, onClose, user, onAction }) {
  const { isDark } = useTheme();

  const themedStyles = {
    containerBg: isDark ? '#1C1C1E' : '#FFFFFF',
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    separatorBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    handleColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
  };

  const displayName = user?.pseudo || user?.prenom || 'Utilisateur';
  const avatarUrl = user?.profile?.profilePicture || user?.photo;
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const handleAction = (action) => {
    onClose();
    setTimeout(() => {
      onAction?.(action);
    }, 300);
  };

  const handleBlock = () => {
    Alert.alert(
      'Bloquer cet utilisateur',
      'Vous ne recevrez plus de messages de cette personne.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: () => handleAction('block'),
        },
      ]
    );
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      'Supprimer la conversation',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleAction('delete'),
        },
      ]
    );
  };

  const Option = ({ icon, text, onPress, danger }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.iconWrapper, danger && styles.iconWrapperDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? theme.colors.error : theme.colors.primary}
        />
      </View>
      <Text
        style={[
          styles.optionText,
          { color: danger ? theme.colors.error : themedStyles.textPrimary },
        ]}
      >
        {text}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={themedStyles.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Overlay cliquable */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <View style={[styles.bottomSheet, { backgroundColor: themedStyles.containerBg }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: themedStyles.handleColor }]} />
          </View>

          {/* User Info Header */}
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <Avatar source={avatarUrl} size="xl" fallback={initials} />
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={[styles.userName, { color: themedStyles.textPrimary }]}>
              {displayName}
            </Text>
            {user?.prenom && user?.pseudo !== user?.prenom && (
              <Text style={[styles.userSubtext, { color: themedStyles.textSecondary }]}>
                {user.prenom}
              </Text>
            )}
          </View>

          <View style={[styles.separator, { backgroundColor: themedStyles.separatorBg }]} />

          {/* Options */}
          <View style={styles.optionsContainer}>
            <Option
              icon="person-outline"
              text="Voir le profil"
              onPress={() => handleAction('viewProfile')}
            />
            <Option
              icon="notifications-off-outline"
              text="Désactiver les notifications"
              onPress={() => handleAction('mute')}
            />
            <Option
              icon="flag-outline"
              text="Signaler"
              onPress={() => handleAction('report')}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: themedStyles.separatorBg }]} />

          {/* Danger zone */}
          <View style={styles.optionsContainer}>
            <Option
              icon="ban-outline"
              text="Bloquer"
              onPress={handleBlock}
              danger
            />
            <Option
              icon="trash-outline"
              text="Supprimer la conversation"
              onPress={handleDeleteConversation}
              danger
            />
          </View>

          <View style={[styles.separator, { backgroundColor: themedStyles.separatorBg }]} />

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.6}>
            <Text style={[styles.cancelText, { color: themedStyles.textPrimary }]}>
              Fermer
            </Text>
          </TouchableOpacity>

          {/* Safe area bottom */}
          <View style={styles.safeBottom} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  userHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userSubtext: {
    fontSize: 15,
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  optionsContainer: {
    paddingVertical: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  safeBottom: {
    height: Platform.OS === 'ios' ? 34 : 16,
  },
});
