import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getBodyCompositionSummary } from '../../api/bodyComposition';

const ZONE_LABELS = {
  pectoraux: 'Pectoraux', epaules: 'Épaules', biceps: 'Biceps', triceps: 'Triceps',
  'abdos-centre': 'Abdos', 'dos-superieur': 'Haut du dos', 'dos-inferieur': 'Dos',
  fessiers: 'Fessiers', 'cuisses-externes': 'Quadriceps', 'cuisses-internes': 'Ischio-jambiers',
  mollets: 'Mollets',
};

// ─── Génération des conseils personnalisés ───────────────────────────
function generateTips(bc, weeklySessions) {
  if (!bc) return [];
  const tips = [];
  const { nutrition: n, muscleGain: mg, userMetrics: u } = bc;
  const goal = u?.goalType || 'maintenance';
  const weight = u?.weight;

  // Fréquence
  if (weeklySessions === 0) {
    tips.push({ emoji: '🎯', title: 'Lance-toi', text: 'Aucune séance cette semaine. Un seul entraînement peut relancer ta dynamique.', tint: 'blue' });
  } else if (weeklySessions < 3) {
    tips.push({ emoji: '📈', title: 'Augmente la cadence', text: `${weeklySessions} séance${weeklySessions > 1 ? 's' : ''} cette semaine. Vise 3 à 5 pour des résultats visibles.`, tint: 'amber' });
  } else if (weeklySessions <= 5) {
    tips.push({ emoji: '✅', title: 'Fréquence idéale', text: `${weeklySessions} séances — c'est le sweet spot pour progresser sans se cramer.`, tint: 'green' });
  } else {
    tips.push({ emoji: '😴', title: 'Pense au repos', text: `${weeklySessions} séances, c'est intense. Les muscles se construisent au repos.`, tint: 'amber' });
  }

  // Protéines
  if (n?.daysLogged >= 1) {
    if (n.proteinStatus === 'insufficient' && n.avgDaily?.proteins > 0) {
      const target = weight ? Math.round(weight * 1.6) : null;
      tips.push({ emoji: '🥩', title: 'Plus de protéines', text: `${n.proteinPerKg}g/kg.${target ? ` Vise ${target}g/jour (1.6g/kg)` : ' Vise 1.6g/kg'} pour maximiser tes gains.`, tint: 'red' });
    } else if (n.proteinStatus === 'adequate') {
      const gap = weight ? Math.round(weight * 1.6 - n.avgDaily.proteins) : null;
      tips.push({ emoji: '💪', title: 'Protéines correctes', text: `${n.proteinPerKg}g/kg, bien joué.${gap ? ` Encore ${gap}g pour l'optimal.` : ''}`, tint: 'green' });
    } else if (n.proteinStatus === 'optimal') {
      tips.push({ emoji: '🏆', title: 'Protéines au top', text: `${n.proteinPerKg}g/kg — synthèse musculaire maximisée.`, tint: 'green' });
    }
  }

  // Balance calorique
  if (n?.dailyBalance !== undefined && n?.daysLogged >= 1) {
    const bal = n.dailyBalance;
    if (goal === 'muscle_gain') {
      if (bal < 0) tips.push({ emoji: '🍽️', title: 'Mange plus', text: `Déficit de ${Math.abs(Math.round(bal))} kcal en prise de masse. Ajoute ${Math.abs(Math.round(bal)) + 200} kcal pour un surplus favorable.`, tint: 'red' });
      else if (bal > 500) tips.push({ emoji: '⚖️', title: 'Surplus élevé', text: `+${Math.round(bal)} kcal/jour. Au-delà de 300-500 kcal, l'excès part en gras.`, tint: 'amber' });
      else if (bal >= 100) tips.push({ emoji: '✅', title: 'Surplus parfait', text: `+${Math.round(bal)} kcal/jour — idéal pour du muscle propre.`, tint: 'green' });
    } else if (goal === 'weight_loss') {
      if (bal > 0) tips.push({ emoji: '⚠️', title: 'Pas de déficit', text: `+${Math.round(bal)} kcal au-dessus de ta maintenance. Réduis pour relancer ta perte.`, tint: 'red' });
      else if (bal < -800) tips.push({ emoji: '⚠️', title: 'Déficit agressif', text: `${Math.abs(Math.round(bal))} kcal de déficit — risque de perte musculaire. Reste autour de -500 kcal.`, tint: 'amber' });
      else if (bal < 0) tips.push({ emoji: '🔥', title: 'Bon déficit', text: `${Math.abs(Math.round(bal))} kcal de déficit — ~${Math.round(Math.abs(bal) * 7 / 7700 * 1000)}g de gras/semaine.`, tint: 'green' });
    }
  }

  // Focus musculaire croisé avec nutrition
  if (mg?.byZone && weeklySessions > 0) {
    const zones = Object.entries(mg.byZone).filter(([, d]) => d.gainG > 0).sort((a, b) => b[1].gainG - a[1].gainG);
    if (zones.length > 0) {
      const topLabel = ZONE_LABELS[zones[0][0]] || zones[0][0];
      if (n?.proteinStatus === 'insufficient') {
        tips.push({ emoji: '🎯', title: `Focus ${topLabel}`, text: `Bon travail sur les ${topLabel.toLowerCase()} mais protéines insuffisantes. Plus de protéines = meilleurs résultats.`, tint: 'amber' });
      }
    }

    const mainZones = ['pectoraux', 'epaules', 'dos-inferieur', 'cuisses-externes', 'fessiers'];
    const trained = new Set(zones.map(([z]) => z));
    const neglected = mainZones.filter(z => !trained.has(z));
    if (neglected.length > 0 && neglected.length <= 3) {
      const labels = neglected.slice(0, 2).map(z => (ZONE_LABELS[z] || z).toLowerCase()).join(' et ');
      tips.push({ emoji: '🔄', title: 'Équilibre', text: `Pense à travailler les ${labels} pour un développement harmonieux.`, tint: 'blue' });
    }
  }

  // Nutrition non renseignée
  if (!n?.daysLogged || n.daysLogged === 0) {
    tips.push({ emoji: '📝', title: 'Log ta nutrition', text: 'Aucun repas enregistré. Renseigne tes repas pour des conseils précis sur tes macros.', tint: 'blue' });
  } else if (n.daysLogged < 3) {
    tips.push({ emoji: '📝', title: 'Continue de logger', text: `${n.daysLogged} jour${n.daysLogged > 1 ? 's' : ''} enregistré${n.daysLogged > 1 ? 's' : ''}. Plus de données = meilleurs conseils.`, tint: 'blue' });
  }

  // Surentraînement + mauvaise nutrition
  if (weeklySessions > 5 && n?.proteinStatus !== 'optimal') {
    tips.push({ emoji: '🧘', title: 'Récupération', text: 'Beaucoup de séances + protéines insuffisantes. Tu risques le surentraînement.', tint: 'red' });
  }

  // Timing protéines (MPS)
  if (n?.mpsScore !== undefined && n.mpsScore < 0.3 && weeklySessions > 0) {
    tips.push({ emoji: '🧬', title: 'Timing protéines', text: 'Mange tes protéines le jour de l\'entraînement et le lendemain. La fenêtre MPS dure 24-48h.', tint: 'blue' });
  }

  return tips;
}

// ─── Couleurs de fond des tips par tint ──────────────────────────────
const TINT_BG = {
  green: { light: 'rgba(16, 185, 129, 0.06)', dark: 'rgba(16, 185, 129, 0.10)' },
  amber: { light: 'rgba(245, 158, 11, 0.06)', dark: 'rgba(245, 158, 11, 0.10)' },
  red:   { light: 'rgba(239, 68, 68, 0.06)', dark: 'rgba(239, 68, 68, 0.10)' },
  blue:  { light: 'rgba(59, 130, 246, 0.06)', dark: 'rgba(59, 130, 246, 0.10)' },
};

const CARD_WIDTH = 220;

// ─── Composant ───────────────────────────────────────────────────────
export const WeeklySummary = ({
  weeklySessions = 0,
  weeklyCalories = 0,
  weeklyDuration = 0,
  weeklyTrainingDays = 0,
}) => {
  const isDark = useColorScheme() === 'dark';
  const [showTips, setShowTips] = useState(false);
  const [bodyComp, setBodyComp] = useState(null);

  useEffect(() => {
    getBodyCompositionSummary(7)
      .then(res => { if (res.success && res.data) setBodyComp(res.data); })
      .catch(() => {});
  }, []);

  // Message motivation
  const motivation = useMemo(() => {
    if (weeklySessions === 0) {
      return { title: "C'est pas grave !", message: 'Reste focus, faut juste se lancer. Une séance et tu es reparti !', icon: 'trending-up', colors: { bg: '#FEF3C7', text: '#92400E', icon: '#F59E0B' } };
    } else if (weeklySessions <= 2) {
      return { title: 'Bon début !', message: `${weeklySessions} séance${weeklySessions > 1 ? 's' : ''} cette semaine, c'est un bon début !`, icon: 'checkmark-circle', colors: { bg: '#DBEAFE', text: '#1E40AF', icon: '#3B82F6' } };
    } else if (weeklySessions <= 4) {
      return { title: 'Belle semaine !', message: `${weeklySessions} séances${weeklyCalories > 0 ? ` et ${weeklyCalories} kcal brûlées` : ''} !`, icon: 'flame', colors: { bg: '#FED7AA', text: '#9A3412', icon: theme.colors.primary } };
    } else {
      return { title: 'Semaine incroyable !', message: `${weeklySessions} séances ! Tu es une machine !`, icon: 'trophy', colors: { bg: '#FEF08A', text: '#854D0E', icon: '#EAB308' } };
    }
  }, [weeklySessions, weeklyCalories]);

  // Nutrition recap
  const nutritionRecap = bodyComp ? {
    dailyBalance: bodyComp.nutrition?.dailyBalance || 0,
    avgCalories: bodyComp.nutrition?.avgDaily?.calories || 0,
    avgProteins: bodyComp.nutrition?.avgDaily?.proteins || 0,
    proteinPerKg: bodyComp.nutrition?.proteinPerKg || 0,
    muscleGainG: bodyComp.muscleGain?.totalG || 0,
    fatChangeG: bodyComp.fatChange?.g || 0,
    projectedWeight: bodyComp.projectedWeight || null,
  } : null;

  const tips = useMemo(() => generateTips(bodyComp, weeklySessions), [bodyComp, weeklySessions]);

  // Calories brûlées : priorité bodyComp (inclut DailyHealthData) > props
  const burnedFromBodyComp = bodyComp?.nutrition?.avgDaily?.burned
    ? Math.round(bodyComp.nutrition.avgDaily.burned * (bodyComp.nutrition.daysLogged || 7))
    : 0;
  const displayCalories = burnedFromBodyComp || weeklyCalories;

  return (
    <View style={[s.container, { backgroundColor: isDark ? '#2A2A2A' : motivation.colors.bg }]}>
      {/* Header motivation */}
      <View style={[s.iconContainer, { backgroundColor: isDark ? '#333333' : 'rgba(255,255,255,0.5)' }]}>
        <Ionicons name={motivation.icon} size={32} color={isDark ? theme.colors.primary : motivation.colors.icon} />
      </View>

      <View style={s.content}>
        <Text style={[s.title, { color: isDark ? '#FFFFFF' : motivation.colors.text }]}>
          {motivation.title}
        </Text>
        <Text style={[s.message, { color: isDark ? '#CCCCCC' : motivation.colors.text }]}>
          {motivation.message}
        </Text>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={[s.statValue, { color: isDark ? '#FFFFFF' : motivation.colors.text }]}>
            {weeklySessions}
          </Text>
          <Text style={[s.statLabel, { color: isDark ? '#AAAAAA' : motivation.colors.text }]}>
            séance{weeklySessions !== 1 ? 's' : ''}
          </Text>
        </View>
        {displayCalories > 0 && (
          <View style={s.stat}>
            <Text style={[s.statValue, { color: isDark ? '#FFFFFF' : motivation.colors.text }]}>
              {displayCalories}
            </Text>
            <Text style={[s.statLabel, { color: isDark ? '#AAAAAA' : motivation.colors.text }]}>
              kcal
            </Text>
          </View>
        )}
        {weeklyDuration > 0 && (
          <View style={s.stat}>
            <Text style={[s.statValue, { color: isDark ? '#FFFFFF' : motivation.colors.text }]}>
              {weeklyDuration}
            </Text>
            <Text style={[s.statLabel, { color: isDark ? '#AAAAAA' : motivation.colors.text }]}>
              min
            </Text>
          </View>
        )}
        {weeklyTrainingDays > 0 && (
          <View style={s.stat}>
            <Text style={[s.statValue, { color: isDark ? '#FFFFFF' : motivation.colors.text }]}>
              {weeklyTrainingDays}
            </Text>
            <Text style={[s.statLabel, { color: isDark ? '#AAAAAA' : motivation.colors.text }]}>
              jour{weeklyTrainingDays !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Bilan nutrition */}
      {nutritionRecap && (
        <View style={[s.nutritionRecap, isDark && s.nutritionRecapDark]}>
          <Text style={[s.nutritionRecapTitle, isDark && { color: '#AAA' }]}>
            Bilan nutrition
          </Text>
          <View style={s.nutritionRecapGrid}>
            <View style={s.nutritionRecapItem}>
              <Text style={[s.nutritionRecapValue, isDark && { color: '#FFF' }]}>
                {nutritionRecap.avgCalories}
              </Text>
              <Text style={[s.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                kcal/jour
              </Text>
            </View>
            <View style={s.nutritionRecapItem}>
              <Text style={[s.nutritionRecapValue, isDark && { color: '#FFF' }]}>
                {nutritionRecap.avgProteins}g
              </Text>
              <Text style={[s.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                prot ({nutritionRecap.proteinPerKg}g/kg)
              </Text>
            </View>
            <View style={s.nutritionRecapItem}>
              <Text style={[s.nutritionRecapValue, { color: nutritionRecap.dailyBalance >= 0 ? '#F59E0B' : '#3B82F6' }]}>
                {nutritionRecap.dailyBalance >= 0 ? '+' : ''}{nutritionRecap.dailyBalance}
              </Text>
              <Text style={[s.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                {nutritionRecap.dailyBalance >= 0 ? 'surplus' : 'deficit'}
              </Text>
            </View>
          </View>
          <View style={s.nutritionRecapTags}>
            {nutritionRecap.muscleGainG > 0 && (
              <View style={[s.tag, isDark && s.tagDark]}>
                <Text style={[s.tagText, { color: '#059669' }]}>
                  +{nutritionRecap.muscleGainG}g muscle
                </Text>
              </View>
            )}
            <View style={[s.tag, isDark && s.tagDark]}>
              <Text style={[s.tagText, { color: nutritionRecap.fatChangeG > 0 ? '#EF4444' : '#059669' }]}>
                {nutritionRecap.fatChangeG >= 0 ? '+' : ''}{nutritionRecap.fatChangeG}g gras
              </Text>
            </View>
            {nutritionRecap.projectedWeight && (
              <View style={[s.tag, isDark && s.tagDark]}>
                <Text style={[s.tagText, isDark && { color: '#CCC' }]}>
                  Proj. {nutritionRecap.projectedWeight} kg
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* CTA conseils */}
      {tips.length > 0 && !showTips && (
        <TouchableOpacity
          style={[s.cta, isDark && s.ctaDark]}
          onPress={() => setShowTips(true)}
          activeOpacity={0.7}
        >
          <Text style={[s.ctaText, isDark && s.ctaTextDark]}>Mes conseils personnalisés</Text>
          <Ionicons name="chevron-forward" size={14} color={isDark ? '#86c1ad' : '#6db39b'} />
        </TouchableOpacity>
      )}

      {/* Tips carousel */}
      {showTips && tips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tipsRow}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 10}
        >
          {tips.map((tip, i) => (
            <View
              key={i}
              style={[s.tipCard, { backgroundColor: isDark ? TINT_BG[tip.tint].dark : TINT_BG[tip.tint].light }]}
            >
              <Text style={s.tipEmoji}>{tip.emoji}</Text>
              <Text style={[s.tipTitle, isDark && s.tipTitleDark]}>{tip.title}</Text>
              <Text style={[s.tipText, isDark && s.tipTextDark]}>{tip.text}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 150,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  message: {
    fontSize: theme.fontSize.sm,
    marginTop: 4,
    opacity: 0.9,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.lg,
    width: '100%',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    opacity: 0.8,
  },

  // Nutrition recap
  nutritionRecap: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  nutritionRecapDark: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  nutritionRecapTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionRecapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  nutritionRecapItem: {
    alignItems: 'center',
  },
  nutritionRecapValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  nutritionRecapLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  nutritionRecapTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tagDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(109, 179, 155, 0.25)',
    backgroundColor: 'rgba(109, 179, 155, 0.04)',
  },
  ctaDark: {
    borderColor: 'rgba(134, 193, 173, 0.2)',
    backgroundColor: 'rgba(134, 193, 173, 0.06)',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6db39b',
  },
  ctaTextDark: {
    color: '#86c1ad',
  },

  // Tips carousel
  tipsRow: {
    paddingTop: 16,
    gap: 10,
  },
  tipCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  tipTitleDark: {
    color: '#eee',
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#666',
    fontWeight: '400',
  },
  tipTextDark: {
    color: '#999',
  },
});
