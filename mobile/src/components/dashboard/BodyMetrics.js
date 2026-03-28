import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Formater une date relative
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/**
 * Carte d'historique horizontale
 */
const HistoryCard = ({ item, type, onPress, isDark, isFirst }) => {
  const getValue = () => {
    switch (type) {
      case 'imc':
        return `${item.imc?.toFixed(1) || item.imc}`;
      case 'calories':
        return `${item.calories}`;
      case 'rm':
        return `${item.rm}`;
      case 'cardio':
        return `${item.fcMax}`;
      default:
        return '';
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'imc':
        return '';
      case 'calories':
        return 'kcal';
      case 'rm':
        return 'kg';
      case 'cardio':
        return 'bpm';
      default:
        return '';
    }
  };

  const getSubLabel = () => {
    switch (type) {
      case 'rm':
        return item.exercice || '';
      case 'calories':
        const labels = { perte: 'Perte', stabiliser: 'Maintien', prise: 'Prise' };
        return labels[item.objectif] || '';
      default:
        return '';
    }
  };

  const subLabel = getSubLabel();

  return (
    <TouchableOpacity
      style={[
        styles.historyCard,
        isDark && styles.historyCardDark,
        isFirst && styles.historyCardFirst,
      ]}
      onPress={() => onPress(item, type)}
      activeOpacity={0.7}
    >
      <Text style={[styles.historyValue, isDark && styles.historyValueDark]}>
        {getValue()}
        <Text style={styles.historyUnit}> {getUnit()}</Text>
      </Text>
      {subLabel ? (
        <Text style={[styles.historySubLabel, isDark && styles.historyDateDark]} numberOfLines={1}>
          {subLabel}
        </Text>
      ) : null}
      <Text style={[styles.historyDate, isDark && styles.historyDateDark]}>
        {formatDate(item.savedAt)}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Section de métrique avec scroll horizontal
 */
const MetricSection = ({ title, icon, iconColor, data, type, history, onCardPress, isDark }) => {
  if (!data && (!history || history.length === 0)) return null;

  const displayHistory = history || [];

  return (
    <View style={styles.metricSection}>
      {/* Header avec icône */}
      <TouchableOpacity
        style={styles.metricHeader}
        onPress={() => displayHistory.length > 0 && onCardPress(displayHistory[0], type)}
        activeOpacity={0.7}
      >
        <View style={[styles.metricIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.metricTitle, isDark && styles.metricTitleDark]}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#999'} />
      </TouchableOpacity>

      {/* Scroll horizontal des entrées */}
      {displayHistory.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.historyScroll}
        >
          {displayHistory.map((item, index) => (
            <HistoryCard
              key={`${type}-${item.id || item.savedAt || index}-${index}`}
              item={item}
              type={type}
              onPress={onCardPress}
              isDark={isDark}
              isFirst={index === 0}
            />
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.noDataText, isDark && styles.noDataTextDark]}>
          Aucune donnée enregistrée
        </Text>
      )}
    </View>
  );
};

// ─── IMC gauge ───────────────────────────────────────────────────────────────
const IMC_ZONES = [
  { label: 'Maigreur',  min: 0,    max: 18.5, color: '#60A5FA' },
  { label: 'Normal',    min: 18.5, max: 25,   color: '#34D399' },
  { label: 'Surpoids',  min: 25,   max: 30,   color: '#FBBF24' },
  { label: 'Obésité',   min: 30,   max: 40,   color: '#F87171' },
];

const IMCGauge = ({ value, isDark }) => {
  const imc = parseFloat(value) || 0;
  const clampedImc = Math.min(Math.max(imc, 0), 40);
  const pct = (clampedImc / 40) * 100;
  const activeZone = IMC_ZONES.find(z => imc >= z.min && imc < z.max) || IMC_ZONES[IMC_ZONES.length - 1];

  return (
    <View style={gaugeStyles.wrapper}>
      {/* Barre segmentée */}
      <View style={gaugeStyles.track}>
        {IMC_ZONES.map((zone) => (
          <View
            key={zone.label}
            style={[gaugeStyles.segment, {
              flex: zone.max - zone.min,
              backgroundColor: zone.color,
              opacity: activeZone.label === zone.label ? 1 : 0.25,
            }]}
          />
        ))}
        {/* Curseur */}
        <View style={[gaugeStyles.cursor, { left: `${Math.min(pct, 97)}%` }]} />
      </View>

      {/* Légende */}
      <View style={gaugeStyles.legend}>
        {IMC_ZONES.map((zone) => (
          <View key={zone.label} style={gaugeStyles.legendItem}>
            <View style={[gaugeStyles.legendDot, { backgroundColor: zone.color }]} />
            <Text style={[gaugeStyles.legendLabel, isDark && { color: '#AAA' }]}>{zone.label}</Text>
          </View>
        ))}
      </View>

      {/* Zone active */}
      <View style={[gaugeStyles.badge, { backgroundColor: activeZone.color + '22', borderColor: activeZone.color }]}>
        <Text style={[gaugeStyles.badgeText, { color: activeZone.color }]}>{activeZone.label}</Text>
      </View>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  wrapper: { marginVertical: 16 },
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 12,
  },
  segment: { borderRadius: 6 },
  cursor: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#333',
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  legendItem: { alignItems: 'center', gap: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: '#888' },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  badgeText: { fontWeight: '700', fontSize: 14 },
});

