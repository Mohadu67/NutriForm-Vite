import { useReducer, useCallback } from 'react';

const INITIAL_STATE = {
  title: '',
  description: '',
  image: '',
  category: 'salty',
  difficulty: 'medium',
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  isPremium: false,
  isPublished: true,
  isOfficial: true,
  nutrition: { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 },
  goal: [],
  mealType: [],
  tags: [],
  dietType: ['none'],
  ingredients: [{ name: '', quantity: '', unit: '', optional: false }],
  instructions: [''],
};

function recipeFormReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_NUTRITION':
      return {
        ...state,
        nutrition: { ...state.nutrition, [action.field]: action.value },
      };

    case 'TOGGLE_ARRAY':
      const currentArray = state[action.field];
      return {
        ...state,
        [action.field]: currentArray.includes(action.value)
          ? currentArray.filter(v => v !== action.value)
          : [...currentArray, action.value],
      };

    case 'SET_INGREDIENT':
      const newIngredients = [...state.ingredients];
      newIngredients[action.index] = {
        ...newIngredients[action.index],
        [action.field]: action.value,
      };
      return { ...state, ingredients: newIngredients };

    case 'ADD_INGREDIENT':
      return {
        ...state,
        ingredients: [
          ...state.ingredients,
          { name: '', quantity: '', unit: '', optional: false },
        ],
      };

    case 'REMOVE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.filter((_, i) => i !== action.index),
      };

    case 'SET_INSTRUCTION':
      const newInstructions = [...state.instructions];
      newInstructions[action.index] = action.value;
      return { ...state, instructions: newInstructions };

    case 'ADD_INSTRUCTION':
      return { ...state, instructions: [...state.instructions, ''] };

    case 'REMOVE_INSTRUCTION':
      return {
        ...state,
        instructions: state.instructions.filter((_, i) => i !== action.index),
      };

    case 'LOAD_RECIPE':
      return { ...state, ...action.recipe };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

export function useRecipeForm(initialData = null) {
  const [state, dispatch] = useReducer(
    recipeFormReducer,
    initialData || INITIAL_STATE
  );

  const setField = useCallback((field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setNutrition = useCallback((field, value) => {
    dispatch({ type: 'SET_NUTRITION', field, value });
  }, []);

  const toggleArray = useCallback((field, value) => {
    dispatch({ type: 'TOGGLE_ARRAY', field, value });
  }, []);

  const setIngredient = useCallback((index, field, value) => {
    dispatch({ type: 'SET_INGREDIENT', index, field, value });
  }, []);

  const addIngredient = useCallback(() => {
    dispatch({ type: 'ADD_INGREDIENT' });
  }, []);

  const removeIngredient = useCallback((index) => {
    dispatch({ type: 'REMOVE_INGREDIENT', index });
  }, []);

  const setInstruction = useCallback((index, value) => {
    dispatch({ type: 'SET_INSTRUCTION', index, value });
  }, []);

  const addInstruction = useCallback(() => {
    dispatch({ type: 'ADD_INSTRUCTION' });
  }, []);

  const removeInstruction = useCallback((index) => {
    dispatch({ type: 'REMOVE_INSTRUCTION', index });
  }, []);

  const loadRecipe = useCallback((recipe) => {
    dispatch({ type: 'LOAD_RECIPE', recipe });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    formData: state,
    setField,
    setNutrition,
    toggleArray,
    setIngredient,
    addIngredient,
    removeIngredient,
    setInstruction,
    addInstruction,
    removeInstruction,
    loadRecipe,
    reset,
  };
}
