import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const IngredientList = ({ ingredients, servings }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [checkedItems, setCheckedItems] = useState([]);

  const toggleCheck = (index) => {
    setCheckedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Ingrédients
        </Text>
        <Text style={[styles.servings, isDark && styles.servingsDark]}>
          Pour {servings} personne{servings > 1 ? 's' : ''}
        </Text>
      </View>

      {ingredients.map((ingredient, index) => {
        const isChecked = checkedItems.includes(index);
        return (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={() => toggleCheck(index)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              isChecked && styles.checkboxChecked,
              isDark && !isChecked && styles.checkboxDark,
            ]}>
              {isChecked && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={[
              styles.ingredientText,
              isChecked && styles.ingredientTextChecked,
              isDark && !isChecked && styles.ingredientTextDark,
            ]}>
              {ingredient.quantity && `${ingredient.quantity} `}
              {ingredient.unit && `${ingredient.unit} `}
              {ingredient.name}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  servings: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  servingsDark: {
    color: '#888',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxDark: {
    borderColor: '#555',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ingredientText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: '#1a1a1a',
  },
  ingredientTextDark: {
    color: '#FFFFFF',
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});

export default IngredientList;
