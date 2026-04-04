import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme, useTheme, colors } from '../../theme';

export default function MediaPicker({ visible, onClose, onMediaSelected }) {
  const { isDark } = useTheme();

  const themedStyles = {
    containerBg: isDark ? colors.dark.surface : colors.light.surface,
    headerBorder: isDark ? colors.dark.border : colors.light.border,
    separatorBg: isDark ? colors.dark.backgroundTertiary : colors.light.backgroundSecondary,
    textPrimary: isDark ? colors.dark.text : colors.light.text,
    textSecondary: isDark ? colors.dark.textSecondary : colors.light.textSecondary,
    handleColor: isDark ? '#44444f' : '#d6d3d1',
    iconBg: isDark ? 'rgba(240, 164, 122, 0.12)' : 'rgba(240, 164, 122, 0.12)',
    optionBg: isDark ? colors.dark.surfaceElevated : colors.light.backgroundSecondary,
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
      allowsEditing: false,
      quality: 0.8,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
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

  const subtitles = {
    camera: 'Appareil photo',
    images: 'Galerie',
    videocam: 'Galerie vidéo',
    document: 'PDF, Word, texte',
  };

  const Option = ({ icon, text, subtitle, onPress, cancel }) => (
    <TouchableOpacity
      style={[
        styles.option,
        cancel && styles.cancelOption,
        !cancel && { backgroundColor: themedStyles.optionBg },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon && (
        <View style={[
          styles.iconWrapper,
          { backgroundColor: themedStyles.iconBg },
          cancel && styles.iconWrapperCancel,
        ]}>
          <Ionicons name={icon} size={28} color={cancel ? colors.error : colors.primary} />
        </View>
      )}
      <View style={styles.optionTextContainer}>
        <Text style={[
          styles.optionText,
          { color: cancel ? colors.error : themedStyles.textPrimary }
        ]}>
          {text}
        </Text>
        {subtitle && (
          <Text style={[styles.optionSubtitle, { color: themedStyles.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
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
            <Option icon="camera" text="Prendre une photo" subtitle={subtitles.camera} onPress={pickFromCamera} />
            <Option icon="images" text="Choisir une photo" subtitle={subtitles.images} onPress={pickPhotos} />
            <Option icon="videocam" text="Choisir une vidéo" subtitle={subtitles.videocam} onPress={pickVideo} />
            <Option icon="document" text="Choisir un fichier" subtitle={subtitles.document} onPress={pickDocument} />
          </View>

          <View style={[styles.separator, { backgroundColor: themedStyles.separatorBg }]} />

          {/* Cancel */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }]}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingTop: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderRadius: 14,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  separator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  cancelButton: {
    marginHorizontal: 14,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  cancelOption: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  safeBottom: {
    height: Platform.OS === 'ios' ? 44 : 20,
  },
});
