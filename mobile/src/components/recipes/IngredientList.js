import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          Ingredients
        </Text>
        <View style={[styles.servingsBadge, isDark && styles.servingsBadgeDark]}>
          <Ionicons name="remove" size={16} color="#72baa1" />
          <Text style={[styles.servingsText, isDark && styles.servingsTextDark]}>
            {servings} personne{servings > 1 ? 's' : ''}
          </Text>
          <Ionicons name="add" size={16} color="#72baa1" />
        </View>
      </View>

      {ingredients.map((ingredient, index) => {
        const isChecked = checkedItems.includes(index);
        return (
          <TouchableOpacity
            key={index}
            style={[styles.item, index < ingredients.length - 1 && styles.itemBorder, isDark && index < ingredients.length - 1 && styles.itemBorderDark]}
            onPress={() => toggleCheck(index)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              isChecked && styles.checkboxChecked,
              isDark && !isChecked && styles.checkboxDark,
            ]}>
              {isChecked && (
                <Ionicons name="checkmark" size={14} color="#FFF" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
  },
  titleDark: {
    color: '#f3f3f6',
  },
  servingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  servingsBadgeDark: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  servingsText: {
    fontSize: 12,
    color: '#78716c',
    fontWeight: '600',
  },
  servingsTextDark: {
    color: '#c1c1cb',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  itemBorderDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#efedea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDark: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  checkboxChecked: {
    backgroundColor: '#72baa1',
    borderColor: '#72baa1',
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#1c1917',
  },
  ingredientTextDark: {
    color: '#f3f3f6',
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: '#a8a29e',
  },
});

export default IngredientList;
