import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Animated, Vibration, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../ui/SafeImage';
import { useWorkout } from '../../contexts/WorkoutContext';
import {
  useSmartTracking, useExerciseData, useProgressionSuggestion, getSmartSuggestedValues,
} from '../../hooks/useSmartTracking';
import { detectRecord, calculateDifference } from '../../utils/progressionHelper';
import { detectExerciseMode, getAvailableModes, MODE_LABELS, MODE_ICONS } from '../../utils/exerciseTypeDetector';
import SwimForm from './forms/SwimForm';
import CardioForm from './forms/CardioSetRow';
import YogaForm from './forms/YogaForm';
import StretchForm from './forms/StretchForm';
import WalkRunForm from './forms/WalkRunForm';
import PdcSetRow from './forms/PdcSetRow';
import PartnerView from './PartnerView';
import { useSharedSession } from '../../contexts/SharedSessionContext';
import theme, { useTheme } from '../../theme';

const TYPE_CONFIG = {
  muscu: { icon: 'barbell', color: '#8B5CF6' },
  poids_du_corps: { icon: 'body', color: '#06B6D4' },
  cardio: { icon: 'heart', color: '#EF4444' },
  etirement: { icon: 'flower', color: '#10B981' },
  natation: { icon: 'water', color: '#3B82F6' },
  yoga: { icon: 'leaf', color: '#8B5CF6' },
  meditation: { icon: 'cloudy-night', color: '#6366F1' },
};

const MODE_DISPLAY = { muscu: 'Musculation', pdc: 'Poids du corps', cardio: 'Cardio', swim: 'Natation', yoga: 'Yoga', stretch: 'Etirement', walk_run: 'Course / Marche' };

// ─── Timer ───────────────────────────────────────────────────────────────────
const WorkoutTimer = ({ startTime, isDark }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
  const fmt = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  return (
    <View style={st.timerRow}>
      <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
      <Text style={[st.timerText, isDark && st.textDark]}>{fmt}</Text>
    </View>
  );
};

