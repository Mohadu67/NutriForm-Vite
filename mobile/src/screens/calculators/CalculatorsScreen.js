import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { saveIMCCalc, saveCalorieCalc, saveRMCalc, saveFCMaxCalc } from '../../api/history';
import { updateNutritionGoals } from '../../api/nutrition';
import logger from '../../services/logger';

// Clé de stockage pour les données des calculateurs
const CALCULATOR_STORAGE_KEY = '@calculator_data';

// Constantes pour les calculateurs
const TABS = [
  { id: 'imc', label: 'IMC', icon: 'body' },
  { id: 'calories', label: 'Calories', icon: 'flame' },
  { id: 'rm', label: '1RM', icon: 'barbell' },
  { id: 'cardio', label: 'FC Max', icon: 'heart' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentaire', label: 'Sedentaire', factor: 1.2, description: 'Peu ou pas d\'exercice' },
  { value: 'leger', label: 'Leger', factor: 1.375, description: '1-3 jours/semaine' },
  { value: 'modere', label: 'Modere', factor: 1.55, description: '3-5 jours/semaine' },
  { value: 'actif', label: 'Actif', factor: 1.725, description: '6-7 jours/semaine' },
  { value: 'tres_actif', label: 'Tres actif', factor: 1.9, description: 'Intense quotidien' },
];

// Conseils selon le type d'objectif calorique
const CALORIE_CONSEILS = {
  perte: [
    'Privilegie les aliments riches en proteines pour preserver ta masse musculaire.',
    'Hydrate-toi bien, bois au moins 2L d\'eau par jour.',
    'Ne descends jamais en dessous de 1200 kcal/jour (femmes) ou 1500 kcal/jour (hommes).',
    'Combine ton deficit calorique avec une activite physique reguliere.',
  ],
  stabiliser: [
    'Maintiens une routine alimentaire equilibree.',
    'Ecoute tes signaux de faim et de satiete.',
    'Pratique une activite physique reguliere pour ta sante globale.',
    'Varie tes sources de proteines, glucides et lipides.',
  ],
  prise: [
    'Augmente progressivement tes portions pour eviter les inconforts digestifs.',
    'Privilegie les aliments denses en calories et nutriments (noix, avocats, etc.).',
    'Entraine-toi en musculation pour optimiser la prise de muscle.',
    'Mange des collations saines entre les repas.',
  ],
};

// Descriptions IMC par categorie
const IMC_DESCRIPTIONS = {
  'Denutrition severe': {
    description: 'Un IMC inferieur a 16.5 indique une denutrition severe qui necessite une attention medicale immediate.',
    conseils: [
      'Consultez rapidement un professionnel de sante.',
      'Un suivi nutritionnel specialise est indispensable.',
      'Privilegiez des repas frequents et nutritifs.',
    ],
    action: 'Consultez un professionnel',
  },
  'Insuffisance ponderale': {
    description: 'Un IMC entre 16.5 et 18.5 indique une insuffisance ponderale. Une prise de poids saine est recommandee.',
    conseils: [
      'Augmentez progressivement votre apport calorique.',
      'Consommez des aliments riches en nutriments.',
      'Integrez des collations saines entre les repas.',
    ],
    action: 'Voir les recettes prise de poids',
  },
  'Corpulence normale': {
    description: 'Felicitations ! Votre IMC est dans la plage normale (18.5-25). Continuez a maintenir vos bonnes habitudes.',
    conseils: [
      'Maintenez une alimentation equilibree.',
      'Pratiquez une activite physique reguliere.',
      'Hydratez-vous suffisamment.',
    ],
    action: 'Maintenir mes habitudes',
  },
  'Surpoids': {
    description: 'Un IMC entre 25 et 30 indique un surpoids. Des ajustements alimentaires et sportifs peuvent etre benefiques.',
    conseils: [
      'Adoptez une alimentation equilibree et variee.',
      'Integrez plus d\'activite physique dans votre quotidien.',
      'Reduisez les aliments transformes et sucres.',
    ],
    action: 'Calculer mes calories',
  },
  'Obesite moderee': {
    description: 'Un IMC entre 30 et 35 indique une obesite moderee. Un suivi medical et nutritionnel est conseille.',
    conseils: [
      'Consultez un professionnel de sante.',
      'Etablissez un plan alimentaire personnalise.',
      'Commencez par des exercices adaptes a votre condition.',
    ],
    action: 'Voir les programmes adaptes',
  },
  'Obesite severe': {
    description: 'Un IMC superieur a 35 necessite un suivi medical rigoureux pour votre sante.',
    conseils: [
      'Consultez immediatement un professionnel de sante.',
      'Un accompagnement multidisciplinaire est recommande.',
      'Chaque petit pas compte, commencez doucement.',
    ],
    action: 'Consulter un specialiste',
  },
};