// ─── 1RM percentage grid ──────────────────────────────────────────────────────
const RMGrid = ({ percentages, rm, isDark }) => {
  const defaultPcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
  const items = percentages?.length
    ? percentages
    : defaultPcts.map(p => ({ percent: p, weight: Math.round((rm * p) / 100 * 2) / 2 }));

  const zoneColor = (pct) => {
    if (pct >= 95) return '#F87171';
    if (pct >= 85) return '#FBBF24';
    if (pct >= 75) return '#F7B186';
    return '#B8DDD1';
  };

  return (
    <View style={rmStyles.grid}>
      {items.slice(0, 9).map((p, i) => (
        <View
          key={i}
          style={[rmStyles.cell, isDark && rmStyles.cellDark, { borderTopColor: zoneColor(p.percent) }]}
        >
          <Text style={[rmStyles.cellPct, { color: zoneColor(p.percent) }]}>{p.percent}%</Text>
          <Text style={[rmStyles.cellWeight, isDark && { color: '#FFF' }]}>{p.weight} kg</Text>
          {p.zone ? <Text style={rmStyles.cellZone}>{p.zone}</Text> : null}
        </View>
      ))}
    </View>
  );
};

const rmStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cell: {
    width: (SCREEN_WIDTH - 80) / 3,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  cellDark: { backgroundColor: '#2A2A2A' },
  cellPct: { fontSize: 13, fontWeight: '700' },
  cellWeight: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginVertical: 2 },
  cellZone: { fontSize: 10, color: '#999', textAlign: 'center' },
});

// ─── Macros bar ───────────────────────────────────────────────────────────────
const MacroBar = ({ label, value, total, color, isDark }) => {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <View style={macroStyles.row}>
      <Text style={[macroStyles.label, isDark && { color: '#CCC' }]}>{label}</Text>
      <View style={macroStyles.barTrack}>
        <View style={[macroStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[macroStyles.value, isDark && { color: '#FFF' }]}>{value}g</Text>
    </View>
  );
};

const macroStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 80, fontSize: 13, color: '#666' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  value: { width: 45, fontSize: 13, fontWeight: '600', color: '#1A1A1A', textAlign: 'right' },
});

