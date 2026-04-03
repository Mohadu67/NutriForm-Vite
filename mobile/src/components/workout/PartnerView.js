import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const TYPE_CONFIG = {
  muscu: { icon: 'barbell', color: '#8B5CF6' },
  poids_du_corps: { icon: 'body', color: '#06B6D4' },
  cardio: { icon: 'heart', color: '#EF4444' },
  yoga: { icon: 'leaf', color: '#8B5CF6' },
  swim: { icon: 'water', color: '#3B82F6' },
  stretch: { icon: 'flower', color: '#10B981' },
  walk_run: { icon: 'walk', color: '#F59E0B' },
};

function PartnerSetRow({ set, index, isDark }) {
  const weight = Number(set?.weight ?? 0);
  const reps = Number(set?.reps ?? 0);
  const completed = set?.completed;

  return (
    <View style={[s.setRow, completed && s.setRowDone, isDark && s.setRowDark]}>
      <Text style={[s.setNum, isDark && s.muted]}>{index + 1}</Text>
      <Text style={[s.setVal, isDark && s.textW]}>{weight > 0 ? `${weight} kg` : '-'}</Text>
      <Text style={[s.setVal, isDark && s.textW]}>{reps > 0 ? `${reps} reps` : '-'}</Text>
      <Ionicons
        name={completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={completed ? '#22C55E' : (isDark ? '#444' : '#CCC')}
      />
    </View>
  );
}

function PartnerExerciseCard({ exercise, entry, index, isDark }) {
  const typeArr = Array.isArray(exercise.type) ? exercise.type : [exercise.type || 'muscu'];
  const mainType = typeArr[0];
  const tc = TYPE_CONFIG[mainType] || TYPE_CONFIG.muscu;
  const mode = entry?.mode || mainType;
  const isDone = entry?.done;
  const sets = entry?.sets || [];
  const cardioSets = entry?.cardioSets || [];

  return (
    <View style={[s.card, isDark && s.cardDark]}>
      {/* Header */}
      <View style={s.cardHdr}>
        <View style={[s.cardIcon, { backgroundColor: `${tc.color}20` }]}>
          <Ionicons name={tc.icon} size={18} color={tc.color} />
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.cardName, isDark && s.textW]} numberOfLines={1}>{exercise.exerciseName}</Text>
          <Text style={[s.cardSub, isDark && s.muted]}>
            {isDone ? 'Terminé' : entry ? 'En cours...' : 'Pas commencé'}
          </Text>
        </View>
        {isDone && (
          <View style={s.doneBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          </View>
        )}
      </View>

      {/* Content */}
      {!entry && (
        <Text style={[s.waiting, isDark && s.muted]}>En attente des saisies...</Text>
      )}

      {/* Muscu / PDC sets */}
      {entry && sets.length > 0 && (
        <View style={s.setsWrap}>
          <View style={s.setsHdr}>
            <Text style={[s.setsHdrTxt, isDark && s.muted, { flex: 0.4 }]}>Set</Text>
            <Text style={[s.setsHdrTxt, isDark && s.muted, { flex: 1 }]}>Poids</Text>
            <Text style={[s.setsHdrTxt, isDark && s.muted, { flex: 1 }]}>Reps</Text>
            <Text style={[s.setsHdrTxt, isDark && s.muted, { width: 30 }]}></Text>
          </View>
          {sets.map((set, i) => (
            <PartnerSetRow key={i} set={set} index={i} isDark={isDark} />
          ))}
        </View>
      )}

      {/* Cardio sets */}
      {entry && cardioSets.length > 0 && (
        <View style={s.setsWrap}>
          {cardioSets.map((cs, i) => {
            const dur = Number(cs?.durationSec ?? 0);
            const dist = Number(cs?.distance ?? cs?.distanceKm ?? 0);
            return (
              <View key={i} style={[s.setRow, isDark && s.setRowDark]}>
                <Text style={[s.setNum, isDark && s.muted]}>{i + 1}</Text>
                <Text style={[s.setVal, isDark && s.textW]}>{dur > 0 ? `${Math.round(dur / 60)}min` : '-'}</Text>
                <Text style={[s.setVal, isDark && s.textW]}>{dist > 0 ? `${dist}m` : '-'}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Special modes */}
      {entry?.swim && (
        <Text style={[s.specialTxt, isDark && s.muted]}>
          🏊 {entry.swim.lapCount || 0} longueurs ({entry.swim.poolLength || 25}m)
        </Text>
      )}
      {entry?.yoga && (
        <Text style={[s.specialTxt, isDark && s.muted]}>
          🧘 {entry.yoga.durationMin || 0} min{entry.yoga.style ? ` — ${entry.yoga.style}` : ''}
        </Text>
      )}
      {entry?.stretch && (
        <Text style={[s.specialTxt, isDark && s.muted]}>
          🤸 {Math.round((entry.stretch.durationSec || 0) / 60)} min
        </Text>
      )}
      {entry?.walkRun && (
        <Text style={[s.specialTxt, isDark && s.muted]}>
          🏃 {entry.walkRun.durationMin || 0} min{entry.walkRun.distanceKm ? ` — ${entry.walkRun.distanceKm} km` : ''}
        </Text>
      )}
    </View>
  );
}

export default function PartnerView({ exercises, partnerExerciseData, partnerName, isDark }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (partnerExerciseData?.size > 0) setLastUpdate(Date.now());
  }, [partnerExerciseData]);

  useEffect(() => {
    const id = setInterval(() => setStale(Date.now() - lastUpdate > 30000), 15000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  const completedCount = useMemo(() => {
    let c = 0;
    if (partnerExerciseData) {
      for (const [, entry] of partnerExerciseData) { if (entry.done) c++; }
    }
    return c;
  }, [partnerExerciseData]);

  const total = exercises?.length || 0;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <View style={s.container}>
      {/* Partner header */}
      <View style={[s.partnerHdr, isDark && s.partnerHdrDk]}>
        <View style={s.partnerRow}>
          <View style={[s.avatarCircle, isDark && s.avatarCircleDk]}>
            <Text style={s.avatarTxt}>{(partnerName || 'P')[0].toUpperCase()}</Text>
            <View style={[s.statusDot, { backgroundColor: stale ? '#F59E0B' : '#22C55E' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.partnerName, isDark && s.textW]}>{partnerName}</Text>
            <Text style={[s.partnerSub, isDark && s.muted]}>{completedCount}/{total} exercices — {pct}%</Text>
          </View>
        </View>
        <View style={[s.progressBar, isDark && s.progressBarDk]}>
          <View style={[s.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* Exercise list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
        {(exercises || []).map((ex, i) => (
          <PartnerExerciseCard
            key={ex.exerciseName || i}
            exercise={ex}
            entry={partnerExerciseData?.get?.(ex.exerciseName)}
            index={i}
            isDark={isDark}
          />
        ))}
        {(!exercises || exercises.length === 0) && (
          <Text style={[s.empty, isDark && s.muted]}>Aucun exercice dans la séance</Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  partnerHdr: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  partnerHdrDk: { borderBottomColor: 'rgba(255,255,255,0.06)' },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5F3EE', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarCircleDk: { backgroundColor: 'rgba(114,186,161,0.15)' },
  avatarTxt: { fontWeight: '800', fontSize: 14, color: '#478571' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  partnerName: { fontWeight: '700', fontSize: 14, color: '#333' },
  partnerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  progressBar: { height: 4, backgroundColor: '#E5E5E5', borderRadius: 2, overflow: 'hidden' },
  progressBarDk: { backgroundColor: '#333' },
  progressFill: { height: '100%', backgroundColor: '#72baa1', borderRadius: 2 },
  scrollPad: { padding: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, marginLeft: 10 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#333' },
  cardSub: { fontSize: 11, color: '#888', marginTop: 1 },
  doneBadge: { marginLeft: 6 },
  waiting: { fontSize: 12, color: '#AAA', fontStyle: 'italic', paddingVertical: 8 },
  setsWrap: { marginTop: 4 },
  setsHdr: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  setsHdrTxt: { fontSize: 10, fontWeight: '600', color: '#888', textAlign: 'center', textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderRadius: 6 },
  setRowDone: { backgroundColor: 'rgba(34,197,94,0.05)' },
  setRowDark: {},
  setNum: { width: 24, fontSize: 12, fontWeight: '600', color: '#888', textAlign: 'center' },
  setVal: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333', textAlign: 'center' },
  specialTxt: { fontSize: 13, color: '#555', paddingVertical: 6 },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14, color: '#888' },
  textW: { color: '#FFF' },
  muted: { color: '#888' },
});
