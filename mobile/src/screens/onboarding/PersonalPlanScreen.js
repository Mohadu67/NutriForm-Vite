import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

function StatCard({ icon, label, value, unit, color, isDark }) {
  return (
    <View style={[styles.statCard, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
    }]}>
      <Text style={styles.statEmoji}>{icon}</Text>
      <Text style={[styles.statLabel, { color: isDark ? '#c1c1cb' : '#57534e' }]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: color || (isDark ? '#f3f3f6' : '#1c1917') }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.statUnit, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>{unit}</Text>
        )}
      </View>
    </View>
  );
}

function MacroBar({ proteins, carbs, fats, isDark }) {
  const total = proteins + carbs + fats;
  if (total === 0) return null;
  const pPct = Math.round((proteins * 4 / (total * 4 + fats * 5)) * 100) || 33;
  const cPct = Math.round((carbs * 4 / (total * 4 + fats * 5)) * 100) || 34;
  const fPct = 100 - pPct - cPct;

  return (
    <View>
      <View style={styles.macroBarContainer}>
        <View style={[styles.macroSegment, { flex: pPct, backgroundColor: '#22c55e', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
        <View style={[styles.macroSegment, { flex: cPct, backgroundColor: '#f59e0b' }]} />
        <View style={[styles.macroSegment, { flex: fPct, backgroundColor: '#ef4444', borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
      </View>
      <View style={styles.macroLabels}>
        <View style={styles.macroLabel}>
          <View style={[styles.macroDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.macroText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Protéines {proteins}g
          </Text>
        </View>
        <View style={styles.macroLabel}>
          <View style={[styles.macroDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.macroText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Glucides {carbs}g
          </Text>
        </View>
        <View style={styles.macroLabel}>
          <View style={[styles.macroDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.macroText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Lipides {fats}g
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PersonalPlanScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, finishOnboarding } = useOnboarding();
  const plan = data.plan;

  const handleFinish = async () => {
    await finishOnboarding();
  };

  if (!plan) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#0e0e11' : '#fcfbf9' }]}>
        <Text style={{ color: isDark ? '#f3f3f6' : '#1c1917' }}>Chargement...</Text>
      </View>
    );
  }

  const targetDateFormatted = plan.targetDate
    ? new Date(plan.targetDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <LinearGradient
      colors={isDark ? ['#1a2010', '#0e0e11', '#0e0e11'] : ['#fef6ee', '#fcfbf9', '#fcfbf9']}
      locations={[0, 0.25, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Text style={[styles.headerLabel, { color: '#22c55e' }]}>
            D'après vos réponses,
          </Text>

          {targetDateFormatted && data.objective === 'weight_loss' ? (
            <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              Vous atteindrez {data.targetWeight}kg le{'\n'}{targetDateFormatted}
            </Text>
          ) : (
            <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              Votre plan personnalisé{'\n'}est prêt !
            </Text>
          )}

          {/* Weight graph placeholder */}
          {plan.weightToLose > 0 && (
            <View style={[styles.weightCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
            }]}>
              <View style={styles.weightRow}>
                <View style={[styles.weightBadge, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.weightBadgeText}>{data.weight}kg</Text>
                </View>
                <View style={styles.weightArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#22c55e" />
                </View>
                <View style={[styles.weightBadge, { backgroundColor: '#22c55e' }]}>
                  <Text style={styles.weightBadgeText}>{data.targetWeight}kg</Text>
                </View>
              </View>
              <Text style={[styles.weightInfo, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
                -{plan.weightToLose} kg ({plan.weightLossPercent}%)
              </Text>
            </View>
          )}

          {/* Nutrition recommendations */}
          <View style={[styles.section, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              Recommandations nutrition
            </Text>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieIcon}>🔥</Text>
              <Text style={[styles.calorieValue, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                {plan.dailyCalories}
              </Text>
              <Text style={[styles.calorieUnit, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
                kcal
              </Text>
            </View>
            <MacroBar
              proteins={plan.macros?.proteins || 0}
              carbs={plan.macros?.carbs || 0}
              fats={plan.macros?.fats || 0}
              isDark={isDark}
            />
          </View>

          {/* Fasting program */}
          {plan.fastingHours && (
            <View style={[styles.section, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
            }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                Programme de jeûne
              </Text>
              <View style={styles.fastingRow}>
                <StatCard
                  icon="🌙"
                  label="Temps de jeûne"
                  value={plan.fastingHours}
                  unit="h"
                  isDark={isDark}
                />
                <StatCard
                  icon="🍽️"
                  label="Temps de repas"
                  value={plan.eatingHours}
                  unit="h"
                  isDark={isDark}
                />
              </View>
            </View>
          )}

          {/* Hydration */}
          <View style={[styles.section, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              Hydratation quotidienne
            </Text>
            <View style={styles.hydrationRow}>
              <Text style={styles.hydrationIcon}>💧</Text>
              <Text style={[styles.hydrationValue, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                {plan.hydration}
              </Text>
              <Text style={[styles.hydrationUnit, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
                ml
              </Text>
            </View>
          </View>

          {/* Personalized summary */}
          <View style={[styles.section, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              Un plan adapté à vos besoins
            </Text>
            <View style={styles.summaryList}>
              <SummaryItem icon="✅" text={`IMC actuel : ${plan.bmi}`} isDark={isDark} />
              <SummaryItem icon="🎯" text={`Objectif : ${data.objective === 'weight_loss' ? 'perte de poids' : data.objective === 'eat_healthier' ? 'manger sainement' : 'rester en forme'}`} isDark={isDark} />
              <SummaryItem icon="🏃" text={`Activité : ${data.activityLevel === 'sedentary' ? 'sédentaire' : data.activityLevel === 'light' ? 'légère' : data.activityLevel === 'moderate' ? 'modérée' : 'active'}`} isDark={isDark} />
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* CTA — Transition vers auth */}
        <View style={styles.ctaContainer}>
          <NextButton
            label="Créer mon compte gratuitement"
            onPress={handleFinish}
          />
          <TouchableOpacity onPress={handleFinish} style={styles.loginLink}>
            <Text style={[styles.loginText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              J'ai déjà un compte · <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SummaryItem({ icon, text, isDark }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={[styles.summaryText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 24,
  },
  weightCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  weightBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  weightBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  weightArrow: {
    width: 32,
    alignItems: 'center',
  },
  weightInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  calorieUnit: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 6,
  },
  macroBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  macroSegment: {
    height: '100%',
  },
  macroLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fastingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  hydrationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hydrationIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  hydrationValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  hydrationUnit: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 6,
  },
  summaryList: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    fontSize: 18,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '400',
  },
  loginBold: {
    fontWeight: '600',
    color: '#22c55e',
  },
});
