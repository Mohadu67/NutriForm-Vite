import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Animated, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

// ─── Constants ───────────────────────────────────────────
const MINT = '#72baa1';
const MINT_LIGHT = '#E5F3EE';
const MINT_DARK = 'rgba(114,186,161,0.15)';
const SUCCESS = '#22C55E';
const ORANGE = theme.colors.primary || '#E8895A';

const TYPE_ICONS = {
  muscu: 'barbell', poids_du_corps: 'body', cardio: 'heart',
  yoga: 'leaf', swim: 'water', stretch: 'flower', walk_run: 'walk',
  natation: 'water', etirement: 'flower', meditation: 'moon',
};

// ─── Helpers ─────────────────────────────────────────────
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function summarizeSets(entry) {
  if (!entry) return null;
  const sets = entry.sets || [];
  const filled = sets.filter(s => Number(s?.reps ?? 0) > 0 || Number(s?.weight ?? 0) > 0);
  if (filled.length > 0) {
    const maxW = Math.max(...filled.map(s => Number(s?.weight ?? 0)));
    const avgR = Math.round(filled.reduce((a, s) => a + Number(s?.reps ?? 0), 0) / filled.length);
    return maxW > 0 ? `${filled.length}\u00D7${avgR} @ ${maxW}kg` : `${filled.length}\u00D7${avgR}`;
  }
  if (entry.cardioSets?.length > 0) {
    const dur = entry.cardioSets.reduce((a, s) => a + Number(s?.durationSec ?? 0), 0);
    return dur > 0 ? `${Math.round(dur / 60)}min` : null;
  }
  if (entry.swim) return `${entry.swim.lapCount || 0} longueurs`;
  if (entry.yoga) return `${entry.yoga.durationMin || 0}min`;
  if (entry.stretch) return `${Math.round((entry.stretch.durationSec || 0) / 60)}min`;
  if (entry.walkRun) return `${entry.walkRun.durationMin || 0}min`;
  return null;
}

function countTotalSets(partnerExerciseData) {
  let count = 0;
  if (!partnerExerciseData) return 0;
  for (const [, entry] of partnerExerciseData) {
    count += (entry.sets?.length || 0) + (entry.cardioSets?.length || 0);
    if (entry.swim || entry.yoga || entry.stretch || entry.walkRun) count += 1;
  }
  return count;
}

// ─── Live Timer ──────────────────────────────────────────
function LiveTimer({ startedAt, isDark }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <View style={st.timerPill}>
      <Ionicons name="time-outline" size={12} color={MINT} />
      <Text style={st.timerText}>{formatDuration(elapsed)}</Text>
    </View>
  );
}

// ─── Set Row (read-only) ─────────────────────────────────
function SetRow({ set, index, isDark }) {
  const w = Number(set?.weight ?? 0);
  const r = Number(set?.reps ?? 0);
  const done = set?.completed;
  return (
    <View style={[st.setRow, done && st.setRowDone]}>
      <View style={[st.setNum, done && st.setNumDone]}>
        <Text style={[st.setNumTxt, done && st.setNumTxtDone]}>{index + 1}</Text>
      </View>
      <Text style={[st.setVal, isDark && st.textW]}>{w > 0 ? `${w}` : '—'}</Text>
      <Text style={[st.setUnit, isDark && st.muted]}>kg</Text>
      <Text style={[st.setVal, isDark && st.textW]}>{r > 0 ? `${r}` : '—'}</Text>
      <Text style={[st.setUnit, isDark && st.muted]}>reps</Text>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={done ? SUCCESS : (isDark ? '#333' : '#DDD')}
      />
    </View>
  );
}

