import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Rect, G } from 'react-native-svg';

import { theme } from '../../theme';
import {
  getDailySummary,
  addFoodLog,
  deleteFoodLog,
  syncBurnedCalories,
  getCarouselData,
  getWeekBarData,
  getWeeklySummary,
  getScansPlats,
  getScansIngredients,
  deleteScan,
} from '../../api/nutrition';
import {
  ProteinIcon,
  CarbsIcon,
  FatsIcon,
  FiberIcon,
  SugarIcon,
  SodiumIcon,
  SunriseIcon,
  SunFullIcon,
  MoonIcon,
  AppleIcon,
  FireIcon,
  CameraIcon,
  SearchIcon,
  BarChartIcon,
  PlusIcon,
  TrashIcon,
  CloseIcon,
} from './NutritionIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

/* ─── Mappings ─── */

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};
const MEAL_ICONS = {
  breakfast: { Icon: SunriseIcon, color: '#f0a47a' },
  lunch:     { Icon: SunFullIcon, color: '#72baa1' },
  dinner:    { Icon: MoonIcon,    color: '#5a9e87' },
  snack:     { Icon: AppleIcon,   color: '#c9a88c' },
};

const MACRO_META = {
  proteins: { label: 'Protéines', Icon: ProteinIcon, color: '#72baa1' },
  carbs:    { label: 'Glucides',  Icon: CarbsIcon,   color: '#f0a47a' },
  fats:     { label: 'Lipides',   Icon: FatsIcon,     color: '#c9a88c' },
};

const MICRO_META = {
  fiber:  { label: 'Fibres',  Icon: FiberIcon,  color: '#8b7fc7' },
  sugar:  { label: 'Sucres',  Icon: SugarIcon,  color: '#e8829b' },
  sodium: { label: 'Sodium',  Icon: SodiumIcon, color: '#d4a96a' },
};

const MEAL_META = {
  breakfast: { label: 'Petit-dej',  Icon: SunriseIcon, color: '#f0a47a' },
  lunch:     { label: 'Déjeuner',   Icon: SunFullIcon, color: '#72baa1' },
  dinner:    { label: 'Dîner',      Icon: MoonIcon,    color: '#8b7fc7' },
  snack:     { label: 'Collation',  Icon: AppleIcon,   color: '#d4a96a' },
};

const DAYS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/* ────────────────────────────────────────────────
   WeekBar
   ──────────────────────────────────────────────── */

const WR = 17;
const WS = 42;
const WC = 2 * Math.PI * WR;

function weekRingColor(pct) {
  if (pct < 25) return '#b8ddd0';
  if (pct < 50) return '#90c9b5';
  if (pct < 75) return '#72baa1';
  return '#4d9e84';
}

function DayRing({ hasData, progressPct, isFuture, isDark }) {
  if (isFuture) {
    return (
      <Svg width={WS} height={WS}>
        <Circle cx={WS / 2} cy={WS / 2} r={WR}
          fill="none" stroke={isDark ? '#333' : '#e0e0e0'} strokeWidth={1.5} />
      </Svg>
    );
  }
  if (!hasData) {
    return (
      <Svg width={WS} height={WS}>
        <Circle cx={WS / 2} cy={WS / 2} r={WR}
          fill="none" stroke={isDark ? '#444' : '#ccc'}
          strokeWidth={2} strokeDasharray="4,3.5" />
      </Svg>
    );
  }
  const off = WC - (Math.min(progressPct, 100) / 100) * WC;
  return (
    <Svg width={WS} height={WS}>
      <Circle cx={WS / 2} cy={WS / 2} r={WR}
        fill="none" stroke={isDark ? '#333' : '#e8e8e8'} strokeWidth={2} />
      <Circle cx={WS / 2} cy={WS / 2} r={WR}
        fill="none" stroke={weekRingColor(progressPct)} strokeWidth={2.5}
        strokeLinecap="round" strokeDasharray={`${WC}`} strokeDashoffset={off}
        rotation={-90} origin={`${WS / 2},${WS / 2}`} />
    </Svg>
  );
}

