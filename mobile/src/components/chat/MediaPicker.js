import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme, useTheme } from '../../theme';

export default function MediaPicker({ visible, onClose, onMediaSelected }) {
  const { isDark } = useTheme();

  const themedStyles = {
    containerBg: isDark ? '#1C1C1E' : '#FFFFFF',
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    separatorBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1A',
    handleColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
  };

  const requestPermissions = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else if (type === 'media') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
    return true;
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) {
      alert('Permission refusée', 'L\'accès à la caméra est requis');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelected({
        uri: asset.uri,
        type: 'image/jpeg',
        filename: `photo-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
      onClose();
    }
  };

  const pickPhotos = async () => {
    const hasPermission = await requestPermissions('media');
    if (!hasPermission) {
      alert('Permission refusée', 'L\'accès à la galerie est requis');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileExtension = asset.uri.split('.').pop().toLowerCase();
      onMediaSelected({
        uri: asset.uri,
        filename: `image-${Date.now()}.${fileExtension}`,
        mimeType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
      });
      onClose();
    }
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions('media');
    if (!hasPermission) {
      alert('Permission refusée', 'L\'accès à la galerie est requis');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onMediaSelected({
        uri: asset.uri,
        filename: `video-${Date.now()}.mp4`,
        mimeType: 'video/mp4',
      });
      onClose();
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        onMediaSelected({
          uri: result.uri,
          filename: result.name,
          mimeType: result.mimeType || 'application/pdf',
        });
        onClose();
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const Option = ({ icon, text, onPress, cancel }) => (
    <TouchableOpacity
      style={[styles.option, cancel && styles.cancelOption]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon && (
        <View style={[styles.iconWrapper, cancel && styles.iconWrapperCancel]}>
          <Ionicons name={icon} size={22} color={cancel ? theme.colors.error : theme.colors.primary} />
        </View>
      )}
      <Text style={[
        styles.optionText,
        { color: cancel ? theme.colors.error : themedStyles.textPrimary }
      ]}>
        {text}
      </Text>
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

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themedStyles.headerBorder }]}>
            <Text style={[styles.title, { color: themedStyles.textPrimary }]}>
              Envoyer un média
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <Option icon="camera" text="Prendre une photo" onPress={pickFromCamera} />
            <Option icon="images" text="Choisir une photo" onPress={pickPhotos} />
            <Option icon="videocam" text="Choisir une vidéo" onPress={pickVideo} />
            <Option icon="document" text="Choisir un fichier" onPress={pickDocument} />
          </View>

          <View style={[styles.separator, { backgroundColor: themedStyles.separatorBg }]} />

          {/* Cancel */}
          <Option text="Annuler" cancel onPress={onClose} />

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
  header: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperCancel: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 8,
    marginVertical: 4,
  },
  cancelOption: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  safeBottom: {
    height: Platform.OS === 'ios' ? 34 : 16,
  },
});