export default function CalculatorsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef(null);

  const [activeTab, setActiveTab] = useState('imc');

  // Shared biometric state
  const [sharedBio, setSharedBio] = useState({ poids: '', taille: '' });

  // IMC State
  const [imcData, setImcData] = useState({ poids: '', taille: '' });
  const [imcResult, setImcResult] = useState(null);
  const [showImcDetails, setShowImcDetails] = useState(false);

  // Calories State
  const [caloriesData, setCaloriesData] = useState({
    sexe: 'homme',
    poids: '',
    taille: '',
    age: '',
    activite: 'modere',
    formule: 'mifflin',
    masseGrasse: '',
  });

  // Load shared biometrics on mount and sync across tabs
  useEffect(() => {
    AsyncStorage.getItem('@user_biometrics').then((data) => {
      if (data) {
        const bio = JSON.parse(data);
        setSharedBio(bio);
        if (bio.poids) {
          setImcData(prev => ({ ...prev, poids: bio.poids }));
          setCaloriesData(prev => ({ ...prev, poids: bio.poids }));
        }
        if (bio.taille) {
          setImcData(prev => ({ ...prev, taille: bio.taille }));
          setCaloriesData(prev => ({ ...prev, taille: bio.taille }));
        }
        if (bio.age) setCaloriesData(prev => ({ ...prev, age: bio.age }));
        if (bio.sexe) setCaloriesData(prev => ({ ...prev, sexe: bio.sexe }));
        if (bio.activite) setCaloriesData(prev => ({ ...prev, activite: bio.activite }));
      }
    });
  }, []);

  // Persist biometrics when they change
  const updateSharedBio = useCallback((updates) => {
    setSharedBio(prev => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem('@user_biometrics', JSON.stringify(next));
      return next;
    });
  }, []);
  const [caloriesResult, setCaloriesResult] = useState(null);
  const [selectedCalorieType, setSelectedCalorieType] = useState(null);

  // 1RM State
  const [rmData, setRmData] = useState({ poids: '', reps: '', exercice: '' });
  const [rmResult, setRmResult] = useState(null);

  // FC Max State
  const [cardioData, setCardioData] = useState({ age: '' });
  const [cardioResult, setCardioResult] = useState(null);

  // Sauvegarder les données d'un calculateur (avec historique local + backend)
  const saveCalculatorData = useCallback(async (type, data) => {
    try {
      // 1. Sauvegarder sur le backend
      let backendSuccess = false;
      try {
        let result;
        if (type === 'imc') {
          result = await saveIMCCalc(data);
        } else if (type === 'calories') {
          result = await saveCalorieCalc(data);
        } else if (type === 'rm') {
          result = await saveRMCalc(data);
        } else if (type === 'cardio') {
          result = await saveFCMaxCalc(data);
        }
        backendSuccess = result?.success;
        if (backendSuccess) {
          logger.app.debug(`[Calculator] ${type} synced with backend`);
        }
      } catch (backendError) {
        logger.app.warn('[Calculator] Backend sync error', backendError.message);
      }

      // 2. Sauvegarder en local (backup)
      const existingData = await AsyncStorage.getItem(CALCULATOR_STORAGE_KEY);
      const allData = existingData ? JSON.parse(existingData) : {};

      // Créer l'entrée avec date
      const newEntry = {
        ...data,
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        synced: backendSuccess,
      };

      // Initialiser l'historique si nécessaire
      if (!allData[type]) {
        allData[type] = { history: [] };
      } else if (!allData[type].history) {
        // Migration: convertir ancien format vers nouveau
        allData[type] = { history: [{ ...allData[type], id: Date.now().toString() }] };
      }

      // Ajouter au début de l'historique (plus récent en premier)
      allData[type].history.unshift(newEntry);

      // Limiter à 20 entrées max par type
      if (allData[type].history.length > 20) {
        allData[type].history = allData[type].history.slice(0, 20);
      }

      await AsyncStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(allData));
      Alert.alert('Enregistré !', 'Vos données ont été sauvegardées et seront visibles sur le dashboard.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les données');
    }
  }, []);

  // Sauvegarder IMC
  const saveIMCData = useCallback(() => {
    if (!imcResult) return;
    saveCalculatorData('imc', {
      imc: imcResult.imc,
      categorie: imcResult.categorie,
      poids: parseFloat(imcData.poids),
      taille: parseFloat(imcData.taille),
      poidsIdealMin: imcResult.poidsIdealMin,
      poidsIdealMax: imcResult.poidsIdealMax,
    });
  }, [imcResult, imcData, saveCalculatorData]);

  // Sauvegarder Calories
  const saveCaloriesData = useCallback(() => {
    if (!caloriesResult || !selectedCalorieType) {
      Alert.alert('Info', 'Veuillez d\'abord sélectionner un objectif');
      return;
    }
    const selectedData = caloriesResult[selectedCalorieType];
    saveCalculatorData('calories', {
      tmb: caloriesResult.tmb,
      maintenance: caloriesResult.maintenance,
      objectif: selectedCalorieType,
      calories: selectedData.calories,
      macros: selectedData.macros,
      sexe: caloriesData.sexe,
      age: parseInt(caloriesData.age, 10),
      poids: parseFloat(caloriesData.poids),
      taille: parseFloat(caloriesData.taille),
      activite: caloriesData.activite,
    });
  }, [caloriesResult, selectedCalorieType, caloriesData, saveCalculatorData]);

  // Sauvegarder 1RM
  const saveRMData = useCallback(() => {
    if (!rmResult) return;
    if (!rmData.exercice.trim()) {
      Alert.alert('Info', 'Veuillez entrer le nom de l\'exercice');
      return;
    }
    saveCalculatorData('rm', {
      rm: rmResult.rm,
      exercice: rmData.exercice.trim(),
      poidsSouleve: parseFloat(rmData.poids),
      reps: parseInt(rmData.reps, 10),
      percentages: rmResult.percentages,
    });
  }, [rmResult, rmData, saveCalculatorData]);

  // Sauvegarder FC Max
  const saveCardioData = useCallback(() => {
    if (!cardioResult) return;
    saveCalculatorData('cardio', {
      fcMax: cardioResult.fcMax,
      fcMaxTanaka: cardioResult.fcMaxTanaka,
      age: parseInt(cardioData.age, 10),
      zones: cardioResult.zones,
    });
  }, [cardioResult, cardioData, saveCalculatorData]);

  // Définir comme objectif nutritionnel
  const [settingGoal, setSettingGoal] = useState(false);
  const setAsNutritionGoal = useCallback(async (type) => {
    if (!caloriesResult) return;
    const data = caloriesResult[type];
    const goalMap = { perte: 'weight_loss', stabiliser: 'maintenance', prise: 'muscle_gain' };
    setSettingGoal(true);
    try {
      const result = await updateNutritionGoals({
        dailyCalories: data.calories,
        macros: {
          proteins: data.macros.proteines,
          carbs: data.macros.glucides,
          fats: data.macros.lipides,
        },
        goal: goalMap[type],
      });
      if (result.success) {
        Alert.alert('Objectif mis à jour', 'Ton objectif nutritionnel a été enregistré. Il sera visible sur le dashboard et la page nutrition.');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour l\'objectif.');
      }
    } catch {
      Alert.alert('Erreur', 'Connecte-toi pour définir un objectif nutritionnel.');
    } finally {
      setSettingGoal(false);
    }
  }, [caloriesResult]);

  // Helper pour fermer le clavier et scroller vers le résultat
  const dismissKeyboardAndScroll = useCallback(() => {
    Keyboard.dismiss();
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 100);
  }, []);

  // Calcul IMC
  const calculateIMC = useCallback(() => {
    const poids = parseFloat(imcData.poids);
    const taille = parseFloat(imcData.taille);

    if (!poids || !taille || poids <= 0 || taille <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    Keyboard.dismiss();

    const tailleM = taille / 100;
    const imc = poids / (tailleM * tailleM);
    const imcRounded = Math.round(imc * 10) / 10;

    // Calcul du poids ideal (IMC 22)
    const poidsIdealMin = Math.round(18.5 * tailleM * tailleM);
    const poidsIdealMax = Math.round(24.9 * tailleM * tailleM);

    let categorie, color;
    if (imc < 16.5) {
      categorie = 'Denutrition severe';
      color = '#EF4444';
    } else if (imc < 18.5) {
      categorie = 'Insuffisance ponderale';
      color = '#F59E0B';
    } else if (imc < 25) {
      categorie = 'Corpulence normale';
      color = '#22C55E';
    } else if (imc < 30) {
      categorie = 'Surpoids';
      color = '#F59E0B';
    } else if (imc < 35) {
      categorie = 'Obesite moderee';
      color = '#EF4444';
    } else {
      categorie = 'Obesite severe';
      color = '#DC2626';
    }

    setImcResult({
      imc: imcRounded,
      categorie,
      color,
      poidsIdealMin,
      poidsIdealMax,
      details: IMC_DESCRIPTIONS[categorie],
    });
    setShowImcDetails(true);

    // Sync biometrics to shared state and calorie form
    updateSharedBio({ poids: imcData.poids, taille: imcData.taille });
    setCaloriesData(prev => ({
      ...prev,
      poids: imcData.poids,
      taille: imcData.taille,
    }));

    // Scroll vers le résultat
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 350, animated: true });
    }, 100);
  }, [imcData, updateSharedBio]);

  // Calcul Calories (multi-formules)
  const calculateCalories = useCallback(() => {
    const poids = parseFloat(caloriesData.poids);
    const taille = parseFloat(caloriesData.taille);
    const age = parseInt(caloriesData.age, 10);

    if (!poids || !taille || !age || poids <= 0 || taille <= 0 || age <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    if (caloriesData.formule === 'katch') {
      const mg = parseFloat(caloriesData.masseGrasse);
      if (!mg || mg < 3 || mg > 70) {
        Alert.alert('Erreur', 'Veuillez entrer un pourcentage de masse grasse valide (3-70%)');
        return;
      }
    }

    Keyboard.dismiss();

    let tmb;
    if (caloriesData.formule === 'katch') {
      const masseMaigre = poids * (1 - parseFloat(caloriesData.masseGrasse) / 100);
      tmb = 370 + 21.6 * masseMaigre;
    } else if (caloriesData.formule === 'standard') {
      // Harris-Benedict
      if (caloriesData.sexe === 'homme') {
        tmb = 88.362 + 13.397 * poids + 4.799 * taille - 5.677 * age;
      } else {
        tmb = 447.593 + 9.247 * poids + 3.098 * taille - 4.330 * age;
      }
    } else {
      // Mifflin-St Jeor (default)
      if (caloriesData.sexe === 'homme') {
        tmb = 10 * poids + 6.25 * taille - 5 * age + 5;
      } else {
        tmb = 10 * poids + 6.25 * taille - 5 * age - 161;
      }
    }

    const activityLevel = ACTIVITY_LEVELS.find(a => a.value === caloriesData.activite);
    const tdee = Math.round(tmb * (activityLevel?.factor || 1.55));

    const deficit = Math.max(tdee - 500, caloriesData.sexe === 'homme' ? 1500 : 1200);
    const surplus = tdee + 500;

    // Calcul des macros
    const computeMacros = (cals, type) => {
      if (type === 'perte') {
        return {
          proteines: Math.round((cals * 0.35) / 4),
          glucides: Math.round((cals * 0.35) / 4),
          lipides: Math.round((cals * 0.30) / 9),
        };
      } else if (type === 'prise') {
        return {
          proteines: Math.round((cals * 0.30) / 4),
          glucides: Math.round((cals * 0.45) / 4),
          lipides: Math.round((cals * 0.25) / 9),
        };
      } else {
        return {
          proteines: Math.round((cals * 0.25) / 4),
          glucides: Math.round((cals * 0.45) / 4),
          lipides: Math.round((cals * 0.30) / 9),
        };
      }
    };

    setCaloriesResult({
      tmb: Math.round(tmb),
      maintenance: tdee,
      perte: {
        calories: deficit,
        macros: computeMacros(deficit, 'perte'),
        description: 'Ce niveau te permettra de perdre 0.5 a 1 kg par semaine de maniere saine.',
      },
      stabiliser: {
        calories: tdee,
        macros: computeMacros(tdee, 'stabiliser'),
        description: 'Cet apport te permettra de maintenir ton poids actuel.',
      },
      prise: {
        calories: surplus,
        macros: computeMacros(surplus, 'prise'),
        description: 'Ce surplus te permettra de prendre 0.5 a 1 kg par semaine.',
      },
    });

    // Sync biometrics to shared state and IMC form
    updateSharedBio({
      poids: caloriesData.poids,
      taille: caloriesData.taille,
      age: caloriesData.age,
      sexe: caloriesData.sexe,
      activite: caloriesData.activite,
    });
    setImcData(prev => ({
      ...prev,
      poids: caloriesData.poids,
      taille: caloriesData.taille,
    }));

    // Scroll vers le résultat
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 500, animated: true });
    }, 100);
  }, [caloriesData, updateSharedBio]);

  // Calcul 1RM (Formule d'Epley)
  const calculateRM = useCallback(() => {
    const poids = parseFloat(rmData.poids);
    const reps = parseInt(rmData.reps, 10);

    if (!poids || !reps || poids <= 0 || reps <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    Keyboard.dismiss();

    if (reps > 12) {
      Alert.alert('Info', 'Pour plus de precision, utilisez 12 reps maximum');
    }

    // Formule d'Epley: 1RM = poids x (1 + 0.0333 x reps)
    const rm = poids * (1 + 0.0333 * reps);
    const rmRounded = Math.round(rm * 10) / 10;

    // Table des pourcentages avec objectifs
    const percentages = [
      { percent: 100, reps: 1, zone: 'Force max', color: '#c9726b' },
      { percent: 95, reps: 2, zone: 'Force', color: '#d4887a' },
      { percent: 90, reps: 4, zone: 'Force', color: '#d4a96a' },
      { percent: 85, reps: 6, zone: 'Hypertrophie', color: '#f0a47a' },
      { percent: 80, reps: 8, zone: 'Hypertrophie', color: '#72baa1' },
      { percent: 75, reps: 10, zone: 'Hypertrophie', color: '#72baa1' },
      { percent: 70, reps: 12, zone: 'Endurance', color: '#c9a88c' },
      { percent: 65, reps: 15, zone: 'Endurance', color: '#c9a88c' },
    ].map(p => ({
      ...p,
      weight: Math.round(rmRounded * p.percent / 100),
    }));

    setRmResult({ rm: rmRounded, percentages });

    // Scroll vers le résultat
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 100);
  }, [rmData]);

  // Calcul FC Max
  const calculateCardio = useCallback(() => {
    const age = parseInt(cardioData.age, 10);

    if (!age || age <= 0 || age > 120) {
      Alert.alert('Erreur', 'Veuillez entrer un age valide');
      return;
    }

    Keyboard.dismiss();

    const fcMaxClassique = 220 - age;
    const fcMaxTanaka = Math.round(208 - 0.7 * age);

    const zones = [
      {
        name: 'Echauffement',
        percent: '50-60%',
        min: Math.round(fcMaxClassique * 0.5),
        max: Math.round(fcMaxClassique * 0.6),
        color: '#72baa1',
        description: 'Zone de recuperation active et echauffement',
      },
      {
        name: 'Brule-graisse',
        percent: '60-70%',
        min: Math.round(fcMaxClassique * 0.6),
        max: Math.round(fcMaxClassique * 0.7),
        color: '#8ecdb5',
        description: 'Zone optimale pour bruler les graisses',
      },
      {
        name: 'Cardio',
        percent: '70-80%',
        min: Math.round(fcMaxClassique * 0.7),
        max: Math.round(fcMaxClassique * 0.8),
        color: '#d4a96a',
        description: 'Ameliore l\'endurance cardiovasculaire',
      },
      {
        name: 'Intensif',
        percent: '80-90%',
        min: Math.round(fcMaxClassique * 0.8),
        max: Math.round(fcMaxClassique * 0.9),
        color: '#d4887a',
        description: 'Ameliore la performance et la VO2max',
      },
      {
        name: 'Maximum',
        percent: '90-100%',
        min: Math.round(fcMaxClassique * 0.9),
        max: fcMaxClassique,
        color: '#c9726b',
        description: 'Effort maximal, reserve aux athletes',
      },
    ];

    setCardioResult({ fcMax: fcMaxClassique, fcMaxTanaka, zones });

    // Scroll vers le résultat
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 300, animated: true });
    }, 100);
  }, [cardioData]);

  // Navigation vers recettes (accessible depuis HomeStack)
  const navigateToRecipes = () => {
    navigation.navigate('Recipes');
  };

  // Navigation vers exercices
  const navigateToExercises = () => {
    navigation.navigate('ExercicesTab');
  };

  // Navigation vers programmes (accessible depuis HomeStack)
  const navigateToPrograms = () => {
    navigation.navigate('Programs');
  };

  // Render IMC Graph
  const renderIMCGraph = () => {
    if (!imcResult) return null;

    const min = 15, max = 40;
    const pos = Math.min(100, Math.max(0, ((imcResult.imc - min) / (max - min)) * 100));

    return (
      <View style={[styles.imcGraphContainer, isDark && styles.cardDark]}>
        <View style={styles.imcGraphHeader}>
          <Text style={[styles.imcGraphTitle, isDark && styles.textWhite]}>Votre IMC</Text>
          <Text style={[styles.imcGraphValue, { color: imcResult.color }]}>
            {imcResult.imc}
          </Text>
        </View>

        {/* Barre de progression */}
        <View style={styles.imcTrackContainer}>
          <View style={styles.imcTrack}>
            <View style={[styles.imcTrackSection, { backgroundColor: '#7eb8d4', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#72baa1', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#d4a96a', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#c9726b', flex: 1 }]} />
          </View>
          <View style={[styles.imcIndicator, { left: `${pos}%` }]}>
            <View style={[styles.imcIndicatorDot, { backgroundColor: imcResult.color }]} />
          </View>
        </View>

        {/* Labels */}
        <View style={styles.imcLabels}>
          <Text style={[styles.imcLabel, isDark && styles.textMuted]}>15</Text>
          <Text style={[styles.imcLabel, isDark && styles.textMuted]}>18.5</Text>
          <Text style={[styles.imcLabel, isDark && styles.textMuted]}>25</Text>
          <Text style={[styles.imcLabel, isDark && styles.textMuted]}>30</Text>
          <Text style={[styles.imcLabel, isDark && styles.textMuted]}>40</Text>
        </View>

        {/* Categories */}
        <View style={styles.imcCategories}>
          {['Maigreur', 'Normal', 'Surpoids', 'Obesite'].map((cat, i) => {
            const colors = ['#7eb8d4', '#72baa1', '#d4a96a', '#c9726b'];
            const isActive = (
              (cat === 'Maigreur' && imcResult.imc < 18.5) ||
              (cat === 'Normal' && imcResult.imc >= 18.5 && imcResult.imc < 25) ||
              (cat === 'Surpoids' && imcResult.imc >= 25 && imcResult.imc < 30) ||
              (cat === 'Obesite' && imcResult.imc >= 30)
            );
            return (
              <View
                key={cat}
                style={[
                  styles.imcCategoryBadge,
                  isActive && { backgroundColor: colors[i] },
                  !isActive && isDark && { backgroundColor: '#1f1f26' },
                ]}
              >
                <Text style={[
                  styles.imcCategoryText,
                  isActive && { color: '#FFF' },
                  !isActive && isDark && { color: '#7a7a88' },
                ]}>
                  {cat}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render IMC Calculator
  const renderIMC = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
          <Ionicons name="body" size={28} color="#72baa1" />
        </View>
        <View style={styles.calcHeaderText}>
          <Text style={[styles.calcTitle, isDark && styles.textWhite]}>
            Indice de Masse Corporelle
          </Text>
          <Text style={[styles.calcSubtitle, isDark && styles.textMuted]}>
            Evaluez votre corpulence selon l'OMS
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Poids (kg)</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="ex: 75"
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          keyboardType="decimal-pad"
          value={imcData.poids}
          onChangeText={(text) => setImcData(prev => ({ ...prev, poids: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Taille (cm)</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="ex: 180"
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          keyboardType="decimal-pad"
          value={imcData.taille}
          onChangeText={(text) => setImcData(prev => ({ ...prev, taille: text }))}
        />
      </View>

      <TouchableOpacity style={styles.calcButton} onPress={calculateIMC}>
        <Text style={styles.calcButtonText}>Calculer mon IMC</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      {imcResult && (
        <>
          {renderIMCGraph()}

          {/* Details et conseils */}
          <View style={[styles.resultDetailsCard, isDark && styles.cardDark]}>
            <Text style={[styles.resultCategory, { color: imcResult.color }]}>
              {imcResult.categorie}
            </Text>
            <Text style={[styles.resultDescription, isDark && styles.textMuted]}>
              {imcResult.details.description}
            </Text>

            <View style={styles.idealWeight}>
              <Ionicons name="fitness" size={20} color="#72baa1" />
              <Text style={[styles.idealWeightText, isDark && styles.textWhite]}>
                Poids ideal: {imcResult.poidsIdealMin} - {imcResult.poidsIdealMax} kg
              </Text>
            </View>

            <View style={styles.conseilsSection}>
              <Text style={[styles.conseilsTitle, isDark && styles.textWhite]}>
                Conseils
              </Text>
              {imcResult.details.conseils.map((conseil, i) => (
                <View key={i} style={styles.conseilItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#72baa1" />
                  <Text style={[styles.conseilText, isDark && styles.textMuted]}>
                    {conseil}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveIMCData}
              >
                <Ionicons name="save" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (imcResult.categorie === 'Surpoids') {
                    setActiveTab('calories');
                  } else {
                    navigateToRecipes();
                  }
                }}
              >
                <Text style={styles.actionButtonText}>{imcResult.details.action}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );

  const FORMULA_OPTIONS = [
    { value: 'standard', label: 'Harris-Benedict', tag: 'Standard' },
    { value: 'mifflin', label: 'Mifflin-St Jeor', tag: 'Recommandee' },
    { value: 'katch', label: 'Katch-McArdle', tag: 'Avancee' },
  ];

  // Render Calories Calculator
  const renderCalories = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
          <Ionicons name="flame" size={28} color="#72baa1" />
        </View>
        <View style={styles.calcHeaderText}>
          <Text style={[styles.calcTitle, isDark && styles.textWhite]}>
            Besoins Caloriques
          </Text>
          <Text style={[styles.calcSubtitle, isDark && styles.textMuted]}>
            {caloriesData.formule === 'katch'
              ? 'Katch-McArdle — necessite le % masse grasse'
              : caloriesData.formule === 'standard'
                ? 'Harris-Benedict — formule classique'
                : 'Mifflin-St Jeor — validee scientifiquement'}
          </Text>
        </View>
      </View>

      {/* Formula selector */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Formule</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
          {FORMULA_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.activityChip,
                caloriesData.formule === opt.value && styles.activityChipActive,
                isDark && caloriesData.formule !== opt.value && styles.activityChipDark,
              ]}
              onPress={() => setCaloriesData(prev => ({ ...prev, formule: opt.value }))}
            >
              <Text style={[
                styles.activityChipText,
                caloriesData.formule === opt.value && styles.activityChipTextActive,
                isDark && caloriesData.formule !== opt.value && { color: '#7a7a88' },
              ]}>
                {opt.label}
              </Text>
              <Text style={[
                styles.activityChipDesc,
                caloriesData.formule === opt.value && { color: 'rgba(255,255,255,0.8)' },
                isDark && caloriesData.formule !== opt.value && { color: '#7a7a88' },
              ]}>
                {opt.tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sexeRow}>
        {['homme', 'femme'].map((sexe) => (
          <TouchableOpacity
            key={sexe}
            style={[
              styles.sexeButton,
              caloriesData.sexe === sexe && styles.sexeButtonActive,
              isDark && caloriesData.sexe !== sexe && styles.sexeButtonDark,
            ]}
            onPress={() => setCaloriesData(prev => ({ ...prev, sexe }))}
          >
            <Ionicons
              name={sexe === 'homme' ? 'male' : 'female'}
              size={20}
              color={caloriesData.sexe === sexe ? '#FFF' : isDark ? '#7a7a88' : '#78716c'}
            />
            <Text style={[
              styles.sexeButtonText,
              caloriesData.sexe === sexe && styles.sexeButtonTextActive,
              isDark && caloriesData.sexe !== sexe && { color: '#7a7a88' },
            ]}>
              {sexe.charAt(0).toUpperCase() + sexe.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Age</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="25"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            keyboardType="number-pad"
            value={caloriesData.age}
            onChangeText={(text) => setCaloriesData(prev => ({ ...prev, age: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Poids (kg)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="75"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            keyboardType="decimal-pad"
            value={caloriesData.poids}
            onChangeText={(text) => setCaloriesData(prev => ({ ...prev, poids: text }))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Taille (cm)</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="180"
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          keyboardType="decimal-pad"
          value={caloriesData.taille}
          onChangeText={(text) => setCaloriesData(prev => ({ ...prev, taille: text }))}
        />
      </View>

      {/* Masse grasse — only for Katch-McArdle */}
      {caloriesData.formule === 'katch' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Masse grasse (%)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="ex: 18"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            keyboardType="decimal-pad"
            value={caloriesData.masseGrasse}
            onChangeText={(text) => setCaloriesData(prev => ({ ...prev, masseGrasse: text }))}
          />
          <Text style={[styles.formulaInfoText, isDark && { color: '#7a7a88' }]}>
            La formule Katch-McArdle est la plus precise mais necessite de connaitre votre % de masse grasse.
          </Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Niveau d'activite</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.activityChip,
                caloriesData.activite === level.value && styles.activityChipActive,
                isDark && caloriesData.activite !== level.value && styles.activityChipDark,
              ]}
              onPress={() => setCaloriesData(prev => ({ ...prev, activite: level.value }))}
            >
              <Text style={[
                styles.activityChipText,
                caloriesData.activite === level.value && styles.activityChipTextActive,
                isDark && caloriesData.activite !== level.value && { color: '#7a7a88' },
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.activityChipDesc,
                caloriesData.activite === level.value && { color: 'rgba(255,255,255,0.8)' },
                isDark && caloriesData.activite !== level.value && { color: '#7a7a88' },
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.calcButton} onPress={calculateCalories}>
        <Text style={styles.calcButtonText}>Calculer mes besoins</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      {caloriesResult && (
        <>
          {/* TMB info */}
          <View style={[styles.tmbCard, isDark && styles.cardDark]}>
            <View style={styles.tmbHeader}>
              <Ionicons name="pulse" size={24} color="#78716c" />
              <View style={styles.tmbInfo}>
                <Text style={[styles.tmbValue, isDark && styles.textWhite]}>
                  {caloriesResult.tmb} kcal
                </Text>
                <Text style={[styles.tmbLabel, isDark && styles.textMuted]}>
                  Metabolisme de base (au repos)
                </Text>
              </View>
            </View>
          </View>

          {/* Cards d'objectifs */}
          <Text style={[styles.objectifsTitle, isDark && styles.textWhite]}>
            Choisissez votre objectif
          </Text>

          {['perte', 'stabiliser', 'prise'].map((type) => {
            const data = caloriesResult[type];
            const icons = { perte: 'trending-down', stabiliser: 'analytics', prise: 'trending-up' };
            const goalColors = { perte: '#7eb8d4', stabiliser: '#72baa1', prise: '#d4a96a' };
            const titles = { perte: 'Perdre du poids', stabiliser: 'Stabiliser', prise: 'Prendre du poids' };

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.objectifCard,
                  isDark && styles.cardDark,
                  selectedCalorieType === type && { borderColor: 'rgba(114,186,161,0.3)', borderWidth: 2 },
                ]}
                onPress={() => setSelectedCalorieType(selectedCalorieType === type ? null : type)}
              >
                <View style={styles.objectifHeader}>
                  <View style={[styles.objectifIconBg, { backgroundColor: `${goalColors[type]}20` }]}>
                    <Ionicons name={icons[type]} size={24} color={goalColors[type]} />
                  </View>
                  <View style={styles.objectifInfo}>
                    <Text style={[styles.objectifTitle, isDark && styles.textWhite]}>
                      {titles[type]}
                    </Text>
                    <Text style={[styles.objectifCalories, { color: goalColors[type] }]}>
                      {data.calories} kcal/jour
                    </Text>
                  </View>
                  <Ionicons
                    name={selectedCalorieType === type ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={isDark ? '#7a7a88' : '#78716c'}
                  />
                </View>

                {selectedCalorieType === type && (
                  <View style={styles.objectifDetails}>
                    <Text style={[styles.objectifDesc, isDark && styles.textMuted]}>
                      {data.description}
                    </Text>

                    {/* Macros */}
                    <Text style={[styles.macrosTitle, isDark && styles.textWhite]}>
                      Repartition des macronutriments
                    </Text>
                    <View style={styles.macrosGrid}>
                      {[
                        { key: 'proteines', label: 'Proteines', icon: 'nutrition', color: '#72baa1' },
                        { key: 'glucides', label: 'Glucides', icon: 'leaf', color: '#f0a47a' },
                        { key: 'lipides', label: 'Lipides', icon: 'water', color: '#c9a88c' },
                      ].map((macro) => (
                        <View key={macro.key} style={[styles.macroCard, isDark && { backgroundColor: '#1f1f26' }]}>
                          <Ionicons name={macro.icon} size={20} color={macro.color} />
                          <Text style={[styles.macroValue, { color: macro.color }]}>
                            {data.macros[macro.key]}g
                          </Text>
                          <Text style={[styles.macroLabel, isDark && styles.textMuted]}>
                            {macro.label}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Conseils */}
                    <Text style={[styles.conseilsTitle, isDark && styles.textWhite]}>
                      Conseils pratiques
                    </Text>
                    {CALORIE_CONSEILS[type].map((conseil, i) => (
                      <View key={i} style={styles.conseilItem}>
                        <Ionicons name="checkmark-circle" size={18} color={goalColors[type]} />
                        <Text style={[styles.conseilText, isDark && styles.textMuted]}>
                          {conseil}
                        </Text>
                      </View>
                    ))}

                    {/* Bouton recettes */}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: goalColors[type] }]}
                      onPress={navigateToRecipes}
                    >
                      <Ionicons name="restaurant" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>
                        Voir les recettes adaptees
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>

                    {/* Bouton définir comme objectif */}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.goalButton, { marginTop: 12 }]}
                      onPress={() => setAsNutritionGoal(type)}
                      disabled={settingGoal}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="flag" size={18} color="#FFF" />
                      <Text style={styles.actionButtonText}>
                        {settingGoal ? 'Enregistrement...' : 'Definir comme objectif'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Bouton Enregistrer */}
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, { marginTop: 16 }]}
            onPress={saveCaloriesData}
          >
            <Ionicons name="save" size={18} color="#FFF" />
            <Text style={styles.actionButtonText}>Enregistrer mon objectif</Text>
          </TouchableOpacity>

          {/* Note info */}
          <View style={[styles.infoNote, isDark && styles.cardDark]}>
            <Ionicons name="information-circle" size={20} color="#78716c" />
            <Text style={[styles.infoNoteText, isDark && styles.textMuted]}>
              Ces valeurs sont des estimations. Ajustez selon vos resultats et votre ressenti.
            </Text>
          </View>
        </>
      )}
    </View>
  );

  // Render 1RM Calculator
  const renderRM = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
          <Ionicons name="barbell" size={28} color="#72baa1" />
        </View>
        <View style={styles.calcHeaderText}>
          <Text style={[styles.calcTitle, isDark && styles.textWhite]}>
            Calculateur 1RM
          </Text>
          <Text style={[styles.calcSubtitle, isDark && styles.textMuted]}>
            Estimez votre charge maximale avec la formule d'Epley
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Nom de l'exercice</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Ex: Développé couché, Squat..."
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          value={rmData.exercice}
          onChangeText={(text) => setRmData(prev => ({ ...prev, exercice: text }))}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Poids souleve (kg)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="100"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            keyboardType="decimal-pad"
            value={rmData.poids}
            onChangeText={(text) => setRmData(prev => ({ ...prev, poids: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Repetitions</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="8"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            keyboardType="number-pad"
            value={rmData.reps}
            onChangeText={(text) => setRmData(prev => ({ ...prev, reps: text }))}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.calcButton} onPress={calculateRM}>
        <Text style={styles.calcButtonText}>Calculer mon 1RM</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      {rmResult && (
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <View style={styles.rmResultHeader}>
            <Text style={[styles.rmResultValue, { color: '#72baa1' }]}>
              {rmResult.rm} kg
            </Text>
            <Text style={[styles.rmResultLabel, isDark && styles.textMuted]}>
              Charge maximale estimee (1RM)
            </Text>
          </View>

          <Text style={[styles.rmTableTitle, isDark && styles.textWhite]}>
            Tableau des charges par objectif
          </Text>

          <View style={styles.rmTable}>
            <View style={[styles.rmTableHeader, isDark && { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>%</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Charge</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Reps</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Zone</Text>
            </View>

            {rmResult.percentages.map((p, index) => (
              <View
                key={p.percent}
                style={[
                  styles.rmRow,
                  isDark && { borderBottomColor: 'rgba(255,255,255,0.06)' },
                  index % 2 === 0 && styles.rmRowEven,
                  index % 2 === 0 && isDark && styles.rmRowEvenDark,
                ]}
              >
                <Text style={[styles.rmPercent, isDark && styles.textWhite]}>{p.percent}%</Text>
                <Text style={[styles.rmWeight, { color: p.color }]}>{p.weight} kg</Text>
                <Text style={[styles.rmReps, isDark && styles.textMuted]}>~{p.reps}</Text>
                <View style={[styles.rmZoneBadge, { backgroundColor: `${p.color}18` }]}>
                  <Text style={[styles.rmZoneText, { color: p.color }]}>{p.zone}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveRMData}
            >
              <Ionicons name="save" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToExercises}
            >
              <Ionicons name="barbell" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Exercices</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // Render Cardio (FC Max) Calculator
  const renderCardio = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
          <Ionicons name="heart" size={28} color="#72baa1" />
        </View>
        <View style={styles.calcHeaderText}>
          <Text style={[styles.calcTitle, isDark && styles.textWhite]}>
            Frequence Cardiaque Max
          </Text>
          <Text style={[styles.calcSubtitle, isDark && styles.textMuted]}>
            Definissez vos zones d'entrainement cardio
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Age</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="25"
          placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
          keyboardType="number-pad"
          value={cardioData.age}
          onChangeText={(text) => setCardioData(prev => ({ ...prev, age: text }))}
        />
      </View>

      <TouchableOpacity style={styles.calcButton} onPress={calculateCardio}>
        <Text style={styles.calcButtonText}>Calculer ma FC Max</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      {cardioResult && (
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <View style={styles.fcMaxResult}>
            <View style={styles.fcMaxPrimary}>
              <Text style={styles.fcMaxValue}>{cardioResult.fcMax}</Text>
              <Text style={[styles.fcMaxUnit, isDark && styles.textMuted]}>bpm</Text>
            </View>
            <Text style={[styles.fcMaxFormula, isDark && styles.textMuted]}>
              Formule: 220 - age
            </Text>
            <View style={[styles.fcMaxAlternative, isDark && { backgroundColor: '#1f1f26' }]}>
              <Text style={[styles.fcMaxAltLabel, isDark && styles.textMuted]}>
                Tanaka (plus precis):
              </Text>
              <Text style={[styles.fcMaxAltValue, isDark && styles.textWhite]}>
                {cardioResult.fcMaxTanaka} bpm
              </Text>
            </View>
          </View>

          <Text style={[styles.zonesTitle, isDark && styles.textWhite]}>
            Vos zones d'entrainement
          </Text>

          <View style={styles.zonesContainer}>
            {cardioResult.zones.map((zone) => (
              <View key={zone.name} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                  <Text style={[styles.zoneName, isDark && styles.textWhite]}>{zone.name}</Text>
                  <Text style={[styles.zonePercent, isDark && styles.textMuted]}>{zone.percent}</Text>
                </View>
                <View style={[styles.zoneInfo, isDark && { borderLeftColor: 'rgba(255,255,255,0.06)' }]}>
                  <Text style={[styles.zoneBpm, { color: zone.color }]}>
                    {zone.min} - {zone.max} bpm
                  </Text>
                  <Text style={[styles.zoneDesc, isDark && styles.textMuted]}>
                    {zone.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveCardioData}
            >
              <Ionicons name="save" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToPrograms}
            >
              <Ionicons name="fitness" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Programmes</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={isDark ? '#f3f3f6' : '#1c1917'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Calculateurs
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    isDark && styles.tabDark,
                    isActive && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={isActive ? tab.icon : `${tab.icon}-outline`}
                    size={16}
                    color={isActive ? '#FFF' : (isDark ? '#7a7a88' : '#78716c')}
                  />
                  <Text style={[
                    styles.tabText,
                    isDark && styles.tabTextDark,
                    isActive && styles.tabTextActive,
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Calculator Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'imc' && renderIMC()}
          {activeTab === 'calories' && renderCalories()}
          {activeTab === 'rm' && renderRM()}
          {activeTab === 'cardio' && renderCardio()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfbf9',
  },
  containerDark: {
    backgroundColor: '#0e0e11',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  headerDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  headerTitleDark: {
    color: '#f3f3f6',
  },
  tabsWrapper: {
    paddingVertical: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
    marginRight: 8,
    gap: 6,
  },
  tabDark: {
    backgroundColor: '#1f1f26',
  },
  tabActive: {
    backgroundColor: '#72baa1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716c',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  tabTextDark: {
    color: '#7a7a88',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 180,
  },
  calculatorContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  calculatorContentDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  calcIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  calcHeaderText: {
    flex: 1,
  },
  calcTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  calcSubtitle: {
    fontSize: 14,
    color: '#78716c',
  },
  textWhite: {
    color: '#f3f3f6',
  },
  textMuted: {
    color: '#7a7a88',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716c',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#c1c1cb',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  inputDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#f3f3f6',
  },
  inputRow: {
    flexDirection: 'row',
  },
  sexeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sexeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
  },
  sexeButtonDark: {
    backgroundColor: '#1f1f26',
  },
  sexeButtonActive: {
    backgroundColor: '#72baa1',
  },
  sexeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78716c',
  },
  sexeButtonTextActive: {
    color: '#FFF',
  },
  activityScroll: {
    marginTop: 8,
  },
  activityChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
    marginRight: 12,
    minWidth: 100,
  },
  activityChipActive: {
    backgroundColor: '#72baa1',
  },
  activityChipDark: {
    backgroundColor: '#1f1f26',
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78716c',
    marginBottom: 2,
  },
  activityChipTextActive: {
    color: '#FFF',
  },
  activityChipDesc: {
    fontSize: 10,
    color: '#a8a29e',
  },
  formulaInfoText: {
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 6,
    lineHeight: 17,
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 8,
  },
  calcButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  cardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // IMC Graph
  imcGraphContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  imcGraphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imcGraphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  imcGraphValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  imcTrackContainer: {
    position: 'relative',
    marginVertical: 16,
  },
  imcTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  imcTrackSection: {
    height: '100%',
  },
  imcIndicator: {
    position: 'absolute',
    top: -4,
    marginLeft: -10,
  },
  imcIndicatorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  imcLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imcLabel: {
    fontSize: 10,
    color: '#a8a29e',
  },
  imcCategories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  imcCategoryBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
  },
  imcCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78716c',
  },

  // Result Details Card
  resultDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  resultCategory: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 14,
    color: '#78716c',
    lineHeight: 20,
    marginBottom: 16,
  },
  idealWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(114,186,161,0.12)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  idealWeightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1917',
  },
  conseilsSection: {
    marginBottom: 20,
  },
  conseilsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  conseilItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  conseilText: {
    flex: 1,
    fontSize: 14,
    color: '#78716c',
    lineHeight: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 50,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#72baa1',
  },
  goalButton: {
    backgroundColor: '#72baa1',
  },

  // TMB Card
  tmbCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  tmbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tmbInfo: {
    flex: 1,
  },
  tmbValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1917',
  },
  tmbLabel: {
    fontSize: 14,
    color: '#78716c',
  },

  // Objectifs
  objectifsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 20,
    marginBottom: 16,
  },
  objectifCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  objectifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  objectifIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  objectifInfo: {
    flex: 1,
  },
  objectifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 2,
  },
  objectifCalories: {
    fontSize: 18,
    fontWeight: '800',
  },
  objectifDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#efedea',
  },
  objectifDesc: {
    fontSize: 14,
    color: '#78716c',
    marginBottom: 20,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    borderRadius: 14,
    padding: 16,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  macroLabel: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 2,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#a8a29e',
    lineHeight: 18,
  },

  // 1RM
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  rmResultHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  rmResultValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  rmResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a8a29e',
    marginTop: 8,
  },
  rmTableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  rmTable: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  rmTableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
    marginBottom: 12,
  },
  rmTableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#78716c',
    textTransform: 'uppercase',
  },
  rmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  rmRowEven: {
    backgroundColor: 'rgba(245,245,244,0.5)',
  },
  rmRowEvenDark: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rmPercent: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  rmWeight: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  rmReps: {
    flex: 1,
    fontSize: 13,
    color: '#a8a29e',
  },
  rmZoneBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rmZoneText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // FC Max
  fcMaxResult: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#efedea',
  },
  fcMaxPrimary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  fcMaxValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#72baa1',
  },
  fcMaxUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a8a29e',
  },
  fcMaxFormula: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a8a29e',
    marginTop: 8,
  },
  fcMaxAlternative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    backgroundColor: '#f5f5f4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fcMaxAltLabel: {
    fontSize: 14,
    color: '#78716c',
  },
  fcMaxAltValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  zonesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  zonesContainer: {
    marginBottom: 20,
  },
  zoneCard: {
    marginBottom: 12,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  zoneName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  zonePercent: {
    fontSize: 14,
    color: '#a8a29e',
  },
  zoneInfo: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#efedea',
  },
  zoneBpm: {
    fontSize: 16,
    fontWeight: '800',
  },
  zoneDesc: {
    fontSize: 12,
    color: '#a8a29e',
    marginTop: 2,
  },
});
