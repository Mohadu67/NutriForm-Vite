import React, { useState } from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

export default function MediaPreview({ visible, media, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!media?.url) return;

    try {
      setDownloading(true);

      const filename = media.filename || `media-${Date.now()}.${media.type === 'image' ? 'jpg' : 'mp4'}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(media.url, fileUri);

      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Succès', 'Fichier téléchargé avec succès');
        }
      }
    } catch (error) {
      console.error('Error downloading media:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    } finally {
      setDownloading(false);
    }
  };

  if (!media) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownload}
            style={styles.headerButton}
            disabled={downloading}
          >
            <Ionicons
              name={downloading ? 'hourglass' : 'download'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {media.type === 'image' && (
            <Image
              source={{ uri: media.url }}
              style={styles.image}
              resizeMode="contain"
            />
          )}

          {media.type === 'video' && (
            <Video
              source={{ uri: media.url }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
