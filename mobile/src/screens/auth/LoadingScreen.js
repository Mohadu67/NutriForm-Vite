import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const LoadingScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={styles.logoHarmo}>Harmo</Text>
          <Text style={styles.logoNith}>Nith</Text>
        </Text>
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.loader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoHarmo: {
    color: theme.colors.primary,
  },
  logoNith: {
    color: theme.colors.secondary,
  },
  loader: {
    marginTop: 24,
  },
});

export default LoadingScreen;
