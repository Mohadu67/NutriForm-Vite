import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RecipesScreen from '../../screens/recipes/RecipesScreen';
import RecipeDetailScreen from '../../screens/recipes/RecipeDetailScreen';
import RecipeFormScreen from '../../screens/recipes/RecipeFormScreen';

const Stack = createNativeStackNavigator();

export default function RecipesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen
        name="RecipeForm"
        component={RecipeFormScreen}
        options={{
          headerShown: true,
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