// ─── Set Row ─────────────────────────────────────────────────────────────────
const SetRow = ({ set, index, exerciceId, onUpdate, onToggle, onRemove, canRemove, isDark, exerciseData, smartEnabled, isSuggested }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const record = useMemo(() => (!smartEnabled || !exerciseData || !set.weight || !set.reps) ? null : detectRecord(set, exerciseData), [smartEnabled, exerciseData, set.weight, set.reps, set]);
  const difference = useMemo(() => (!smartEnabled || !exerciseData || !set.weight || !set.reps) ? null : calculateDifference(set, exerciseData, index), [smartEnabled, exerciseData, set.weight, set.reps, index, set]);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();
    if (!set.completed) Vibration.vibrate(50);
    onToggle(exerciceId, index);
  };

  return (
    <Animated.View style={[st.setRow, set.completed && st.setRowDone, isDark && st.setRowDark, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={[st.setNum, isDark && st.textMuted]}>{index + 1}</Text>
      <View style={st.inputGrp}>
        <TextInput style={[st.setInput, isDark && st.setInputDark, isSuggested && st.setInputSugg]}
          value={set.weight > 0 ? String(set.weight) : ''} keyboardType="numeric" placeholder="0" placeholderTextColor={isDark ? '#555' : '#CCC'}
          onChangeText={(v) => onUpdate(exerciceId, index, { weight: parseFloat(v) || 0, isSuggested: false })} />
        <Text style={[st.inputLbl, isDark && st.textMuted]}>kg</Text>
      </View>
      <View style={st.inputGrp}>
        <TextInput style={[st.setInput, isDark && st.setInputDark, isSuggested && st.setInputSugg]}
          value={set.reps > 0 ? String(set.reps) : ''} keyboardType="numeric" placeholder="0" placeholderTextColor={isDark ? '#555' : '#CCC'}
          onChangeText={(v) => onUpdate(exerciceId, index, { reps: parseInt(v) || 0, isSuggested: false })} />
        <Text style={[st.inputLbl, isDark && st.textMuted]}>reps</Text>
      </View>
      <View style={st.badges}>
        {isSuggested && <View style={st.suggBadge}><Ionicons name="bulb" size={12} color="#F59E0B" /></View>}
        {record && <View style={st.recBadge}><Ionicons name={record.icon || 'trophy'} size={12} color="#EF4444" /></View>}
        {difference?.hasChange && !record && (
          <Text style={[st.diffTxt, difference.isPositive ? st.diffPos : st.diffNeg]}>
            {difference.weightDiff !== 0 && `${difference.weightDiff > 0 ? '+' : ''}${difference.weightDiff}kg`}
            {difference.weightDiff !== 0 && difference.repsDiff !== 0 && ' '}
            {difference.repsDiff !== 0 && `${difference.repsDiff > 0 ? '+' : ''}${difference.repsDiff}r`}
          </Text>
        )}
      </View>
      <TouchableOpacity style={st.checkBtn} onPress={handleToggle}>
        <Ionicons name={set.completed ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={set.completed ? '#22C55E' : (isDark ? '#555' : '#CCC')} />
      </TouchableOpacity>
      {canRemove && <TouchableOpacity style={st.rmSetBtn} onPress={() => onRemove(exerciceId, index)}><Ionicons name="close" size={18} color="#EF4444" /></TouchableOpacity>}
    </Animated.View>
  );
};

// ─── Exercise Card ──────────────────────────────────────────────────────────
const ExerciseCard = ({ exerciseData, onAddSet, onRemoveSet, onUpdateSet, onToggleSet, onRemoveExercise, onMoveUp, onMoveDown, isFirst, isLast, isDark, smartEnabled, onAddSmartSet, onAddCardioSet, onRemoveCardioSet, onUpdateCardioSet, onUpdateExerciseData, onChangeMode }) => {
  const { exercice, sets, mode: exMode, cardioSets, swim, yoga, stretch, walkRun } = exerciseData;
  const mode = exMode || detectExerciseMode(exercice);
  const availableModes = useMemo(() => getAvailableModes(exercice), [exercice]);
  const canSwitchMode = availableModes.length > 1;
  const tc = TYPE_CONFIG[exercice.type] || TYPE_CONFIG.muscu;
  const hasSets = mode === 'muscu' || mode === 'pdc';
  const done = hasSets && sets ? sets.filter(s => s.completed).length : 0;
  const total = hasSets && sets ? sets.length : (cardioSets ? cardioSets.length : 1);
  const isPdc = mode === 'pdc';

  const { data: hist, isLoading: histLoad } = useExerciseData(exercice.id, exercice.name, smartEnabled && hasSets);
  const suggestion = useProgressionSuggestion(hist, isPdc, exercice.name, smartEnabled && hasSets);

  const handleAdd = useCallback(() => {
    if (mode === 'cardio') { onAddCardioSet(exercice.id); return; }
    if (!hasSets) return;
    if (smartEnabled && (hist || (sets && sets.length > 0))) {
      onAddSmartSet(exercice.id, getSmartSuggestedValues(sets || [], hist, isPdc, smartEnabled));
    } else { onAddSet(exercice.id); }
  }, [mode, smartEnabled, hist, sets, isPdc, exercice.id, onAddSet, onAddSmartSet, onAddCardioSet, hasSets]);

  const progLabel = hasSets ? `${done}/${total} series` : mode === 'cardio' ? `${cardioSets?.length || 0} series` : (MODE_DISPLAY[mode] || '');

  const renderForm = () => {
    switch (mode) {
      case 'swim': return <SwimForm swim={swim || {}} onPatch={(p) => onUpdateExerciseData(exercice.id, 'swim', p)} isDark={isDark} />;
      case 'yoga': return <YogaForm yoga={yoga || {}} onPatch={(p) => onUpdateExerciseData(exercice.id, 'yoga', p)} isDark={isDark} />;
      case 'stretch': return <StretchForm stretch={stretch || {}} onPatch={(p) => onUpdateExerciseData(exercice.id, 'stretch', p)} isDark={isDark} />;
      case 'walk_run': return <WalkRunForm walkRun={walkRun || {}} onPatch={(p) => onUpdateExerciseData(exercice.id, 'walkRun', p)} isDark={isDark} />;
      case 'cardio': return <CardioForm cardioSets={cardioSets || []} onAdd={() => onAddCardioSet(exercice.id)} onRemove={(i) => onRemoveCardioSet(exercice.id, i)} onPatch={(i, p) => onUpdateCardioSet(exercice.id, i, p)} isDark={isDark} />;
      case 'pdc': return (<>
        <View style={st.setsHdr}><Text style={[st.setsHdrTxt, isDark && st.textMuted, { flex: 0.5 }]}>Serie</Text><Text style={[st.setsHdrTxt, isDark && st.textMuted, { flex: 1 }]}>Reps</Text><Text style={[st.setsHdrTxt, isDark && st.textMuted, { width: 60 }]}></Text></View>
        {(sets || []).map((s, i) => <PdcSetRow key={i} set={s} index={i} exerciceId={exercice.id} onUpdate={onUpdateSet} onToggle={onToggleSet} onRemove={onRemoveSet} canRemove={(sets || []).length > 1} isDark={isDark} isSuggested={s.isSuggested} />)}
        <TouchableOpacity style={[st.addSetBtn, isDark && st.addSetBtnDk]} onPress={handleAdd}><Ionicons name="add" size={20} color={theme.colors.primary} /><Text style={st.addSetTxt}>Ajouter une serie</Text></TouchableOpacity>
      </>);
      default: return (<>
        <View style={st.setsHdr}><Text style={[st.setsHdrTxt, isDark && st.textMuted, { flex: 0.5 }]}>Serie</Text><Text style={[st.setsHdrTxt, isDark && st.textMuted, { flex: 1 }]}>Poids</Text><Text style={[st.setsHdrTxt, isDark && st.textMuted, { flex: 1 }]}>Reps</Text><Text style={[st.setsHdrTxt, isDark && st.textMuted, { width: 80 }]}></Text></View>
        {(sets || []).map((s, i) => <SetRow key={i} set={s} index={i} exerciceId={exercice.id} onUpdate={onUpdateSet} onToggle={onToggleSet} onRemove={onRemoveSet} canRemove={(sets || []).length > 1} isDark={isDark} exerciseData={hist} smartEnabled={smartEnabled} isSuggested={s.isSuggested} />)}
        <TouchableOpacity style={[st.addSetBtn, isDark && st.addSetBtnDk]} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={theme.colors.primary} /><Text style={st.addSetTxt}>Ajouter une serie</Text>
          {smartEnabled && hist && <View style={st.smartBdg}><Ionicons name="sparkles" size={12} color="#F59E0B" /></View>}
        </TouchableOpacity>
      </>);
    }
  };

  return (
    <View style={[st.card, isDark && st.cardDark]}>
      <View style={st.cardHdr}>
        <View style={[st.cardIcon, { backgroundColor: `${tc.color}20` }]}>
          {exercice.image ? <SafeImage source={{ uri: exercice.image }} style={st.cardImg} resizeMode="cover" placeholderIcon="barbell-outline" placeholderSize={20} />
            : <Ionicons name={tc.icon} size={20} color={tc.color} />}
        </View>
        <View style={st.cardInfo}><Text style={[st.cardName, isDark && st.textDark]}>{exercice.name}</Text><Text style={[st.cardProg, isDark && st.textMuted]}>{progLabel}</Text></View>
        <View style={st.reorderBtns}>
          <TouchableOpacity style={[st.reorderBtn, isFirst && st.reorderOff]} onPress={() => !isFirst && onMoveUp(exercice.id)} disabled={isFirst}><Ionicons name="chevron-up" size={18} color={isFirst ? '#CCC' : theme.colors.primary} /></TouchableOpacity>
          <TouchableOpacity style={[st.reorderBtn, isLast && st.reorderOff]} onPress={() => !isLast && onMoveDown(exercice.id)} disabled={isLast}><Ionicons name="chevron-down" size={18} color={isLast ? '#CCC' : theme.colors.primary} /></TouchableOpacity>
        </View>
        <TouchableOpacity style={st.rmExBtn} onPress={() => onRemoveExercise(exercice.id)}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
      </View>
      {hasSets && smartEnabled && suggestion?.message && (
        <View style={[st.suggBanner, isDark && st.suggBannerDk]}>
          <View style={st.suggRow}><Ionicons name="bulb" size={16} color="#F59E0B" /><Text style={[st.suggTxt, isDark && st.suggTxtDk]}>{suggestion.message}</Text></View>
          {suggestion.isProgression && <View style={st.suggIcon}><Ionicons name="trending-up" size={12} color="#22C55E" /></View>}
        </View>
      )}
      {hasSets && smartEnabled && histLoad && <View style={st.histLoad}><ActivityIndicator size="small" color={theme.colors.primary} /><Text style={[st.histLoadTxt, isDark && st.textMuted]}>Chargement historique...</Text></View>}
      {canSwitchMode && (
        <View style={st.modeSwitch}>
          {availableModes.map((m) => (
            <TouchableOpacity key={m} style={[st.modeChip, mode === m && st.modeChipOn, isDark && mode !== m && st.modeChipDk]} onPress={() => { if (m !== mode) onChangeMode(exercice.id, m); }}>
              <Ionicons name={MODE_ICONS[m] || 'ellipse'} size={14} color={mode === m ? '#FFF' : (isDark ? '#888' : '#666')} />
              <Text style={[st.modeChipTxt, mode === m && st.modeChipTxtOn, isDark && mode !== m && st.modeChipTxtDk]}>{MODE_LABELS[m] || m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {renderForm()}
    </View>
  );
};

// ─── Main Content ────────────────────────────────────────────────────────────
export default function WorkoutContent({ onClose, tabNavigation }) {
  const { isDark } = useTheme();
  const ownNavigation = useNavigation();
  const navigation = tabNavigation || ownNavigation;
  const { isEnabled: smartEnabled, toggleSmartTracking, isLoading: smartLoading } = useSmartTracking();

  const {
    currentWorkout, startWorkout, addSet, addCardioSet,
    removeSet, removeCardioSet, updateSet, updateCardioSet,
    updateExerciseData, changeExerciseMode, toggleSetComplete,
    removeExercise, moveExerciseUp, moveExerciseDown,
    finishWorkout, cancelWorkout, getCompletedSetsCount, getTotalSetsCount,
  } = useWorkout();

  // Shared session
  const shared = useSharedSession();
  const isShared = !!(shared?.session && (shared.session.status === 'active' || shared.session.status === 'building'));
  const [activeTab, setActiveTab] = useState('me');

  // Sync saisies au partenaire (debounced)
  const syncRef = useRef(null);
  useEffect(() => {
    if (!isShared || !currentWorkout?.exercises) return;
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => {
      currentWorkout.exercises.forEach((ex, i) => {
        const hasSets = ex.sets && ex.sets.some(s => s.reps > 0 || s.weight > 0 || s.completed);
        const hasCardio = ex.cardioSets && ex.cardioSets.some(s => s.durationSec > 0 || s.durationMin > 0);
        if (!hasSets && !hasCardio && !ex.swim && !ex.yoga && !ex.stretch && !ex.walkRun) return;
        shared.sendExerciseData({
          exerciseOrder: i,
          exerciseName: ex.exercice?.name || '',
          mode: ex.mode || 'muscu',
          sets: ex.sets || [],
          cardioSets: ex.cardioSets || [],
          swim: ex.swim || null, yoga: ex.yoga || null,
          stretch: ex.stretch || null, walkRun: ex.walkRun || null,
          done: ex.sets ? ex.sets.every(s => s.completed) : false,
        });
      });
    }, 800);
    return () => clearTimeout(syncRef.current);
  }, [isShared, currentWorkout?.exercises]);

  useEffect(() => {
    if (isShared && shared?.loadProgress) shared.loadProgress();
  }, [isShared]);

  const handleSmartSet = useCallback((id, vals) => {
    addSet(id);
    setTimeout(() => {
      if (currentWorkout) {
        const ex = currentWorkout.exercises.find(e => e.exercice.id === id);
        if (ex) { const i = ex.sets.length - 1; if (i >= 0) updateSet(id, i, { weight: vals.weight || 0, reps: vals.reps || 0, isSuggested: true }); }
      }
    }, 50);
  }, [addSet, updateSet, currentWorkout]);

  const handleFinish = useCallback(() => {
    const c = getCompletedSetsCount(), t = getTotalSetsCount();
    if (c === 0) {
      Alert.alert('Seance vide', 'Aucune serie completee. Terminer ?', [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: async () => { await finishWorkout(); onClose?.(); } },
      ]); return;
    }
    Alert.alert('Terminer ?', `${c}/${t} series completees.`, [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Terminer', onPress: async () => { const f = await finishWorkout(); if (f) Alert.alert('Bravo !', `Terminee en ${f.duration} min !`); onClose?.(); } },
    ]);
  }, [finishWorkout, getCompletedSetsCount, getTotalSetsCount, onClose]);

  const handleCancel = useCallback(() => {
    Alert.alert('Annuler ?', 'Toute la seance sera supprimee.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: async () => { await cancelWorkout(); onClose?.(); } },
    ]);
  }, [cancelWorkout, onClose]);

  const handleAddEx = useCallback(() => {
    onClose?.();
    setTimeout(() => navigation.navigate('ExercicesTab', { screen: 'Exercices' }), 300);
  }, [navigation, onClose]);

  const handleRmEx = useCallback((id) => {
    Alert.alert('Supprimer ?', 'Toutes les series seront supprimees.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeExercise(id) },
    ]);
  }, [removeExercise]);

  // Pas de workout local mais séance partagée → montrer uniquement le panel partenaire
  if (!currentWorkout && isShared) {
    return (
      <View style={st.content}>
        <View style={[st.header, isDark && st.headerDk]}>
          <View style={{ flex: 1 }}>
            <Text style={[st.headerTitle, isDark && st.textDark]}>Séance avec {shared?.partner?.pseudo || 'Partenaire'}</Text>
          </View>
        </View>
        <PartnerView
          exercises={shared?.session?.exercises || []}
          partnerExerciseData={shared?.partnerExerciseData}
          partnerName={shared?.partner?.pseudo || 'Partenaire'}
          isDark={isDark}
        />
      </View>
    );
  }

  if (!currentWorkout) return null;
  const isPrep = !currentWorkout.startTime;
  const completed = getCompletedSetsCount(), total = getTotalSetsCount();
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={st.content}>
      {/* Header */}
      <View style={[st.header, isDark && st.headerDk]}>
        <View style={{ flex: 1 }}>
          <Text style={[st.headerTitle, isDark && st.textDark]}>{isPrep ? 'Preparation' : 'Seance en cours'}</Text>
          {currentWorkout.startTime && <WorkoutTimer startTime={currentWorkout.startTime} isDark={isDark} />}
        </View>
        <TouchableOpacity onPress={handleCancel} style={st.cancelBtn}><Ionicons name="close" size={20} color="#EF4444" /></TouchableOpacity>
      </View>

      {/* Onglet Ma séance / Partenaire */}
      {isShared && (
        <View style={[st.tabRow, isDark && st.tabRowDk]}>
          <TouchableOpacity style={[st.tab, activeTab === 'me' && st.tabOn]} onPress={() => setActiveTab('me')}>
            <Ionicons name="person" size={14} color={activeTab === 'me' ? theme.colors.primary : '#888'} />
            <Text style={[st.tabTxt, activeTab === 'me' && st.tabTxtOn]}>Ma séance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.tab, activeTab === 'partner' && st.tabOnPartner]} onPress={() => setActiveTab('partner')}>
            <Ionicons name="people" size={14} color={activeTab === 'partner' ? '#72baa1' : '#888'} />
            <Text style={[st.tabTxt, activeTab === 'partner' && st.tabTxtOnPartner]}>
              {shared?.partner?.pseudo || 'Partenaire'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(!isShared || activeTab === 'me') ? (
        <>
          {/* Progress + Smart */}
          <View style={[st.progWrap, isDark && st.progWrapDk]}>
            <View style={st.progRow}>
              <View style={{ flex: 1 }}><Text style={[st.progLbl, isDark && st.textMuted]}>Progression</Text><Text style={[st.progVal, isDark && st.textDark]}>{completed}/{total} series</Text></View>
              <TouchableOpacity style={[st.smartTgl, smartEnabled && st.smartTglOn, isDark && st.smartTglDk]} onPress={toggleSmartTracking} disabled={smartLoading}>
                <Ionicons name={smartEnabled ? 'sparkles' : 'sparkles-outline'} size={14} color={smartEnabled ? '#F59E0B' : (isDark ? '#666' : '#999')} />
                <Text style={[st.smartTglTxt, smartEnabled && st.smartTglTxtOn, isDark && st.smartTglTxtDk]}>{smartEnabled ? 'Smart ON' : 'Smart'}</Text>
              </TouchableOpacity>
            </View>
            <View style={[st.progBar, isDark && st.progBarDk]}><View style={[st.progFill, { width: `${progress}%` }]} /></View>
          </View>

          {/* Exercises */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {currentWorkout.exercises.map((ex, i) => (
              <ExerciseCard key={ex.exercice.id} exerciseData={ex}
                onAddSet={addSet} onAddCardioSet={addCardioSet} onRemoveSet={removeSet} onRemoveCardioSet={removeCardioSet}
                onUpdateSet={updateSet} onUpdateCardioSet={updateCardioSet} onUpdateExerciseData={updateExerciseData}
                onToggleSet={toggleSetComplete} onRemoveExercise={handleRmEx} onMoveUp={moveExerciseUp} onMoveDown={moveExerciseDown}
                isFirst={i === 0} isLast={i === currentWorkout.exercises.length - 1}
                isDark={isDark} smartEnabled={smartEnabled} onAddSmartSet={handleSmartSet} onChangeMode={changeExerciseMode} />
            ))}
            <TouchableOpacity style={[st.addExBtn, isDark && st.addExBtnDk]} onPress={handleAddEx}>
              <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} /><Text style={st.addExTxt}>Ajouter un exercice</Text>
            </TouchableOpacity>
            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Action */}
          <View style={[st.actionBar, isDark && st.actionBarDk]}>
            {isPrep ? (
              <TouchableOpacity style={[st.actBtn, st.startBtn]} onPress={() => { startWorkout(); Vibration.vibrate(100); }} activeOpacity={0.8}>
                <Ionicons name="play-circle" size={20} color="#FFF" /><Text style={st.actBtnTxt}>Demarrer</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[st.actBtn, st.finishBtn, completed === 0 && st.actBtnOff]} onPress={handleFinish} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={st.actBtnTxt}>Terminer</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <PartnerView
          exercises={shared?.session?.exercises || []}
          partnerExerciseData={shared?.partnerExerciseData}
          partnerName={shared?.partner?.pseudo || 'Partenaire'}
          isDark={isDark}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  headerDk: {},
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cancelBtn: { padding: 6, borderRadius: 16, backgroundColor: '#FEE2E2' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timerText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, fontVariant: ['tabular-nums'] },
  progWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  progWrapDk: {},
  progRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progLbl: { fontSize: 12, color: '#888' },
  progVal: { fontSize: 13, fontWeight: '600', color: '#333' },
  progBar: { height: 6, backgroundColor: '#E5E5E5', borderRadius: 3, overflow: 'hidden' },
  progBarDk: { backgroundColor: '#333' },
  progFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 3 },
  smartTgl: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)' },
  smartTglOn: { backgroundColor: '#FEF3C7' },
  smartTglDk: { backgroundColor: '#2A2A2A' },
  smartTglTxt: { fontSize: 11, fontWeight: '600', color: '#999' },
  smartTglTxtOn: { color: '#F59E0B' },
  smartTglTxtDk: { color: '#666' },
  scrollPad: { padding: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: 40, height: 40, borderRadius: 10 },
  cardInfo: { flex: 1, marginLeft: 10 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardProg: { fontSize: 12, color: '#888', marginTop: 1 },
  reorderBtns: { flexDirection: 'column', marginRight: 6 },
  reorderBtn: { padding: 3 },
  reorderOff: { opacity: 0.3 },
  rmExBtn: { padding: 6 },
  setsHdr: { flexDirection: 'row', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 6 },
  setsHdrTxt: { fontSize: 11, fontWeight: '500', color: '#888', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderRadius: 8, marginBottom: 2 },
  setRowDone: { backgroundColor: '#22C55E0D' },
  setRowDark: { backgroundColor: 'transparent' },
  setNum: { width: 28, fontSize: 13, fontWeight: '600', color: '#888', textAlign: 'center' },
  inputGrp: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  setInput: { width: 48, height: 34, backgroundColor: '#F5F5F5', borderRadius: 8, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#333' },
  setInputDark: { backgroundColor: '#2A2A2A', color: '#FFF' },
  setInputSugg: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  inputLbl: { fontSize: 11, color: '#888' },
  checkBtn: { width: 40, alignItems: 'center' },
  rmSetBtn: { width: 22, alignItems: 'center' },
  badges: { width: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  suggBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  recBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  diffTxt: { fontSize: 10, fontWeight: '600' },
  diffPos: { color: '#22C55E' },
  diffNeg: { color: '#EF4444' },
  modeSwitch: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 14, backgroundColor: '#F0F0F0' },
  modeChipOn: { backgroundColor: theme.colors.primary },
  modeChipDk: { backgroundColor: '#2A2A2A' },
  modeChipTxt: { fontSize: 11, fontWeight: '500', color: '#666' },
  modeChipTxtOn: { color: '#FFF', fontWeight: '600' },
  modeChipTxtDk: { color: '#888' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: `${theme.colors.primary}10`, marginTop: 6, gap: 6 },
  addSetBtnDk: { backgroundColor: `${theme.colors.primary}20` },
  addSetTxt: { fontSize: 13, fontWeight: '500', color: theme.colors.primary },
  smartBdg: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', gap: 6 },
  addExBtnDk: { borderColor: theme.colors.primary },
  addExTxt: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  actionBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.08)' },
  actionBarDk: { borderTopColor: '#333' },
  actBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  startBtn: { backgroundColor: theme.colors.primary },
  finishBtn: { backgroundColor: '#22C55E' },
  actBtnOff: { backgroundColor: '#22C55E80' },
  actBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  textDark: { color: '#FFF' },
  textMuted: { color: '#888' },
  suggBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 10 },
  suggBannerDk: { backgroundColor: '#422006' },
  suggRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggTxt: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' },
  suggTxtDk: { color: '#FCD34D' },
  suggIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  histLoad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  histLoadTxt: { fontSize: 11, color: '#666' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  tabRowDk: { borderBottomColor: 'rgba(255,255,255,0.06)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
  tabOn: { backgroundColor: `${theme.colors.primary}15` },
  tabOnPartner: { backgroundColor: 'rgba(114,186,161,0.12)' },
  tabTxt: { fontSize: 13, fontWeight: '500', color: '#888' },
  tabTxtOn: { color: theme.colors.primary, fontWeight: '700' },
  tabTxtOnPartner: { color: '#72baa1', fontWeight: '700' },
});
