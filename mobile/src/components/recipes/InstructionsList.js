import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

const InstructionsList = ({ instructions }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>
        Preparation
      </Text>

      {instructions.map((instruction, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.stepIndicator}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            {index < instructions.length - 1 && (
              <View style={[styles.connector, isDark && styles.connectorDark]} />
            )}
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
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginVertical: 12,
  },
  containerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 16,
  },
  titleDark: {
    color: '#f3f3f6',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#72baa1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#efedea',
    marginVertical: 4,
  },
  connectorDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1c1917',
    lineHeight: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  stepTextDark: {
    color: '#f3f3f6',
  },
});

export default InstructionsList;
