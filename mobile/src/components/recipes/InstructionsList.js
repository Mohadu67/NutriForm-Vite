import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const InstructionsList = ({ instructions }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>
        Préparation
      </Text>

      {instructions.map((instruction, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={[styles.stepText, isDark && styles.stepTextDark]}>
            {instruction}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginBottom: theme.spacing.md,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  step: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: '#1a1a1a',
    lineHeight: 20,
    paddingTop: 4,
  },
  stepTextDark: {
    color: '#FFFFFF',
  },
});

export default InstructionsList;
