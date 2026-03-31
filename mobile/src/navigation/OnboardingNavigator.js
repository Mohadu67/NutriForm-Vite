import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../contexts/OnboardingContext';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ObjectiveScreen from '../screens/onboarding/ObjectiveScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import BirthYearScreen from '../screens/onboarding/BirthYearScreen';
import HeightScreen from '../screens/onboarding/HeightScreen';
import WeightScreen from '../screens/onboarding/WeightScreen';
import TargetWeightScreen from '../screens/onboarding/TargetWeightScreen';
import ActivityLevelScreen from '../screens/onboarding/ActivityLevelScreen';
import HealthConcernsScreen from '../screens/onboarding/HealthConcernsScreen';
import WeightLossPaceScreen from '../screens/onboarding/WeightLossPaceScreen';
import HealthConnectScreen from '../screens/onboarding/HealthConnectScreen';
import PlanCreationScreen from '../screens/onboarding/PlanCreationScreen';
import PersonalPlanScreen from '../screens/onboarding/PersonalPlanScreen';

const Stack = createNativeStackNavigator();

function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Objective" component={ObjectiveScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="BirthYear" component={BirthYearScreen} />
      <Stack.Screen name="Height" component={HeightScreen} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="TargetWeight" component={TargetWeightScreen} />
      <Stack.Screen name="WeightLossPace" component={WeightLossPaceScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="HealthConcerns" component={HealthConcernsScreen} />
      <Stack.Screen name="HealthConnect" component={HealthConnectScreen} />
      <Stack.Screen
        name="PlanCreation"
        component={PlanCreationScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="PersonalPlan"
        component={PersonalPlanScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}

export default function OnboardingNavigator({ onDone }) {
  return (
    <OnboardingProvider onDone={onDone}>
      <OnboardingStack />
    </OnboardingProvider>
  );
}