// ─── Exercise Card (premium design) ──────────────────────
function ExerciseCard({ exercise, entry, isDark, isFinished }) {
  const typeArr = Array.isArray(exercise.type) ? exercise.type : [exercise.type || 'muscu'];
  const icon = TYPE_ICONS[typeArr[0]] || 'barbell';
  const isDone = entry?.done;
  const isCurrent = entry && !isDone;
  const hasNoData = !entry;
  const sets = entry?.sets || [];
  const cardioSets = entry?.cardioSets || [];
  const summary = summarizeSets(entry);

  // Calcul du taux de complétion des sets
  const completedSets = sets.filter(s => s?.completed).length;
  const totalSetsCount = sets.length;
  const completionRatio = totalSetsCount > 0 ? completedSets / totalSetsCount : (isDone ? 1 : 0);

  // Couleurs interpolées entre rouge (0%) → orange (50%) → vert (100%)
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const ratioColor = (() => {
    const r = completionRatio;
    if (r <= 0 && !isCurrent) return null; // pending = pas de couleur
    if (r <= 0.5) {
      // Rouge → Orange
      const t = r * 2;
      return `rgb(${lerp(239, 245, t)}, ${lerp(68, 158, t)}, ${lerp(68, 11, t)})`;
    }
    // Orange → Vert
    const t = (r - 0.5) * 2;
    return `rgb(${lerp(245, 34, t)}, ${lerp(158, 197, t)}, ${lerp(11, 94, t)})`;
  })();

  const status = isDone ? 'done' : isCurrent ? 'current' : 'pending';
  const accentColor = ratioColor || (status === 'pending' ? '#CCC' : MINT);

  const statusConfig = {
    done:    { bg: isDark ? 'rgba(255,255,255,0.03)' : '#FEFFFE', border: isDark ? 'rgba(34,197,94,0.15)' : '#D5F5E3' },
    current: { bg: isDark ? 'rgba(255,255,255,0.03)' : '#FEFEFE', border: isDark ? `${accentColor}20` : `${accentColor}25` },
    pending: { bg: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA', border: isDark ? 'rgba(255,255,255,0.06)' : '#EBEBEB' },
  };
  const cfg = statusConfig[status];

  return (
    <View style={[st.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {/* Status accent bar — couleur selon le taux de complétion */}
      <View style={[st.cardAccent, { backgroundColor: accentColor }]} />

      {/* Header row */}
      <View style={st.cardHeader}>
        <View style={[st.cardIconWrap, { backgroundColor: `${accentColor}18` }]}>
          {exercise.image ? (
            <Image source={{ uri: exercise.image }} style={st.cardImg} />
          ) : (
            <Ionicons name={icon} size={16} color={accentColor} />
          )}
        </View>
        <View style={st.cardMid}>
          <Text style={[st.cardName, isDark && st.textW]} numberOfLines={1}>{exercise.exerciseName}</Text>
          <View style={st.cardMetaRow}>
            {isDone && <View style={st.statusChip}><Ionicons name="checkmark-circle" size={11} color={SUCCESS} /><Text style={st.statusChipTxt}>Terminé</Text></View>}
            {isCurrent && (
              <View style={[st.statusChip, { backgroundColor: `${accentColor}15` }]}>
                <View style={[st.pulseDot, { backgroundColor: accentColor }]} />
                <Text style={[st.statusChipTxt, { color: accentColor }]}>En cours · {completedSets}/{totalSetsCount}</Text>
              </View>
            )}
            {hasNoData && <Text style={st.cardWaiting}>En attente...</Text>}
            {summary && <Text style={st.cardSummaryTxt}>{summary}</Text>}
          </View>
        </View>
        {isDone ? (
          <View style={st.doneChip}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
        ) : isCurrent && totalSetsCount > 0 ? (
          <View style={st.miniProgressWrap}>
            <Text style={[st.miniProgressTxt, { color: accentColor }]}>{Math.round(completionRatio * 100)}%</Text>
            <View style={st.miniProgressTrack}>
              <View style={[st.miniProgressFill, { width: `${completionRatio * 100}%`, backgroundColor: accentColor }]} />
            </View>
          </View>
        ) : null}
      </View>

      {/* Sets table */}
      {(isFinished || isDone || isCurrent) && sets.length > 0 && (
        <View style={[st.setsContainer, isDark && st.setsContainerDk]}>
          <View style={st.setsHeader}>
            <Text style={[st.setsHdrCell, { width: 32 }]}>#</Text>
            <Text style={[st.setsHdrCell, { flex: 1 }]}>POIDS</Text>
            <Text style={[st.setsHdrCell, { flex: 1 }]}>REPS</Text>
            <Text style={[st.setsHdrCell, { width: 28 }]} />
          </View>
          {sets.map((set, i) => <SetRow key={i} set={set} index={i} isDark={isDark} />)}
        </View>
      )}

      {/* Cardio */}
      {(isFinished || isDone || isCurrent) && cardioSets.length > 0 && (
        <View style={[st.setsContainer, isDark && st.setsContainerDk]}>
          {cardioSets.map((cs, i) => (
            <View key={i} style={st.specialRow}>
              <View style={[st.specialIcon, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="heart" size={11} color="#EF4444" />
              </View>
              <Text style={[st.specialVal, isDark && st.textW]}>
                {Number(cs?.durationSec ?? 0) > 0 ? `${Math.round(Number(cs.durationSec) / 60)} min` : ''}
                {Number(cs?.distance ?? cs?.distanceKm ?? 0) > 0 ? `  ·  ${cs.distance || cs.distanceKm}m` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Special modes */}
      {entry?.swim && <SpecialLine icon="water" color="#3B82F6" text={`${entry.swim.lapCount || 0} longueurs (${entry.swim.poolLength || 25}m)`} isDark={isDark} />}
      {entry?.yoga && <SpecialLine icon="leaf" color="#8B5CF6" text={`${entry.yoga.durationMin || 0} min${entry.yoga.style ? ` · ${entry.yoga.style}` : ''}`} isDark={isDark} />}
      {entry?.stretch && <SpecialLine icon="flower" color="#10B981" text={`${Math.round((entry.stretch.durationSec || 0) / 60)} min étirements`} isDark={isDark} />}
      {entry?.walkRun && <SpecialLine icon="walk" color="#F59E0B" text={`${entry.walkRun.durationMin || 0} min${entry.walkRun.distanceKm ? ` · ${entry.walkRun.distanceKm} km` : ''}`} isDark={isDark} />}
    </View>
  );
}

function SpecialLine({ icon, color, text, isDark }) {
  return (
    <View style={[st.setsContainer, isDark && st.setsContainerDk]}>
      <View style={st.specialRow}>
        <View style={[st.specialIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={11} color={color} />
        </View>
        <Text style={[st.specialVal, isDark && st.textW]}>{text}</Text>
      </View>
    </View>
  );
}

// ─── Finished Header ─────────────────────────────────────
function FinishedHeader({ partnerName, partnerPhoto, startedAt, endedAt, completedCount, total, totalSets, isDark }) {
  const duration = startedAt && endedAt
    ? new Date(endedAt).getTime() - new Date(startedAt).getTime()
    : 0;

  return (
    <View style={[st.finishedHdr, isDark && st.finishedHdrDk]}>
      {/* Avatar + checkmark */}
      <View style={st.finishedAvatarWrap}>
        {partnerPhoto ? (
          <Image source={{ uri: partnerPhoto }} style={st.finishedAvatar} />
        ) : (
          <View style={[st.finishedAvatarFallback, isDark && { backgroundColor: MINT_DARK }]}>
            <Text style={st.finishedAvatarTxt}>{(partnerName || 'P')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={st.finishedCheck}>
          <Ionicons name="checkmark" size={10} color="#FFF" />
        </View>
      </View>

      <Text style={[st.finishedName, isDark && st.textW]}>{partnerName}</Text>
      <View style={st.finishedBadge}>
        <Ionicons name="trophy" size={11} color={ORANGE} />
        <Text style={st.finishedBadgeTxt}>Séance terminée</Text>
      </View>

      {/* Stats row */}
      <View style={st.statsRow}>
        <View style={st.statItem}>
          <Text style={[st.statValue, isDark && st.textW]}>{formatDuration(duration)}</Text>
          <Text style={st.statLabel}>Durée</Text>
        </View>
        <View style={[st.statDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        <View style={st.statItem}>
          <Text style={[st.statValue, isDark && st.textW]}>{completedCount}/{total}</Text>
          <Text style={st.statLabel}>Exos</Text>
        </View>
        <View style={[st.statDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        <View style={st.statItem}>
          <Text style={[st.statValue, isDark && st.textW]}>{totalSets}</Text>
          <Text style={st.statLabel}>Séries</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Active Header ───────────────────────────────────────
function ActiveHeader({ partnerName, partnerPhoto, startedAt, completedCount, total, pct, stale, isDark }) {
  return (
    <View style={[st.activeHdr, isDark && st.activeHdrDk]}>
      <View style={st.activeRow}>
        {/* Avatar */}
        <View style={st.activeAvatarWrap}>
          {partnerPhoto ? (
            <Image source={{ uri: partnerPhoto }} style={st.activeAvatar} />
          ) : (
            <View style={[st.activeAvatarFallback, isDark && { backgroundColor: MINT_DARK }]}>
              <Text style={st.activeAvatarTxt}>{(partnerName || 'P')[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={[st.statusDot, { backgroundColor: stale ? '#F59E0B' : SUCCESS }]} />
        </View>

        {/* Info */}
        <View style={st.activeInfo}>
          <Text style={[st.activeName, isDark && st.textW]} numberOfLines={1}>{partnerName}</Text>
          <View style={st.activeMetaRow}>
            <Text style={st.activeMeta}>{completedCount}/{total} exos</Text>
            {startedAt && <LiveTimer startedAt={startedAt} isDark={isDark} />}
          </View>
        </View>

        {/* Percentage */}
        <View style={st.pctWrap}>
          <Text style={st.pctValue}>{pct}</Text>
          <Text style={st.pctSign}>%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[st.progressTrack, isDark && st.progressTrackDk]}>
        <View style={[st.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function PartnerView({
  exercises, partnerExerciseData, partnerName, isDark,
  partnerPhoto, startedAt, endedAt, onAddExercise, onClose
}) {
  const scrollAtTopRef = useRef(true);
  const dismissPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 15 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50 || gs.vy > 0.5) onClose?.();
      },
    })
  ).current;
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
  const totalSets = useMemo(() => countTotalSets(partnerExerciseData), [partnerExerciseData]);
  const isFinished = !!endedAt;

  return (
    <View style={st.container}>
      <View {...dismissPan.panHandlers}>
      {isFinished ? (
        <FinishedHeader
          partnerName={partnerName} partnerPhoto={partnerPhoto}
          startedAt={startedAt} endedAt={endedAt}
          completedCount={completedCount} total={total} totalSets={totalSets}
          isDark={isDark}
        />
      ) : (
        <ActiveHeader
          partnerName={partnerName} partnerPhoto={partnerPhoto}
          startedAt={startedAt} completedCount={completedCount}
          total={total} pct={pct} stale={stale} isDark={isDark}
        />
      )}
      </View>

      {/* Bouton centré quand pas d'exos à moi */}
      {onAddExercise ? (
        <View style={st.addExCenter}>
          <TouchableOpacity style={[st.addExBtn, isDark && st.addExBtnDk]} onPress={onAddExercise} activeOpacity={0.8}>
            <View style={st.addExIcon}>
              <Ionicons name="add" size={28} color={ORANGE} />
            </View>
            <Text style={[st.addExTitle, isDark && { color: '#FFF' }]}>Ajoute tes exercices</Text>
            <Text style={st.addExSub}>Choisis les exos pour ta séance</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={st.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => { scrollAtTopRef.current = e.nativeEvent.contentOffset.y <= 0; }}
          scrollEventThrottle={16}
          onScrollEndDrag={(e) => {
            if (scrollAtTopRef.current && e.nativeEvent.velocity?.y < -0.5) onClose?.();
          }}
        >
          {isFinished && (
            <View style={st.sectionLabel}>
              <Ionicons name="list" size={14} color={isDark ? '#555' : '#AAA'} />
              <Text style={[st.sectionLabelTxt, isDark && st.muted]}>Détail des exercices</Text>
            </View>
          )}

          {(exercises || []).map((ex, i) => (
            <ExerciseCard
              key={ex.exerciseName || i}
              exercise={ex}
              entry={partnerExerciseData?.get?.(ex.exerciseName)}
              isDark={isDark}
              isFinished={isFinished}
            />
          ))}

          {(!exercises || exercises.length === 0) && (
            <View style={st.emptyWrap}>
              <Ionicons name="barbell-outline" size={32} color={isDark ? '#333' : '#DDD'} />
              <Text style={[st.emptyTxt, isDark && st.muted]}>Aucun exercice</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1 },

  // ── Active Header ──
  activeHdr: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  activeHdrDk: { borderBottomColor: 'rgba(255,255,255,0.06)' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  activeAvatarWrap: { position: 'relative' },
  activeAvatar: { width: 40, height: 40, borderRadius: 20 },
  activeAvatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: MINT_LIGHT, alignItems: 'center', justifyContent: 'center' },
  activeAvatarTxt: { fontWeight: '800', fontSize: 16, color: '#478571' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFF' },
  activeInfo: { flex: 1 },
  activeName: { fontWeight: '700', fontSize: 15, color: '#222', letterSpacing: -0.3 },
  activeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  activeMeta: { fontSize: 12, color: '#999', fontWeight: '500' },
  pctWrap: { flexDirection: 'row', alignItems: 'baseline' },
  pctValue: { fontSize: 28, fontWeight: '800', color: MINT, letterSpacing: -1 },
  pctSign: { fontSize: 14, fontWeight: '700', color: MINT, marginLeft: 1 },
  progressTrack: { height: 4, backgroundColor: '#ECECEC', borderRadius: 2, overflow: 'hidden' },
  progressTrackDk: { backgroundColor: '#2A2A2A' },
  progressFill: { height: '100%', backgroundColor: MINT, borderRadius: 2 },

  // ── Timer pill ──
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${MINT}12`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  timerText: { fontSize: 11, fontWeight: '700', color: MINT, fontVariant: ['tabular-nums'] },

  // ── Finished Header ──
  finishedHdr: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  finishedHdrDk: { borderBottomColor: 'rgba(255,255,255,0.06)' },
  finishedAvatarWrap: { position: 'relative', marginBottom: 10 },
  finishedAvatar: { width: 56, height: 56, borderRadius: 28 },
  finishedAvatarFallback: { width: 56, height: 56, borderRadius: 28, backgroundColor: MINT_LIGHT, alignItems: 'center', justifyContent: 'center' },
  finishedAvatarTxt: { fontWeight: '800', fontSize: 22, color: '#478571' },
  finishedCheck: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: SUCCESS, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  finishedName: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 4, letterSpacing: -0.3 },
  finishedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${ORANGE}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  finishedBadgeTxt: { fontSize: 12, fontWeight: '700', color: ORANGE },

  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#222', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#ECECEC' },

  // ── Section label ──
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginBottom: 10 },
  sectionLabelTxt: { fontSize: 12, fontWeight: '600', color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Cards ──
  scrollContent: { padding: 12, paddingTop: 14 },
  card: { borderRadius: 14, padding: 0, marginBottom: 10, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardAccent: { height: 3, width: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: 34, height: 34, borderRadius: 10 },
  cardMid: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#222', letterSpacing: -0.3 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${SUCCESS}12`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusChipTxt: { fontSize: 10, fontWeight: '700', color: SUCCESS },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: MINT },
  cardSummaryTxt: { fontSize: 11, fontWeight: '600', color: '#999' },
  cardWaiting: { fontSize: 11, color: '#CCC', fontStyle: 'italic' },
  doneChip: { width: 24, height: 24, borderRadius: 12, backgroundColor: SUCCESS, alignItems: 'center', justifyContent: 'center' },
  miniProgressWrap: { alignItems: 'flex-end', width: 40 },
  miniProgressTxt: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  miniProgressTrack: { width: 40, height: 3, backgroundColor: '#EBEBEB', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2 },

  // ── Sets table ──
  setsContainer: { marginHorizontal: 14, marginBottom: 12, padding: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 10 },
  setsContainerDk: { backgroundColor: 'rgba(255,255,255,0.03)' },
  setsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  setsHdrCell: { flex: 1, fontSize: 9, fontWeight: '800', color: '#BBB', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderRadius: 8, gap: 2, marginBottom: 2 },
  setRowDone: { backgroundColor: 'rgba(34,197,94,0.06)' },
  setNum: { width: 24, height: 24, borderRadius: 7, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  setNumDone: { backgroundColor: `${SUCCESS}18` },
  setNumTxt: { fontSize: 11, fontWeight: '800', color: '#BBB' },
  setNumTxtDone: { color: SUCCESS },
  setVal: { flex: 1, fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'center' },
  setUnit: { fontSize: 10, fontWeight: '600', color: '#CCC', marginRight: 6 },

  // ── Special modes ──
  specialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  specialIcon: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  specialVal: { fontSize: 13, fontWeight: '600', color: '#555' },

  // ── Empty ──
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTxt: { fontSize: 14, color: '#AAA' },

  // ── Add exercise (centered) ──
  addExCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  addExBtn: { alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: `${ORANGE}35`, backgroundColor: `${ORANGE}06`, width: '100%' },
  addExBtnDk: { backgroundColor: `${ORANGE}08`, borderColor: `${ORANGE}25` },
  addExIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${ORANGE}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  addExTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  addExSub: { fontSize: 13, color: '#999' },

  // ── Shared ──
  textW: { color: '#FFF' },
  muted: { color: '#777' },
});
