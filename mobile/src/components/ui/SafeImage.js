import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import logger from '../../utils/logger';

/**
 * Composant Image avec gestion d'erreur et placeholder
 * Utilise un placeholder par défaut si l'image ne charge pas
 */
const SafeImage = ({
  source,
  defaultSource,
  style,
  placeholderIcon = 'image-outline',
  placeholderColor = '#9CA3AF',
  placeholderSize = 40,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error) => {
    logger.warn('SafeImage: Failed to load image', {
      uri: source?.uri,
      error: error.nativeEvent?.error,
    });
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Si erreur et pas de defaultSource, afficher le placeholder
  if (hasError && !defaultSource) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons
          name={placeholderIcon}
          size={placeholderSize}
          color={placeholderColor}
        />
      </View>
    );
  }

  return (
    <Image
      source={hasError ? defaultSource : source}
      defaultSource={defaultSource}
      onError={handleError}
      onLoad={handleLoad}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SafeImage;