// ─── Detail Modal (bottom sheet animé) ───────────────────────────────────────
const DetailModal = ({ visible, onClose, data, type, isDark }) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && data) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, data]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        damping: 24,
        stiffness: 280,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  }, [onClose]);

  if (!mounted || !data) return null;

  const META = {
    imc:      { title: 'IMC', subtitle: 'Indice de Masse Corporelle', icon: 'scale',   color: '#B8DDD1' },
    calories: { title: 'Calories', subtitle: 'Objectif calorique journalier', icon: 'flame',   color: '#F7B186' },
    rm:       { title: '1RM',     subtitle: 'Charge maximale estimée',       icon: 'barbell', color: '#F7B186' },
    cardio:   { title: 'FC Max',  subtitle: 'Fréquence cardiaque maximale',  icon: 'heart',   color: '#F87171' },
  };
  const meta = META[type] || { title: 'Détails', subtitle: '', icon: 'information-circle', color: '#F7B186' };

  const renderHero = () => {
    switch (type) {
      case 'imc':
        return (
          <View style={sheetStyles.hero}>
            <Text style={[sheetStyles.heroValue, { color: meta.color }]}>
              {data.imc?.toFixed(1) ?? data.imc}
            </Text>
            <Text style={[sheetStyles.heroUnit, isDark && { color: '#AAA' }]}>IMC</Text>
            <View style={sheetStyles.heroSub}>
              {data.poids ? <Text style={[sheetStyles.heroChip, isDark && { backgroundColor: '#333', color: '#EEE' }]}>{data.poids} kg</Text> : null}
              {data.taille ? <Text style={[sheetStyles.heroChip, isDark && { backgroundColor: '#333', color: '#EEE' }]}>{data.taille} cm</Text> : null}
            </View>
          </View>
        );
      case 'rm':
        return (
          <View style={sheetStyles.hero}>
            <Text style={[sheetStyles.heroValue, { color: meta.color }]}>{data.rm}</Text>
            <Text style={[sheetStyles.heroUnit, isDark && { color: '#AAA' }]}>kg</Text>
            {data.exercice ? (
              <View style={[sheetStyles.exercicePill, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
                <Text style={[sheetStyles.exercicePillText, { color: meta.color }]}>{data.exercice}</Text>
              </View>
            ) : null}
            <View style={sheetStyles.heroSub}>
              {data.poidsSouleve ? <Text style={[sheetStyles.heroChip, isDark && { backgroundColor: '#333', color: '#EEE' }]}>{data.poidsSouleve} kg × {data.reps} reps</Text> : null}
            </View>
          </View>
        );
      case 'calories':
        return (
          <View style={sheetStyles.hero}>
            <Text style={[sheetStyles.heroValue, { color: meta.color }]}>{data.calories ?? data.maintenance}</Text>
            <Text style={[sheetStyles.heroUnit, isDark && { color: '#AAA' }]}>kcal/jour</Text>
            {data.objectif ? (
              <View style={[sheetStyles.exercicePill, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
                <Text style={[sheetStyles.exercicePillText, { color: meta.color }]}>
                  {{ perte: 'Perte de poids', stabiliser: 'Maintien', prise: 'Prise de masse' }[data.objectif] ?? data.objectif}
                </Text>
              </View>
            ) : null}
          </View>
        );
      case 'cardio':
        return (
          <View style={sheetStyles.hero}>
            <Text style={[sheetStyles.heroValue, { color: meta.color }]}>{data.fcMax}</Text>
            <Text style={[sheetStyles.heroUnit, isDark && { color: '#AAA' }]}>bpm</Text>
            {data.age ? <Text style={[sheetStyles.heroChip, { alignSelf: 'center', marginTop: 8, backgroundColor: '#FEE2E2', color: '#F87171' }]}>{data.age} ans</Text> : null}
          </View>
        );
      default: return null;
    }
  };

  const renderDetails = () => {
    switch (type) {
      case 'imc':
        return (
          <>
            <IMCGauge value={data.imc} isDark={isDark} />
            {data.poidsIdealMin && data.poidsIdealMax ? (
              <View style={[sheetStyles.infoBox, isDark && sheetStyles.infoBoxDark]}>
                <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                <Text style={[sheetStyles.infoBoxText, isDark && { color: '#CCC' }]}>
                  Poids idéal : {data.poidsIdealMin} – {data.poidsIdealMax} kg
                </Text>
              </View>
            ) : null}
          </>
        );

      case 'rm':
        return (
          <>
            <SectionTitle label="Charges par pourcentage" isDark={isDark} />
            <RMGrid percentages={data.percentages} rm={data.rm} isDark={isDark} />
          </>
        );

      case 'calories':
        return (
          <>
            <View style={[sheetStyles.statsRow]}>
              <StatBox label="TMB" value={`${data.tmb ?? '—'}`} unit="kcal" isDark={isDark} />
              <StatBox label="Maintien" value={`${data.maintenance ?? '—'}`} unit="kcal" isDark={isDark} />
            </View>
            {data.macros ? (
              <>
                <SectionTitle label="Macros recommandées" isDark={isDark} />
                <View style={[sheetStyles.card, isDark && sheetStyles.cardDark]}>
                  <MacroBar label="Protéines" value={data.macros.proteines} total={(data.macros.proteines||0)+(data.macros.glucides||0)+(data.macros.lipides||0)} color="#F7B186" isDark={isDark} />
                  <MacroBar label="Glucides"  value={data.macros.glucides}  total={(data.macros.proteines||0)+(data.macros.glucides||0)+(data.macros.lipides||0)} color="#B8DDD1" isDark={isDark} />
                  <MacroBar label="Lipides"   value={data.macros.lipides}   total={(data.macros.proteines||0)+(data.macros.glucides||0)+(data.macros.lipides||0)} color="#FBBF24" isDark={isDark} />
                </View>
              </>
            ) : null}
          </>
        );

      case 'cardio':
        if (!data.zones) return null;
        const zonesList = [
          { key: 'echauffement', label: 'Échauffement', color: '#60A5FA' },
          { key: 'brulerGraisse', label: 'Brûle-graisses', color: '#34D399' },
          { key: 'cardio', label: 'Cardio', color: '#FBBF24' },
          { key: 'performance', label: 'Performance', color: '#F87171' },
          { key: 'anaerobie', label: 'Anaérobie', color: '#EF4444' },
        ];
        return (
          <>
            <SectionTitle label="Zones cardiaques" isDark={isDark} />
            {zonesList.map(z => data.zones[z.key] ? (
              <View key={z.key} style={[sheetStyles.zoneRow, isDark && { borderColor: '#333' }]}>
                <View style={[sheetStyles.zoneDot, { backgroundColor: z.color }]} />
                <Text style={[sheetStyles.zoneLabel, isDark && { color: '#CCC' }]}>{z.label}</Text>
                <Text style={[sheetStyles.zoneRange, { color: z.color }]}>
                  {data.zones[z.key].min}–{data.zones[z.key].max} bpm
                </Text>
              </View>
            ) : null)}
          </>
        );

      default: return null;
    }
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay fané */}
      <Animated.View style={[sheetStyles.overlayBase, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
      </Animated.View>

      {/* Sheet qui monte avec spring */}
      <Animated.View
        style={[
          sheetStyles.sheet,
          isDark && sheetStyles.sheetDark,
          { paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY }] },
        ]}
      >
        {/* Drag handle */}
        <View style={sheetStyles.handle} />

        {/* Header */}
        <View style={sheetStyles.header}>
          <View style={[sheetStyles.iconBadge, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sheetStyles.headerTitle, isDark && { color: '#FFF' }]}>{meta.title}</Text>
            <Text style={[sheetStyles.headerSub, isDark && { color: '#888' }]}>{meta.subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={sheetStyles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={28} color={isDark ? '#555' : '#CCC'} />
          </TouchableOpacity>
        </View>

        {data.date || data.savedAt ? (
          <Text style={[sheetStyles.dateText, isDark && { color: '#666' }]}>
            {formatDate(data.date || data.savedAt)}
          </Text>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {renderHero()}
          {renderDetails()}
          <View style={{ height: 8 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const SectionTitle = ({ label, isDark }) => (
  <Text style={[sheetStyles.sectionLabel, isDark && { color: '#CCC' }]}>{label}</Text>
);

const StatBox = ({ label, value, unit, isDark }) => (
  <View style={[sheetStyles.statBox, isDark && sheetStyles.statBoxDark]}>
    <Text style={[sheetStyles.statValue, isDark && { color: '#FFF' }]}>{value}</Text>
    <Text style={[sheetStyles.statUnit, isDark && { color: '#888' }]}>{unit}</Text>
    <Text style={[sheetStyles.statLabel, isDark && { color: '#888' }]}>{label}</Text>
  </View>
);


/**
 * BodyMetrics - Métriques corporelles avec historique et modal
 */
export const BodyMetrics = ({ weightData, calorieTargets, rmData, cardioData }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Ne pas afficher si pas de données
  if (!weightData && !calorieTargets && !rmData && !cardioData) {
    return null;
  }

  const handleCardPress = (data, type) => {
    setSelectedData(data);
    setSelectedType(type);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Corps & Nutrition
      </Text>

      {/* IMC */}
      <MetricSection
        title="IMC"
        icon="scale"
        iconColor="#B8DDD1"
        data={weightData}
        type="imc"
        history={weightData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* Calories */}
      <MetricSection
        title="Calories"
        icon="flame"
        iconColor={theme.colors.primary}
        data={calorieTargets}
        type="calories"
        history={calorieTargets?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* 1RM */}
      <MetricSection
        title="1RM"
        icon="barbell"
        iconColor="#F7B186"
        data={rmData}
        type="rm"
        history={rmData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* FC Max */}
      <MetricSection
        title="FC Max"
        icon="heart"
        iconColor="#EF4444"
        data={cardioData}
        type="cardio"
        history={cardioData?.history}
        onCardPress={handleCardPress}
        isDark={isDark}
      />

      {/* Modal de détails */}
      <DetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={selectedData}
        type={selectedType}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },

  // Metric Section
  metricSection: {
    marginBottom: theme.spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  metricTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  metricTitleDark: {
    color: '#FFFFFF',
  },

  // History Scroll
  historyScroll: {
    paddingRight: theme.spacing.md,
  },
  historyCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    minWidth: 85,
    maxWidth: 120,
    alignItems: 'center',
  },
  historyCardDark: {
    backgroundColor: '#3A3A3A',
  },
  historyCardFirst: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  historyValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  historyValueDark: {
    color: '#FFFFFF',
  },
  historyUnit: {
    fontSize: theme.fontSize.xs,
    fontWeight: '400',
  },
  historySubLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    maxWidth: 80,
  },
  historyDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  historyDateDark: {
    color: '#888',
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
  noDataTextDark: {
    color: '#666',
  },

});

// ─── Bottom sheet styles ──────────────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetDark: { backgroundColor: '#1C1C1E' },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  iconBadge: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  headerSub: { fontSize: 12, color: '#999', marginTop: 1 },
  closeBtn: { padding: 4 },
  dateText: { fontSize: 12, color: '#AAAAAA', marginBottom: 16, marginTop: 6 },

  // Hero
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroValue: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
  heroUnit: { fontSize: 16, color: '#999', marginTop: 2, fontWeight: '500' },
  heroSub: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, fontSize: 13, color: '#444', fontWeight: '500',
  },
  exercicePill: {
    marginTop: 10, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  exercicePillText: { fontWeight: '700', fontSize: 14 },

  // Cards & sections
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 10,
  },
  card: {
    backgroundColor: '#F9FAFB', borderRadius: 16,
    padding: 16, marginBottom: 8,
  },
  cardDark: { backgroundColor: '#2A2A2A' },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12,
    padding: 12, marginTop: 4,
  },
  infoBoxDark: { backgroundColor: '#1A2E22' },
  infoBoxText: { fontSize: 13, color: '#444', flex: 1 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 4 },
  statBox: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statBoxDark: { backgroundColor: '#2A2A2A' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  statUnit: { fontSize: 11, color: '#999', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#999', fontWeight: '500' },

  // Cardio zones
  zoneRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F0F0F0',
    gap: 10,
  },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  zoneLabel: { flex: 1, fontSize: 14, color: '#444' },
  zoneRange: { fontSize: 14, fontWeight: '700' },

  // Detail rows (kept for compatibility)
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
});
