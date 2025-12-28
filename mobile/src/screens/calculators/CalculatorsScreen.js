import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Magic gradient colors
const MAGIC_GRADIENTS = {
  aurora: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
  sunset: ['#fa709a', '#fee140', '#fa709a'],
  ocean: ['#667eea', '#764ba2'],
  forest: ['#11998e', '#38ef7d'],
  fire: ['#f12711', '#f5af19'],
  purple: ['#8E2DE2', '#4A00E0'],
  peach: ['#F7B186', '#F5576C', '#764ba2'],
};

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

// Floating orb component for magical effect
const FloatingOrb = ({ style, color, size, delay = 0 }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -20,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    />
  );
};

export default function CalculatorsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState('imc');

  // Animation for tab change
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

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
  });
  const [caloriesResult, setCaloriesResult] = useState(null);
  const [selectedCalorieType, setSelectedCalorieType] = useState(null);

  // 1RM State
  const [rmData, setRmData] = useState({ poids: '', reps: '' });
  const [rmResult, setRmResult] = useState(null);

  // FC Max State
  const [cardioData, setCardioData] = useState({ age: '' });
  const [cardioResult, setCardioResult] = useState(null);

  // Calcul IMC
  const calculateIMC = useCallback(() => {
    const poids = parseFloat(imcData.poids);
    const taille = parseFloat(imcData.taille);

    if (!poids || !taille || poids <= 0 || taille <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

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
  }, [imcData]);

  // Calcul Calories (Mifflin-St Jeor)
  const calculateCalories = useCallback(() => {
    const poids = parseFloat(caloriesData.poids);
    const taille = parseFloat(caloriesData.taille);
    const age = parseInt(caloriesData.age, 10);

    if (!poids || !taille || !age || poids <= 0 || taille <= 0 || age <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    // Formule Mifflin-St Jeor
    let tmb;
    if (caloriesData.sexe === 'homme') {
      tmb = 10 * poids + 6.25 * taille - 5 * age + 5;
    } else {
      tmb = 10 * poids + 6.25 * taille - 5 * age - 161;
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
  }, [caloriesData]);

  // Calcul 1RM (Formule d'Epley)
  const calculateRM = useCallback(() => {
    const poids = parseFloat(rmData.poids);
    const reps = parseInt(rmData.reps, 10);

    if (!poids || !reps || poids <= 0 || reps <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
      return;
    }

    if (reps > 12) {
      Alert.alert('Info', 'Pour plus de precision, utilisez 12 reps maximum');
    }

    // Formule d'Epley: 1RM = poids x (1 + 0.0333 x reps)
    const rm = poids * (1 + 0.0333 * reps);
    const rmRounded = Math.round(rm * 10) / 10;

    // Table des pourcentages avec objectifs
    const percentages = [
      { percent: 100, reps: 1, zone: 'Force max', color: '#DC2626' },
      { percent: 95, reps: 2, zone: 'Force', color: '#EF4444' },
      { percent: 90, reps: 4, zone: 'Force', color: '#F59E0B' },
      { percent: 85, reps: 6, zone: 'Hypertrophie', color: '#F59E0B' },
      { percent: 80, reps: 8, zone: 'Hypertrophie', color: '#22C55E' },
      { percent: 75, reps: 10, zone: 'Hypertrophie', color: '#22C55E' },
      { percent: 70, reps: 12, zone: 'Endurance', color: '#3B82F6' },
      { percent: 65, reps: 15, zone: 'Endurance', color: '#3B82F6' },
    ].map(p => ({
      ...p,
      weight: Math.round(rmRounded * p.percent / 100),
    }));

    setRmResult({ rm: rmRounded, percentages });
  }, [rmData]);

  // Calcul FC Max
  const calculateCardio = useCallback(() => {
    const age = parseInt(cardioData.age, 10);

    if (!age || age <= 0 || age > 120) {
      Alert.alert('Erreur', 'Veuillez entrer un age valide');
      return;
    }

    const fcMaxClassique = 220 - age;
    const fcMaxTanaka = Math.round(208 - 0.7 * age);

    const zones = [
      {
        name: 'Echauffement',
        percent: '50-60%',
        min: Math.round(fcMaxClassique * 0.5),
        max: Math.round(fcMaxClassique * 0.6),
        color: '#22C55E',
        description: 'Zone de recuperation active et echauffement',
      },
      {
        name: 'Brule-graisse',
        percent: '60-70%',
        min: Math.round(fcMaxClassique * 0.6),
        max: Math.round(fcMaxClassique * 0.7),
        color: '#84CC16',
        description: 'Zone optimale pour bruler les graisses',
      },
      {
        name: 'Cardio',
        percent: '70-80%',
        min: Math.round(fcMaxClassique * 0.7),
        max: Math.round(fcMaxClassique * 0.8),
        color: '#F59E0B',
        description: 'Ameliore l\'endurance cardiovasculaire',
      },
      {
        name: 'Intensif',
        percent: '80-90%',
        min: Math.round(fcMaxClassique * 0.8),
        max: Math.round(fcMaxClassique * 0.9),
        color: '#EF4444',
        description: 'Ameliore la performance et la VO2max',
      },
      {
        name: 'Maximum',
        percent: '90-100%',
        min: Math.round(fcMaxClassique * 0.9),
        max: fcMaxClassique,
        color: '#DC2626',
        description: 'Effort maximal, reserve aux athletes',
      },
    ];

    setCardioResult({ fcMax: fcMaxClassique, fcMaxTanaka, zones });
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
            <View style={[styles.imcTrackSection, { backgroundColor: '#4aa8ff', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#2ecc71', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#ffae42', flex: 1 }]} />
            <View style={[styles.imcTrackSection, { backgroundColor: '#ff5252', flex: 1 }]} />
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
            const colors = ['#4aa8ff', '#2ecc71', '#ffae42', '#ff5252'];
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
                  !isActive && isDark && { backgroundColor: '#333' },
                ]}
              >
                <Text style={[
                  styles.imcCategoryText,
                  isActive && { color: '#FFF' },
                  !isActive && isDark && { color: '#888' },
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
        <View style={[styles.calcIconBg, { backgroundColor: '#3B82F620' }]}>
          <Ionicons name="body" size={28} color="#3B82F6" />
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
          placeholderTextColor={isDark ? '#666' : '#999'}
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
          placeholderTextColor={isDark ? '#666' : '#999'}
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
              <Ionicons name="fitness" size={20} color={theme.colors.primary} />
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
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  <Text style={[styles.conseilText, isDark && styles.textMuted]}>
                    {conseil}
                  </Text>
                </View>
              ))}
            </View>

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
        </>
      )}
    </View>
  );

  // Render Calories Calculator
  const renderCalories = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: '#EF444420' }]}>
          <Ionicons name="flame" size={28} color="#EF4444" />
        </View>
        <View style={styles.calcHeaderText}>
          <Text style={[styles.calcTitle, isDark && styles.textWhite]}>
            Besoins Caloriques
          </Text>
          <Text style={[styles.calcSubtitle, isDark && styles.textMuted]}>
            Formule Mifflin-St Jeor validee scientifiquement
          </Text>
        </View>
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
              color={caloriesData.sexe === sexe ? '#FFF' : isDark ? '#888' : '#666'}
            />
            <Text style={[
              styles.sexeButtonText,
              caloriesData.sexe === sexe && styles.sexeButtonTextActive,
              isDark && caloriesData.sexe !== sexe && { color: '#888' },
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
            placeholderTextColor={isDark ? '#666' : '#999'}
            keyboardType="number-pad"
            value={caloriesData.age}
            onChangeText={(text) => setCaloriesData(prev => ({ ...prev, age: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: theme.spacing.md }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Poids (kg)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="75"
            placeholderTextColor={isDark ? '#666' : '#999'}
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
          placeholderTextColor={isDark ? '#666' : '#999'}
          keyboardType="decimal-pad"
          value={caloriesData.taille}
          onChangeText={(text) => setCaloriesData(prev => ({ ...prev, taille: text }))}
        />
      </View>

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
                isDark && caloriesData.activite !== level.value && { color: '#888' },
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.activityChipDesc,
                caloriesData.activite === level.value && { color: 'rgba(255,255,255,0.8)' },
                isDark && caloriesData.activite !== level.value && { color: '#666' },
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
              <Ionicons name="pulse" size={24} color="#6B7280" />
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
            const colors = { perte: '#3B82F6', stabiliser: '#22C55E', prise: '#F59E0B' };
            const titles = { perte: 'Perdre du poids', stabiliser: 'Stabiliser', prise: 'Prendre du poids' };

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.objectifCard,
                  isDark && styles.cardDark,
                  selectedCalorieType === type && { borderColor: colors[type], borderWidth: 2 },
                ]}
                onPress={() => setSelectedCalorieType(selectedCalorieType === type ? null : type)}
              >
                <View style={styles.objectifHeader}>
                  <View style={[styles.objectifIconBg, { backgroundColor: `${colors[type]}20` }]}>
                    <Ionicons name={icons[type]} size={24} color={colors[type]} />
                  </View>
                  <View style={styles.objectifInfo}>
                    <Text style={[styles.objectifTitle, isDark && styles.textWhite]}>
                      {titles[type]}
                    </Text>
                    <Text style={[styles.objectifCalories, { color: colors[type] }]}>
                      {data.calories} kcal/jour
                    </Text>
                  </View>
                  <Ionicons
                    name={selectedCalorieType === type ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={isDark ? '#888' : '#666'}
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
                        { key: 'proteines', label: 'Proteines', icon: 'nutrition', color: '#EF4444' },
                        { key: 'glucides', label: 'Glucides', icon: 'leaf', color: '#22C55E' },
                        { key: 'lipides', label: 'Lipides', icon: 'water', color: '#F59E0B' },
                      ].map((macro) => (
                        <View key={macro.key} style={[styles.macroCard, isDark && { backgroundColor: '#1A1A1A' }]}>
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
                        <Ionicons name="checkmark-circle" size={18} color={colors[type]} />
                        <Text style={[styles.conseilText, isDark && styles.textMuted]}>
                          {conseil}
                        </Text>
                      </View>
                    ))}

                    {/* Bouton recettes */}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors[type] }]}
                      onPress={navigateToRecipes}
                    >
                      <Ionicons name="restaurant" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>
                        Voir les recettes adaptees
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Note info */}
          <View style={[styles.infoNote, isDark && styles.cardDark]}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
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
        <View style={[styles.calcIconBg, { backgroundColor: '#8B5CF620' }]}>
          <Ionicons name="barbell" size={28} color="#8B5CF6" />
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

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Poids souleve (kg)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="100"
            placeholderTextColor={isDark ? '#666' : '#999'}
            keyboardType="decimal-pad"
            value={rmData.poids}
            onChangeText={(text) => setRmData(prev => ({ ...prev, poids: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: theme.spacing.md }]}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Repetitions</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="8"
            placeholderTextColor={isDark ? '#666' : '#999'}
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
            <Text style={[styles.rmResultValue, { color: '#8B5CF6' }]}>
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
            <View style={[styles.rmTableHeader, isDark && { borderBottomColor: '#333' }]}>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>%</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Charge</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Reps</Text>
              <Text style={[styles.rmTableHeaderText, isDark && styles.textMuted]}>Zone</Text>
            </View>

            {rmResult.percentages.map((p) => (
              <View
                key={p.percent}
                style={[styles.rmRow, isDark && { borderBottomColor: '#333' }]}
              >
                <Text style={[styles.rmPercent, isDark && styles.textWhite]}>{p.percent}%</Text>
                <Text style={[styles.rmWeight, { color: p.color }]}>{p.weight} kg</Text>
                <Text style={[styles.rmReps, isDark && styles.textMuted]}>~{p.reps}</Text>
                <View style={[styles.rmZoneBadge, { backgroundColor: `${p.color}20` }]}>
                  <Text style={[styles.rmZoneText, { color: p.color }]}>{p.zone}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={navigateToExercises}
          >
            <Ionicons name="barbell" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Voir les exercices</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render Cardio (FC Max) Calculator
  const renderCardio = () => (
    <View style={[styles.calculatorContent, isDark && styles.calculatorContentDark]}>
      <View style={styles.calcHeader}>
        <View style={[styles.calcIconBg, { backgroundColor: '#EF444420' }]}>
          <Ionicons name="heart" size={28} color="#EF4444" />
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
          placeholderTextColor={isDark ? '#666' : '#999'}
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
            <View style={styles.fcMaxAlternative}>
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
                <View style={styles.zoneInfo}>
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

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={navigateToPrograms}
          >
            <Ionicons name="fitness" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Voir les programmes cardio</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Get gradient colors based on active tab
  const getTabGradient = () => {
    switch (activeTab) {
      case 'imc':
        return ['#667eea', '#764ba2'];
      case 'calories':
        return ['#f5576c', '#f093fb'];
      case 'rm':
        return ['#8E2DE2', '#4A00E0'];
      case 'cardio':
        return ['#f5576c', '#fa709a'];
      default:
        return MAGIC_GRADIENTS.peach;
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Magical Background */}
      <LinearGradient
        colors={isDark ? ['#0a0a0a', '#1a1a2e', '#16213e'] : ['#f8f9ff', '#e8ecff', '#f0e6ff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Orbs for magical effect */}
      <View style={styles.orbsContainer} pointerEvents="none">
        <FloatingOrb
          color={isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)'}
          size={200}
          style={{ top: -50, left: -50 }}
          delay={0}
        />
        <FloatingOrb
          color={isDark ? 'rgba(240, 147, 251, 0.12)' : 'rgba(240, 147, 251, 0.08)'}
          size={150}
          style={{ top: 100, right: -30 }}
          delay={500}
        />
        <FloatingOrb
          color={isDark ? 'rgba(245, 87, 108, 0.1)' : 'rgba(245, 87, 108, 0.06)'}
          size={180}
          style={{ bottom: 100, left: -40 }}
          delay={1000}
        />
        <FloatingOrb
          color={isDark ? 'rgba(118, 75, 162, 0.12)' : 'rgba(118, 75, 162, 0.08)'}
          size={120}
          style={{ bottom: 200, right: -20 }}
          delay={1500}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header with glassmorphism */}
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.headerBlur}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                  style={styles.backButtonGradient}
                >
                  <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#333'} />
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                  Calculateurs
                </Text>
                <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
                  Outils de fitness
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </BlurView>

          {/* Magic Tabs */}
          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabColors = {
                  imc: ['#667eea', '#764ba2'],
                  calories: ['#f5576c', '#f093fb'],
                  rm: ['#8E2DE2', '#4A00E0'],
                  cardio: ['#f5576c', '#fa709a'],
                };

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.7}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={tabColors[tab.id]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.tabGradient}
                      >
                        <View style={styles.tabIconGlow}>
                          <Ionicons name={tab.icon} size={20} color="#FFF" />
                        </View>
                        <Text style={styles.tabTextActive}>{tab.label}</Text>
                      </LinearGradient>
                    ) : (
                      <BlurView
                        intensity={isDark ? 30 : 50}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.tabInactive}
                      >
                        <Ionicons
                          name={`${tab.icon}-outline`}
                          size={20}
                          color={isDark ? '#888' : '#666'}
                        />
                        <Text style={[styles.tabText, isDark && styles.tabTextDark]}>
                          {tab.label}
                        </Text>
                      </BlurView>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Calculator Content with fade animation */}
          <Animated.View style={[styles.contentAnimated, { opacity: fadeAnim }]}>
            <ScrollView
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
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  headerBlur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
    opacity: 0.7,
  },
  headerSubtitleDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabsWrapper: {
    paddingVertical: theme.spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    marginRight: theme.spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabActive: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  tabIconGlow: {
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabTextDark: {
    color: '#888',
  },
  contentAnimated: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  calculatorContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  calculatorContentDark: {
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 126, 234, 0.1)',
  },
  calcIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  calcHeaderText: {
    flex: 1,
  },
  calcTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  calcSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  textWhite: {
    color: '#FFF',
  },
  textMuted: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputLabelDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  input: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  inputDark: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderColor: 'rgba(102, 126, 234, 0.2)',
    color: '#FFF',
  },
  inputRow: {
    flexDirection: 'row',
  },
  sexeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sexeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  sexeButtonDark: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  sexeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sexeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  sexeButtonTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  activityScroll: {
    marginTop: theme.spacing.sm,
  },
  activityChip: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    marginRight: theme.spacing.sm,
    minWidth: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  activityChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activityChipDark: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  activityChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 4,
  },
  activityChipTextActive: {
    color: '#FFF',
  },
  activityChipDesc: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 18,
    marginTop: theme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  calcButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardDark: {
    backgroundColor: 'rgba(40, 40, 55, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // IMC Graph
  imcGraphContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  imcGraphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  imcGraphTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  imcGraphValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  imcTrackContainer: {
    position: 'relative',
    marginVertical: theme.spacing.md,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imcLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  imcLabel: {
    fontSize: 10,
    color: '#999',
  },
  imcCategories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  imcCategoryBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
  },
  imcCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },

  // Result Details Card
  resultDetailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  resultCategory: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  resultDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  idealWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  idealWeightText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  conseilsSection: {
    marginBottom: theme.spacing.lg,
  },
  conseilsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  conseilItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  conseilText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },

  // TMB Card
  tmbCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  tmbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  tmbInfo: {
    flex: 1,
  },
  tmbValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  tmbLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Objectifs
  objectifsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  objectifCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    marginRight: theme.spacing.md,
  },
  objectifInfo: {
    flex: 1,
  },
  objectifTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  objectifCalories: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
  },
  objectifDetails: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  objectifDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  macrosTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  macroValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },
  macroLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoNoteText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  // 1RM
  resultCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  rmResultHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  rmResultValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  rmResultLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rmTableTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  rmTable: {
    marginBottom: theme.spacing.lg,
  },
  rmTableHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: theme.spacing.sm,
  },
  rmTableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  rmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rmPercent: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  rmWeight: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  rmReps: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rmZoneBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  rmZoneText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // FC Max
  fcMaxResult: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  fcMaxPrimary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  fcMaxValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#EF4444',
  },
  fcMaxUnit: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  fcMaxFormula: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  fcMaxAlternative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    backgroundColor: '#F0F0F0',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  fcMaxAltLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  fcMaxAltValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  zonesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  zonesContainer: {
    marginBottom: theme.spacing.lg,
  },
  zoneCard: {
    marginBottom: theme.spacing.sm,
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
    marginRight: theme.spacing.sm,
  },
  zoneName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  zonePercent: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  zoneInfo: {
    marginLeft: 20,
    paddingLeft: theme.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5',
  },
  zoneBpm: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  zoneDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