function WeekBar({ selectedDate, onChange, weeks, isDark }) {
  const scrollRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!weeks?.length || !scrollRef.current) return;
    const idx = weeks.findIndex((w) => w.some((d) => d.date === selectedDate));
    if (idx >= 0) setTimeout(() => scrollRef.current?.scrollTo({ x: idx * 7 * 52, animated: false }), 50);
  }, [weeks]);

  if (!weeks?.length) return null;

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
      style={s.weekBar} contentContainerStyle={s.weekBarContent}>
      {weeks.map((week, wi) => (
        <View key={wi} style={s.weekGroup}>
          {week.map((d) => {
            const sel = d.date === selectedDate;
            const fut = d.date > today;
            const dt = new Date(d.date + 'T12:00:00');
            const label = dt.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
            return (
              <TouchableOpacity key={d.date} activeOpacity={0.7} disabled={fut}
                style={[s.weekDayCol, sel && s.weekDayColSel, sel && isDark && s.weekDayColSelDark]}
                onPress={() => onChange(d.date)}>
                <Text style={[s.weekDayLabel, sel && s.weekDayLabelBold, isDark && s.weekDayLabelDark]}>
                  {label}
                </Text>
                <View style={s.weekDayRingWrap}>
                  <DayRing hasData={d.hasData} progressPct={d.progressPct} isFuture={fut} isDark={isDark} />
                  <Text style={[s.weekDayNum, fut && s.weekDayNumMuted, isDark && s.weekDayNumDark]}>
                    {dt.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

/* ────────────────────────────────────────────────
   Rings (SVG)
   ──────────────────────────────────────────────── */

function MiniRing({ pct, color, Icon, size = 52, sw = 4.5 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <View style={s.miniRingWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8e8" strokeWidth={sw} />
        <Circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={off}
          rotation={-90} origin={`${size / 2},${size / 2}`} />
      </Svg>
      <View style={s.miniRingIconWrap}>
        <Icon size={18} color={color} />
      </View>
    </View>
  );
}

function CalorieRing({ pct, size = 76, sw = 5.5 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <View style={s.calorieRingWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8e8" strokeWidth={sw} />
        <Circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#72baa1" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={off}
          rotation={-90} origin={`${size / 2},${size / 2}`} />
      </Svg>
      <View style={s.calorieRingIconWrap}>
        <FireIcon size={22} color="#f0a47a" />
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────
   Carousel Slides
   ──────────────────────────────────────────────── */

function SlideCalories({ calories, macros, isDark }) {
  return (
    <View style={[s.slide, { width: SLIDE_WIDTH }]}>
      <View style={[s.card, isDark && s.cardDark]}>
        <View style={s.calorieBody}>
          <View style={s.calorieLeft}>
            <Text style={[s.calorieValue, isDark && s.tw]}>{calories.remaining}</Text>
            <Text style={s.calorieLabel}>Calories restantes</Text>
          </View>
          <CalorieRing pct={calories.progressPct} />
        </View>
        <View style={[s.metaRow, isDark && s.metaRowDark]}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Objectif</Text>
            <Text style={[s.metaValue, isDark && s.tw]}>{calories.goal}</Text>
          </View>
          <View style={[s.metaSep, isDark && s.metaSepDark]} />
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Consommé</Text>
            <Text style={[s.metaValue, isDark && s.tw]}>{calories.consumed}</Text>
          </View>
          <View style={[s.metaSep, isDark && s.metaSepDark]} />
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Brûlé</Text>
            <Text style={[s.metaValue, isDark && s.tw]}>{calories.burned}</Text>
          </View>
        </View>
      </View>
      <View style={s.triCards}>
        {macros.map((m) => {
          const meta = MACRO_META[m.key];
          return (
            <View key={m.key} style={[s.triCard, isDark && s.cardDark]}>
              <Text style={[s.triCardValue, { color: meta.color }]}>{m.remaining}{m.unit}</Text>
              <Text style={s.triCardLabel}>{meta.label} rest.</Text>
              <MiniRing pct={m.progressPct} color={meta.color} Icon={meta.Icon} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SlideMicros({ micros, healthScore, isDark }) {
  const scoreLabel = healthScore.score != null ? `${healthScore.score}/100` : 'N/A';
  return (
    <View style={[s.slide, { width: SLIDE_WIDTH }]}>
      <View style={s.triCards}>
        {micros.map((m) => {
          const meta = MICRO_META[m.key];
          return (
            <View key={m.key} style={[s.triCard, isDark && s.cardDark]}>
              <Text style={[s.triCardValue, { color: meta.color }]}>{m.remaining}{m.unit}</Text>
              <Text style={s.triCardLabel}>{meta.label} restants</Text>
              <MiniRing pct={m.progressPct} color={meta.color} Icon={meta.Icon} />
            </View>
          );
        })}
      </View>
      <View style={[s.card, isDark && s.cardDark]}>
        <View style={s.scoreHeader}>
          <Text style={[s.scoreTitle, isDark && s.tw]}>Score de santé</Text>
          <Text style={[s.scoreValue, isDark && s.tw]}>{scoreLabel}</Text>
        </View>
        <View style={[s.scoreBarBg, isDark && s.scoreBarBgDark]}>
          <View style={[s.scoreBarFill, { width: `${healthScore.progressPct || 0}%` }]} />
        </View>
        <Text style={s.scoreDesc}>
          {healthScore.score != null
            ? "Ton score reflète la teneur nutritionnelle et l'équilibre de ta journée."
            : 'Suis quelques aliments pour générer ton score santé du jour. Ton score reflète la teneur nutritionnelle et le degré de transformation...'}
        </Text>
      </View>
    </View>
  );
}

function SlideMeals({ mealBreakdown, totalConsumed, isDark }) {
  const maxCal = Math.max(...mealBreakdown.map((m) => m.calories), 1);
  return (
    <View style={[s.slide, { width: SLIDE_WIDTH }]}>
      <View style={[s.card, isDark && s.cardDark, { flex: 1 }]}>
        <Text style={[s.mealBrkTitle, isDark && s.tw]}>Répartition par repas</Text>
        {mealBreakdown.map((m) => {
          const meta = MEAL_META[m.key];
          return (
            <View key={m.key} style={s.mealBrkRow}>
              <View style={s.mealBrkIconWrap}>
                <meta.Icon size={14} color={meta.color} />
              </View>
              <Text style={[s.mealBrkLabel, isDark && s.tl]}>{meta.label}</Text>
              <View style={s.mealBrkBarBg}>
                <View style={[s.mealBrkBarFill, { width: `${(m.calories / maxCal) * 100}%`, backgroundColor: meta.color }]} />
              </View>
              <Text style={[s.mealBrkCal, isDark && s.tl]}>{m.calories}</Text>
              <Text style={s.mealBrkPct}>{m.pct}%</Text>
            </View>
          );
        })}
        <View style={[s.mealBrkTotalRow, isDark && s.mealBrkTotalRowDark]}>
          <Text style={[s.mealBrkTotal, isDark && s.tl]}>
            Total consommé : <Text style={{ fontWeight: '700' }}>{totalConsumed} kcal</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────
   Carousel
   ──────────────────────────────────────────────── */

function NutritionCarousel({ data, isDark }) {
  const [active, setActive] = useState(0);
  const onScroll = useCallback((e) => {
    setActive(Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH));
  }, []);

  if (!data) return null;

  return (
    <View style={s.carousel}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH} decelerationRate="fast" onMomentumScrollEnd={onScroll}>
        <SlideCalories calories={data.calories} macros={data.macros} isDark={isDark} />
        <SlideMicros micros={data.micros} healthScore={data.healthScore} isDark={isDark} />
        <SlideMeals mealBreakdown={data.mealBreakdown} totalConsumed={data.calories.consumed} isDark={isDark} />
      </ScrollView>
      <View style={s.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.dot, i === active && s.dotActive, isDark && i !== active && s.dotDark]} />
        ))}
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────
   ScanHistory
   ──────────────────────────────────────────────── */

const QTY_PRESETS = [50, 100, 150, 200, 250, 300];

function scaleNutrition(base, grams) {
  const r = (grams || 0) / 100;
  return {
    calories: Math.round((base?.calories || 0) * r),
    proteins: Math.round((base?.proteins || 0) * r * 10) / 10,
    carbs: Math.round((base?.carbs || 0) * r * 10) / 10,
    fats: Math.round((base?.fats || 0) * r * 10) / 10,
    fiber: Math.round((base?.fiber || 0) * r * 10) / 10,
    sugar: Math.round((base?.sugar || 0) * r * 10) / 10,
    sodium: Math.round((base?.sodium || 0) * r * 10) / 10,
  };
}

function QuickLogModal({ visible, onClose, item, itemType, isDark, onLogged }) {
  const [mealType, setMealType] = useState('lunch');
  const [qty, setQty] = useState('100');
  const [saving, setSaving] = useState(false);

  const isPlat = itemType === 'plats';
  const defaultG = isPlat ? String(item?.portionG || 100) : '100';

  useEffect(() => {
    if (visible && item) {
      setQty(defaultG);
      setMealType('lunch');
    }
  }, [visible, item]);

  if (!item) return null;

  const baseNutrition = isPlat ? item.nutrition : item.nutritionPer100g;
  const computed = scaleNutrition(baseNutrition, Number(qty) || 0);

  const handleSubmit = async () => {
    const q = Number(qty);
    if (!q || q <= 0) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const res = await addFoodLog({
      name: item.name,
      mealType,
      date: today,
      nutrition: computed,
    });
    setSaving(false);
    if (res.success) {
      Alert.alert('Ajouté', `${item.name} ajouté au ${MEAL_LABELS[mealType]}`);
      onLogged();
      onClose();
    } else if (res.errorData?.error === 'free_limit_reached') {
      Alert.alert('Limite atteinte', res.errorData.message || 'Limite gratuite atteinte');
    } else {
      Alert.alert('Erreur', res.error || "Erreur lors de l'ajout");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[s.quickModal, isDark && s.cardDark]} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={s.quickModalHeader}>
            <Text style={[s.quickModalTitle, isDark && s.tw]} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon size={20} color={isDark ? '#7a7a88' : '#a8a29e'} />
            </TouchableOpacity>
          </View>
          {item.brand ? <Text style={s.quickModalBrand}>{item.brand}</Text> : null}

          {/* Meal type */}
          <Text style={[s.quickLabel, isDark && s.tl]}>Repas</Text>
          <View style={s.quickMealRow}>
            {MEAL_ORDER.map((t) => {
              const active = t === mealType;
              const { Icon, color } = MEAL_ICONS[t];
              return (
                <TouchableOpacity key={t} style={[s.quickMealBtn, active && s.quickMealBtnActive]}
                  onPress={() => setMealType(t)}>
                  <Icon size={16} color={active ? '#fff' : color} />
                  <Text style={[s.quickMealText, active && s.quickMealTextActive]}>
                    {MEAL_LABELS[t].split('-')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quantity */}
          <Text style={[s.quickLabel, isDark && s.tl]}>Quantité (grammes)</Text>
          <View style={s.quickQtyRow}>
            <TextInput style={[s.quickQtyInput, isDark && s.burnedModalInputDark]}
              value={qty} onChangeText={setQty}
              keyboardType="numeric" placeholder="100" placeholderTextColor="#999" />
            <Text style={s.quickQtyUnit}>g</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickPresetsScroll}>
            <View style={s.quickPresets}>
              {QTY_PRESETS.map((v) => (
                <TouchableOpacity key={v} onPress={() => setQty(String(v))}
                  style={[s.quickPresetBtn, String(v) === qty && s.quickPresetBtnActive]}>
                  <Text style={[s.quickPresetText, String(v) === qty && s.quickPresetTextActive]}>
                    {v}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Computed nutrition preview */}
          <View style={[s.quickNutritionRow, isDark && { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
            <Text style={[s.quickNutritionValue, isDark && s.tw]}>{computed.calories} kcal</Text>
            <Text style={s.quickNutritionMacros}>
              P: {computed.proteins}g · G: {computed.carbs}g · L: {computed.fats}g
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity style={[s.quickSubmitBtn, saving && { opacity: 0.6 }]}
            onPress={handleSubmit} disabled={saving}>
            <PlusIcon size={18} color="#fff" />
            <Text style={s.quickSubmitText}>{saving ? 'Ajout...' : 'Ajouter'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ScanHistory({ isDark, onLogged }) {
  const [tab, setTab] = useState('plats');
  const [plats, setPlats] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickItem, setQuickItem] = useState(null);
  const [quickType, setQuickType] = useState('plats');

  const fetchScans = useCallback(async () => {
    setLoading(true);
    const [p, i] = await Promise.all([getScansPlats(), getScansIngredients()]);
    if (p.success) setPlats(p.data);
    if (i.success) setIngredients(i.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDelete = async (type, id) => {
    const res = await deleteScan(type, id);
    if (res.success) {
      if (type === 'plats') setPlats((prev) => prev.filter((p) => p._id !== id));
      else setIngredients((prev) => prev.filter((p) => p._id !== id));
    }
  };

  const items = tab === 'plats' ? plats : ingredients;

  return (
    <View style={[s.card, isDark && s.cardDark, { marginBottom: 12 }]}>
      <View style={s.scanHeader}>
        <Text style={[s.sectionTitle, isDark && s.tw]}>Mes Scans</Text>
        <View style={s.scanTabs}>
          <TouchableOpacity style={[s.scanTab, tab === 'plats' && s.scanTabActive]} onPress={() => setTab('plats')}>
            <Text style={[s.scanTabText, tab === 'plats' && s.scanTabTextActive]}>Plats ({plats.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.scanTab, tab === 'ingredients' && s.scanTabActive]} onPress={() => setTab('ingredients')}>
            <Text style={[s.scanTabText, tab === 'ingredients' && s.scanTabTextActive]}>Ingrédients ({ingredients.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#72baa1" style={{ marginVertical: 20 }} />
      ) : items.length === 0 ? (
        <View style={s.scanEmpty}>
          {tab === 'plats' ? <CameraIcon size={28} color="#a8a29e" /> : <SearchIcon size={28} color="#a8a29e" />}
          <Text style={s.scanEmptyText}>
            Aucun {tab === 'plats' ? 'plat scanné' : 'ingrédient scanné'}
          </Text>
          <Text style={s.scanEmptyHint}>
            {tab === 'plats'
              ? 'Prends en photo un plat via le chat IA ou le scanner'
              : 'Scanne un code-barres pour ajouter un ingrédient'}
          </Text>
        </View>
      ) : (
        items.map((item) => {
          const n = tab === 'plats' ? item.nutrition : item.nutritionPer100g;
          return (
            <View key={item._id} style={[s.scanItem, isDark && s.scanItemDark]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={s.scanItemImg} />
              ) : (
                <View style={[s.scanItemInitial, isDark && s.scanItemInitialDark]}>
                  <Text style={s.scanItemInitialText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={s.scanItemInfo}>
                <Text style={[s.scanItemName, isDark && s.tw]} numberOfLines={1}>{item.name}</Text>
                {item.brand && <Text style={s.scanItemBrand} numberOfLines={1}>{item.brand}</Text>}
                <Text style={s.scanItemMacros}>
                  {n?.calories || 0}kcal · {n?.proteins || 0}g P · {n?.carbs || 0}g G · {n?.fats || 0}g L
                </Text>
              </View>
              <View style={s.scanItemActions}>
                <TouchableOpacity style={s.scanItemUseBtn}
                  onPress={() => { setQuickItem(item); setQuickType(tab); }}>
                  <PlusIcon size={16} color="#72baa1" />
                </TouchableOpacity>
                <TouchableOpacity style={s.scanItemDelBtn} onPress={() => handleDelete(tab, item._id)}>
                  <CloseIcon size={14} color="#a8a29e" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <QuickLogModal
        visible={!!quickItem}
        onClose={() => setQuickItem(null)}
        item={quickItem}
        itemType={quickType}
        isDark={isDark}
        onLogged={onLogged}
      />
    </View>
  );
}

/* ────────────────────────────────────────────────
   WeeklyNutritionChart
   ──────────────────────────────────────────────── */

function WeeklyChart({ data, isPremium, isDark, navigation }) {
  if (!isPremium) {
    return (
      <View style={[s.card, isDark && s.cardDark, { alignItems: 'center', paddingVertical: 24 }]}>
        <BarChartIcon size={32} color="#a8a29e" />
        <Text style={[s.premiumTitle, isDark && s.tw]}>Graphique hebdomadaire</Text>
        <Text style={s.premiumDesc}>Visualisez votre consommation sur 7 jours avec des graphiques détaillés</Text>
        <TouchableOpacity style={s.premiumBtn} onPress={() => navigation.navigate('Pricing')}>
          <Text style={s.premiumBtnText}>Débloquer avec Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.days?.length) return null;

  const max = Math.max(...data.days.map((d) => Math.max(d.consumed, d.burned)), 1);
  const chartH = 120;
  const chartW = data.days.length * 50;

  return (
    <View style={[s.card, isDark && s.cardDark, { marginBottom: 12 }]}>
      <Text style={[s.sectionTitle, isDark && s.tw]}>Résumé hebdomadaire</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartW} height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`}>
          {data.days.map((day, i) => {
            const x = i * 50 + 10;
            const cH = (day.consumed / max) * chartH;
            const bH = (day.burned / max) * chartH;
            const dayIdx = new Date(day.date).getDay();
            const label = DAYS_LABELS[dayIdx === 0 ? 6 : dayIdx - 1];
            return (
              <G key={i}>
                <Rect x={x} y={chartH - cH} width={14} height={cH} rx={4} fill="#72baa1" opacity={0.85} />
                <Rect x={x + 16} y={chartH - bH} width={14} height={bH} rx={4} fill="#f0a47a" opacity={0.85} />
              </G>
            );
          })}
        </Svg>
      </ScrollView>
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#72baa1' }]} />
          <Text style={[s.legendText, isDark && s.tl]}>Consommé</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#f0a47a' }]} />
          <Text style={[s.legendText, isDark && s.tl]}>Brûlé</Text>
        </View>
      </View>
      {data.averages && (
        <View style={s.avgRow}>
          <Text style={[s.avgText, isDark && s.tl]}>Moy. calories: <Text style={{ fontWeight: '700' }}>{data.averages.calories}</Text></Text>
          <Text style={[s.avgText, isDark && s.tl]}>Moy. protéines: <Text style={{ fontWeight: '700' }}>{data.averages.proteins}g</Text></Text>
        </View>
      )}
    </View>
  );
}

/* ────────────────────────────────────────────────
   Main Screen
   ──────────────────────────────────────────────── */

export default function NutritionScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [carouselData, setCarouselData] = useState(null);
  const [weekBarData, setWeekBarData] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [burnedModalVisible, setBurnedModalVisible] = useState(false);
  const [burnedDraft, setBurnedDraft] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [summaryRes, carouselRes, weekBarRes, weeklyRes] = await Promise.all([
        getDailySummary(selectedDate),
        getCarouselData(selectedDate),
        getWeekBarData(today),
        getWeeklySummary(),
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (carouselRes.success) setCarouselData(carouselRes.data);
      if (weekBarRes.success) setWeekBarData(weekBarRes.data);
      if (weeklyRes.success) {
        setWeeklySummary(weeklyRes.data);
        setIsPremium(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(useCallback(() => { setLoading(true); fetchAll(); }, [fetchAll]));

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, [fetchAll]);

  const handleBurnedSave = async () => {
    const num = Number(burnedDraft);
    setBurnedModalVisible(false);
    if (isNaN(num) || num < 0) return;
    await syncBurnedCalories(selectedDate, num);
    fetchAll();
  };

  const handleDelete = (id) => {
    Alert.alert('Supprimer', 'Supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteFoodLog(id); fetchAll(); } },
    ]);
  };

  const entries = summary?.entries || [];

  return (
    <SafeAreaView style={[s.container, isDark && s.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#f3f3f6' : '#1c1917'} />
        </TouchableOpacity>
        <Text style={[s.title, isDark && s.tw]}>Nutrition</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NutritionGoals')} style={s.headerBtn}>
          <Ionicons name="settings-outline" size={20} color={isDark ? '#f3f3f6' : '#78716c'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#72baa1" />}>

        <WeekBar selectedDate={selectedDate} onChange={setSelectedDate} weeks={weekBarData?.weeks} isDark={isDark} />

        {loading ? (
          <ActivityIndicator size="large" color="#72baa1" style={{ marginTop: 40 }} />
        ) : (
          <>
            <NutritionCarousel data={carouselData} isDark={isDark} />

            {/* Scan History */}
            <ScanHistory isDark={isDark} onLogged={fetchAll} />

            {/* Section title */}
            <Text style={[s.sectionTitle, isDark && s.tw, { marginBottom: 8 }]}>Mes repas</Text>

            {/* Meal Groups */}
            {MEAL_ORDER.map((type) => {
              const items = entries.filter((e) => e.mealType === type);
              const total = items.reduce((sum, e) => sum + (e.nutrition?.calories || 0), 0);
              const { Icon, color } = MEAL_ICONS[type];

              return (
                <View key={type} style={[s.mealCard, isDark && s.cardDark]}>
                  <View style={s.mealHeader}>
                    <View style={s.mealTitleRow}>
                      <Icon size={18} color={color} />
                      <Text style={[s.mealTitle, isDark && s.tw]}>{MEAL_LABELS[type]}</Text>
                      {total > 0 && <Text style={s.mealCal}>{total} kcal</Text>}
                    </View>
                    <TouchableOpacity style={[s.addBtn, isDark && s.addBtnDark]}
                      onPress={() => navigation.navigate('ManualFoodEntry', { mealType: type, date: selectedDate })}>
                      <PlusIcon size={16} color="#72baa1" />
                    </TouchableOpacity>
                  </View>

                  {items.map((item) => (
                    <TouchableOpacity key={item._id} activeOpacity={0.6}
                      style={[s.foodItem, isDark && s.foodItemDark]}
                      onPress={() => navigation.navigate('ManualFoodEntry', { entry: item, date: selectedDate })}
                      onLongPress={() => handleDelete(item._id)}>
                      <View style={s.foodItemMain}>
                        <View style={{ flex: 1 }}>
                          <View style={s.foodNameRow}>
                            <Text style={[s.foodName, isDark && s.tl]} numberOfLines={1}>{item.name}</Text>
                            {item.source === 'recipe' && (
                              <View style={s.recipeBadge}><Text style={s.recipeBadgeText}>Recette</Text></View>
                            )}
                          </View>
                          <Text style={s.foodMacros}>
                            P: {item.nutrition?.proteins || 0}g · G: {item.nutrition?.carbs || 0}g · L: {item.nutrition?.fats || 0}g
                          </Text>
                        </View>
                        <Text style={[s.foodCal, isDark && s.tl]}>{item.nutrition?.calories || 0} kcal</Text>
                        <Ionicons name="chevron-forward" size={14} color={isDark ? '#444' : '#d6d3d1'} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}

            {/* Weekly Chart */}
            <WeeklyChart data={weeklySummary} isPremium={isPremium} isDark={isDark} navigation={navigation} />

            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.8}
        onPress={() => navigation.navigate('ManualFoodEntry', { date: selectedDate })}>
        <PlusIcon size={26} color="#FFF" />
      </TouchableOpacity>

      {/* Burned Calories Modal */}
      <Modal visible={burnedModalVisible} transparent animationType="fade" onRequestClose={() => setBurnedModalVisible(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setBurnedModalVisible(false)}>
          <View style={[s.burnedModal, isDark && s.cardDark]} onStartShouldSetResponder={() => true}>
            <Text style={[s.burnedModalTitle, isDark && s.tw]}>Calories brûlées</Text>
            <TextInput
              style={[s.burnedModalInput, isDark && s.burnedModalInputDark]}
              value={burnedDraft}
              onChangeText={setBurnedDraft}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
              placeholderTextColor="#999"
            />
            <View style={s.burnedModalActions}>
              <TouchableOpacity style={s.burnedCancelBtn} onPress={() => setBurnedModalVisible(false)}>
                <Text style={s.burnedCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.burnedSaveBtn} onPress={handleBurnedSave}>
                <Text style={s.burnedSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────── */

const s = StyleSheet.create({
  /* Layout */
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  containerDark: { backgroundColor: '#0e0e11' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#1c1917', letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, paddingBottom: 180 },

  /* Text helpers */
  tw: { color: '#f3f3f6' },
  tl: { color: '#c1c1cb' },

  /* WeekBar */
  weekBar: { marginBottom: 16, flexGrow: 0 },
  weekBarContent: { paddingRight: 8 },
  weekGroup: { flexDirection: 'row', gap: 2 },
  weekDayCol: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 5, borderRadius: 14, width: 50 },
  weekDayColSel: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  weekDayColSelDark: { backgroundColor: '#1f1f26' },
  weekDayLabel: { fontSize: 11, fontWeight: '500', color: '#78716c', marginBottom: 4, textTransform: 'capitalize' },
  weekDayLabelBold: { fontWeight: '700', color: '#1c1917' },
  weekDayLabelDark: { color: '#7a7a88' },
  weekDayRingWrap: { alignItems: 'center', justifyContent: 'center' },
  weekDayNum: { position: 'absolute', fontSize: 14, fontWeight: '700', color: '#1c1917' },
  weekDayNumMuted: { color: '#d6d3d1' },
  weekDayNumDark: { color: '#f3f3f6' },

  /* Card */
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#efedea' },
  cardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },

  /* Carousel */
  carousel: { marginBottom: 16 },
  slide: { gap: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d6d3d1' },
  dotActive: { backgroundColor: '#1c1917', width: 8, height: 8 },
  dotDark: { backgroundColor: '#444' },

  /* Calorie card */
  calorieBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calorieLeft: { flex: 1 },
  calorieValue: { fontSize: 32, fontWeight: '800', color: '#1c1917', letterSpacing: -1 },
  calorieLabel: { fontSize: 12, color: '#78716c', fontWeight: '500', marginTop: 2 },
  calorieRingWrap: { alignItems: 'center', justifyContent: 'center' },
  calorieRingIconWrap: { position: 'absolute' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#efedea' },
  metaRowDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  metaItem: { alignItems: 'center' },
  metaLabel: { fontSize: 10, color: '#a8a29e', fontWeight: '500', marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  metaSep: { width: 1, height: 24, backgroundColor: '#efedea' },
  metaSepDark: { backgroundColor: 'rgba(255,255,255,0.08)' },

  /* Tri cards */
  triCards: { flexDirection: 'row', gap: 8 },
  triCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#efedea' },
  triCardValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  triCardLabel: { fontSize: 10, color: '#a8a29e', fontWeight: '500', marginBottom: 6 },
  miniRingWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  miniRingIconWrap: { position: 'absolute' },

  /* Score */
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreTitle: { fontSize: 16, fontWeight: '800', color: '#1c1917' },
  scoreValue: { fontSize: 16, fontWeight: '800', color: '#1c1917' },
  scoreBarBg: { height: 6, backgroundColor: '#efedea', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  scoreBarBgDark: { backgroundColor: '#2a2a33' },
  scoreBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#72baa1' },
  scoreDesc: { fontSize: 12, color: '#a8a29e', lineHeight: 18 },

  /* Meal breakdown (slide 3) */
  mealBrkTitle: { fontSize: 16, fontWeight: '800', color: '#1c1917', marginBottom: 14 },
  mealBrkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  mealBrkIconWrap: { width: 20, alignItems: 'center' },
  mealBrkLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', width: 72 },
  mealBrkBarBg: { flex: 1, height: 8, backgroundColor: '#f5f5f4', borderRadius: 4, overflow: 'hidden' },
  mealBrkBarFill: { height: '100%', borderRadius: 4 },
  mealBrkCal: { fontSize: 12, fontWeight: '700', color: '#1c1917', width: 36, textAlign: 'right' },
  mealBrkPct: { fontSize: 10, color: '#a8a29e', fontWeight: '500', width: 28, textAlign: 'right' },
  mealBrkTotalRow: { borderTopWidth: 1, borderTopColor: '#efedea', marginTop: 8, paddingTop: 10 },
  mealBrkTotalRowDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  mealBrkTotal: { fontSize: 13, color: '#57534e', textAlign: 'center' },

  /* Section */
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1c1917' },

  /* Meal list */
  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#efedea' },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917' },
  mealCal: { fontSize: 11, color: '#a8a29e', marginLeft: 4 },
  addBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: '#efedea', alignItems: 'center', justifyContent: 'center' },
  addBtnDark: { borderColor: '#2a2a33' },
  foodItem: { paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f5f5f4', minHeight: 52 },
  foodItemDark: { borderTopColor: 'rgba(255,255,255,0.04)' },
  foodItemMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  foodName: { fontSize: 14, color: '#1c1917', flexShrink: 1 },
  foodMacros: { fontSize: 11, color: '#a8a29e' },
  recipeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recipeBadgeText: { fontSize: 10, color: '#3B82F6', fontWeight: '500' },
  foodCal: { fontSize: 14, fontWeight: '600', color: '#57534e', marginRight: 4 },

  /* Scan History */
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scanTabs: { flexDirection: 'row', gap: 4 },
  scanTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f5f5f4' },
  scanTabActive: { backgroundColor: '#72baa1' },
  scanTabText: { fontSize: 11, fontWeight: '600', color: '#78716c' },
  scanTabTextActive: { color: '#fff' },
  scanEmpty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  scanEmptyText: { fontSize: 13, color: '#78716c', fontWeight: '500' },
  scanEmptyHint: { fontSize: 11, color: '#a8a29e', textAlign: 'center', paddingHorizontal: 20 },
  scanItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#f5f5f4' },
  scanItemDark: { borderTopColor: 'rgba(255,255,255,0.04)' },
  scanItemImg: { width: 40, height: 40, borderRadius: 8 },
  scanItemInitial: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  scanItemInitialDark: { backgroundColor: '#1f1f26' },
  scanItemInitialText: { fontSize: 16, fontWeight: '700', color: '#a8a29e' },
  scanItemInfo: { flex: 1 },
  scanItemName: { fontSize: 13, fontWeight: '600', color: '#1c1917' },
  scanItemBrand: { fontSize: 11, color: '#a8a29e' },
  scanItemMacros: { fontSize: 10, color: '#a8a29e', marginTop: 2 },
  scanItemActions: { flexDirection: 'row', gap: 6 },
  scanItemUseBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#efedea', alignItems: 'center', justifyContent: 'center' },
  scanItemDelBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  /* Weekly chart */
  premiumTitle: { fontSize: 16, fontWeight: '800', color: '#1c1917', marginTop: 10, marginBottom: 6 },
  premiumDesc: { fontSize: 12, color: '#a8a29e', textAlign: 'center', marginBottom: 14, paddingHorizontal: 20 },
  premiumBtn: { backgroundColor: '#72baa1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  premiumBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#57534e' },
  avgRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#efedea' },
  avgText: { fontSize: 12, color: '#57534e' },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#72baa1', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },

  /* Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  burnedModal: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 320 },
  burnedModalTitle: { fontSize: 17, fontWeight: '700', color: '#1c1917', marginBottom: 16, textAlign: 'center' },
  burnedModalInput: { backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#efedea', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: '#1c1917', textAlign: 'center', marginBottom: 16 },
  burnedModalInputDark: { backgroundColor: '#1f1f26', color: '#f3f3f6', borderColor: '#2a2a33' },
  burnedModalActions: { flexDirection: 'row', gap: 10 },
  burnedCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f5f5f4', alignItems: 'center' },
  burnedCancelText: { fontSize: 14, fontWeight: '500', color: '#78716c' },
  burnedSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#72baa1', alignItems: 'center' },
  burnedSaveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  /* QuickLogModal */
  quickModal: { backgroundColor: '#fff', borderRadius: 24, padding: 20, width: '100%', maxWidth: 380 },
  quickModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  quickModalTitle: { fontSize: 17, fontWeight: '700', color: '#1c1917', flex: 1, marginRight: 8 },
  quickModalBrand: { fontSize: 12, color: '#a8a29e', marginBottom: 12 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', marginTop: 14, marginBottom: 8 },
  quickMealRow: { flexDirection: 'row', gap: 6 },
  quickMealBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#efedea' },
  quickMealBtnActive: { backgroundColor: '#72baa1', borderColor: '#72baa1' },
  quickMealText: { fontSize: 9, fontWeight: '600', color: '#78716c' },
  quickMealTextActive: { color: '#fff' },
  quickQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickQtyInput: { flex: 1, backgroundColor: '#f5f5f4', borderWidth: 1.5, borderColor: '#efedea', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, fontWeight: '600', color: '#1c1917', textAlign: 'center' },
  quickQtyUnit: { fontSize: 14, fontWeight: '600', color: '#a8a29e' },
  quickPresetsScroll: { marginTop: 8, flexGrow: 0 },
  quickPresets: { flexDirection: 'row', gap: 6 },
  quickPresetBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#efedea' },
  quickPresetBtnActive: { backgroundColor: '#72baa1', borderColor: '#72baa1' },
  quickPresetText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  quickPresetTextActive: { color: '#fff' },
  quickNutritionRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#efedea', alignItems: 'center', gap: 2 },
  quickNutritionValue: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  quickNutritionMacros: { fontSize: 12, color: '#a8a29e' },
  quickSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, backgroundColor: '#72baa1', borderRadius: 14, paddingVertical: 14 },
  quickSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
