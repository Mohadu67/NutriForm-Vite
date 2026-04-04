import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 44;
const SW = 4;
const R = (SIZE - SW) / 2;
const CIRC = 2 * Math.PI * R;

export const WeeklyGoalSection = ({
  stats,
  weeklyGoal = 4,
  weeklyProgress = 0,
  weeklyCalories = 0,
  onEditGoal,
}) => {
  const isDark = useColorScheme() === 'dark';
  const done = stats.last7Days;
  const isCompleted = weeklyProgress >= 100;
  const remaining = Math.max(0, weeklyGoal - done);
  const offset = CIRC - (Math.min(weeklyProgress, 100) / 100) * CIRC;
  const ringColor = isCompleted ? '#22c55e' : '#72baa1';

  return (
    <View style={[s.container, isDark && s.containerDark]}>
      {/* Mini ring */}
      <View style={s.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e8e8e8'} strokeWidth={SW} />
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={ringColor} strokeWidth={SW} strokeLinecap="round"
            strokeDasharray={`${CIRC}`} strokeDashoffset={offset}
            rotation={-90} origin={`${SIZE / 2},${SIZE / 2}`} />
        </Svg>
        <Text style={[s.ringText, isDark && s.tw]}>
          {done}<Text style={s.ringGoal}>/{weeklyGoal}</Text>
        </Text>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.title, isDark && s.tw]}>
          {isCompleted ? 'Objectif atteint !' : `${remaining} séance${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
        </Text>
        {weeklyCalories > 0 && (
          <Text style={s.sub}>{weeklyCalories.toLocaleString()} kcal cette semaine</Text>
        )}
      </View>

      {/* Edit */}
      {onEditGoal && (
        <TouchableOpacity onPress={onEditGoal} style={s.editBtn} activeOpacity={0.7}>
          <Ionicons name="pencil" size={14} color="#a8a29e" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  containerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 13, fontWeight: '800', color: '#1c1917' },
  ringGoal: { fontSize: 10, fontWeight: '500', color: '#a8a29e' },
  tw: { color: '#f3f3f6' },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  sub: { fontSize: 11, color: '#a8a29e' },
  editBtn: { padding: 6 },
});
