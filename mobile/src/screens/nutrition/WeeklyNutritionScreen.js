import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { theme } from '../../theme';
import { getWeeklySummary } from '../../api/nutrition';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function WeeklyNutritionScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklySummary().then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, []);

  const days = data?.days || [];
  const averages = data?.averages || {};
  const max = Math.max(...days.map(d => Math.max(d.consumed || 0, d.burned || 0)), 1);
  const chartWidth = days.length * 52;
  const chartHeight = 160;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>Résumé hebdomadaire</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Chart */}
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Calories consommées vs brûlées</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Svg width={chartWidth} height={chartHeight + 30}>
                  {days.map((day, i) => {
                    const x = i * 52 + 8;
                    const consumedH = ((day.consumed || 0) / max) * chartHeight;
                    const burnedH = ((day.burned || 0) / max) * chartHeight;
                    const dayOfWeek = new Date(day.date).getDay();
                    const label = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

                    return (
                      <React.Fragment key={i}>
                        <Rect x={x} y={chartHeight - consumedH} width={16} height={consumedH} rx={4} fill="#3B82F6" opacity={0.8} />
                        <Rect x={x + 18} y={chartHeight - burnedH} width={16} height={burnedH} rx={4} fill="#EF4444" opacity={0.8} />
                        <SvgText x={x + 17} y={chartHeight + 18} textAnchor="middle" fontSize={11} fill={isDark ? '#888' : '#999'}>
                          {label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              </ScrollView>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Consommé</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Brûlé</Text>
                </View>
              </View>
            </View>

            {/* Averages */}
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Moyennes sur 7 jours</Text>
              <View style={styles.avgGrid}>
                <View style={styles.avgItem}>
                  <Text style={styles.avgValue}>{averages.calories || 0}</Text>
                  <Text style={styles.avgLabel}>kcal/jour</Text>
                </View>
                <View style={styles.avgItem}>
                  <Text style={styles.avgValue}>{averages.proteins || 0}g</Text>
                  <Text style={styles.avgLabel}>Protéines</Text>
                </View>
                <View style={styles.avgItem}>
                  <Text style={styles.avgValue}>{averages.carbs || 0}g</Text>
                  <Text style={styles.avgLabel}>Glucides</Text>
                </View>
                <View style={styles.avgItem}>
                  <Text style={styles.avgValue}>{averages.fats || 0}g</Text>
                  <Text style={styles.avgLabel}>Lipides</Text>
                </View>
              </View>
            </View>

            {/* Daily breakdown */}
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Détail par jour</Text>
              {days.map((day, i) => {
                const dayOfWeek = new Date(day.date).getDay();
                const label = DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
                return (
                  <View key={i} style={styles.dayRow}>
                    <Text style={[styles.dayLabel, isDark && { color: '#CCC' }]}>{label}</Text>
                    <Text style={[styles.dayValue, isDark && { color: '#E0E0E0' }]}>{day.consumed || 0} kcal</Text>
                    <Text style={styles.dayBalance}>
                      {(day.consumed || 0) - (day.burned || 0) > 0 ? '+' : ''}
                      {(day.consumed || 0) - (day.burned || 0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.light },
  containerDark: { backgroundColor: '#1A1A1A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 4 },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semiBold, color: '#000' },
  titleDark: { color: '#FFF' },
  content: { padding: theme.spacing.lg },
  card: {
    backgroundColor: '#FFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: { backgroundColor: '#2A2A2A' },
  cardTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold, color: '#333', marginBottom: theme.spacing.md },
  cardTitleDark: { color: '#FFF' },
  legend: { flexDirection: 'row', gap: theme.spacing.lg, marginTop: theme.spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: theme.fontSize.xs, color: '#888' },
  avgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  avgItem: { width: '45%', alignItems: 'center', paddingVertical: theme.spacing.sm },
  avgValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  avgLabel: { fontSize: theme.fontSize.xs, color: '#888', marginTop: 2 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  dayLabel: { width: 40, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: '#555' },
  dayValue: { flex: 1, fontSize: theme.fontSize.sm, color: '#333' },
  dayBalance: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semiBold, color: '#888' },
});
