import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../theme';
import { getSessions as getWorkoutSessions, deleteSession as deleteWorkoutSession } from '../../api/workouts';

/**
 * HistoryScreen - Historique complet des seances
 */
export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Charger l'historique
  const loadHistory = useCallback(async () => {
    try {
      // 1. Essayer de charger depuis le backend (source prioritaire)
      let backendSessions = [];
      try {
        const result = await getWorkoutSessions({ limit: 50 });
        if (result.success && result.data.length > 0) {
          backendSessions = result.data.map(s => ({
            id: s.id,
            name: s.name || (s.exercises?.length > 0
              ? s.exercises.map(e => e.exercice?.name).filter(Boolean).slice(0, 2).join(', ')
              : 'Seance'),
            date: s.startTime,
            endedAt: s.endTime,
            durationMinutes: s.duration || 0,
            caloriesBurned: s.calories || 0,
            entries: s.exercises?.map(e => ({
              name: e.exercice?.name,
              type: e.exercice?.type || 'muscu',
              sets: e.sets || [],
            })) || [],
            source: 'backend',
          }));
        }
      } catch (apiError) {
        console.log('[HISTORY] Backend API error:', apiError.message);
      }

      // 2. Charger les séances locales (backup/non-sync)
      let localSessions = [];
      try {
        const localHistory = await AsyncStorage.getItem('@workout_history');
        const localData = localHistory ? JSON.parse(localHistory) : [];

        // Ne garder que les séances non synchronisées
        localSessions = localData
          .filter(s => !s.backendId && s.synced !== true)
          .map(s => ({
            id: s.id,
            name: s.exercises?.length > 0
              ? s.exercises.map(e => e.exercice?.name).filter(Boolean).slice(0, 2).join(', ') || 'Seance'
              : 'Seance',
            date: s.startTime,
            endedAt: s.endTime,
            durationMinutes: s.duration || 0,
            caloriesBurned: 0,
            entries: s.exercises?.map(e => ({
              name: e.exercice?.name,
              type: e.exercice?.type || 'muscu',
              sets: e.sets || [],
            })) || [],
            source: 'local',
            synced: false,
          }));
      } catch (localError) {
        console.log('[HISTORY] Local storage error:', localError.message);
      }

      // 3. Combiner: backend d'abord, puis local non-sync
      // Deduplication par ID
      const seenIds = new Set(backendSessions.map(s => s.id));
      const uniqueLocalSessions = localSessions.filter(s => !seenIds.has(s.id));

      const allSessions = [...backendSessions, ...uniqueLocalSessions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setSessions(allSessions);
    } catch (error) {
      console.error('[HISTORY] Error loading:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  // Supprimer une seance
  const handleDelete = useCallback((sessionId, source) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette seance de l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (source === 'local') {
                // Supprimer de AsyncStorage
                const localHistory = await AsyncStorage.getItem('@workout_history');
                if (localHistory) {
                  const sessions = JSON.parse(localHistory);
                  const updated = sessions.filter(s => s.id !== sessionId);
                  await AsyncStorage.setItem('@workout_history', JSON.stringify(updated));
                }
              } else if (source === 'backend') {
                // Supprimer via API backend
                const result = await deleteWorkoutSession(sessionId);
                if (!result.success) {
                  console.log('[HISTORY] Delete backend error:', result.error);
                  // Continuer quand meme pour retirer de l'UI
                }
              }
              setSessions(prev => prev.filter(s => s.id !== sessionId));
            } catch (error) {
              console.error('[HISTORY] Delete error:', error);
            }
          },
        },
      ]
    );
  }, []);

  // Formater la date
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  // Formater l'heure
  const formatTime = useCallback((dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Obtenir le type d'exercice
  const getEntryType = useCallback((entry) => {
    if (entry?.type) return entry.type;
    if (entry?.mode) return entry.mode;
    const data = entry?.data || {};
    if (data.cardioSets?.length) return 'cardio';
    if (data.sets?.length) {
      const hasWeight = data.sets.some(s => s.weightKg || s.weight);
      return hasWeight ? 'muscu' : 'poids_du_corps';
    }
    return 'muscu';
  }, []);

  // Obtenir les sets d'un exercice
  const getEntrySets = useCallback((entry) => {
    const data = entry?.data || {};
    if (data.cardioSets?.length) return data.cardioSets;
    if (data.sets?.length) return data.sets;
    if (entry?.sets?.length) return entry.sets;
    return [];
  }, []);

  const renderSession = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const entries = item.entries || [];

    return (
      <View style={[styles.sessionCard, isDark && styles.sessionCardDark]}>
        {/* Header */}
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionInfo}>
            <View style={styles.sessionDateRow}>
              <View style={[styles.dateBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                <Text style={[styles.dateText, { color: theme.colors.primary }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                {formatTime(item.date)}
              </Text>
            </View>
            <Text style={[styles.sessionName, isDark && styles.sessionNameDark]}>
              {item.name}
            </Text>
            <View style={styles.sessionMeta}>
              {item.durationMinutes > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
                    {item.durationMinutes} min
                  </Text>
                </View>
              )}
              {entries.length > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={14} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
                    {entries.length} exercice{entries.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {item.caloriesBurned > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={14} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
                    {item.caloriesBurned} kcal
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.sessionActions}>
            {entries.length > 0 && (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isDark ? '#666' : '#CCC'}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && entries.length > 0 && (
          <View style={[styles.exercisesList, isDark && styles.exercisesListDark]}>
            {entries.map((entry, index) => {
              const sets = getEntrySets(entry);
              const type = getEntryType(entry);
              const name = entry?.name || entry?.exerciseName || entry?.exoName || `Exercice ${index + 1}`;
              const totalReps = sets.reduce((sum, s) => sum + (s.reps || s.rep || 0), 0);
              const maxWeight = Math.max(...sets.map(s => s.weightKg || s.weight || 0), 0);

              return (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseEmoji}>
                      {type === 'cardio' ? '🏃' : type === 'poids_du_corps' ? '🤸' : '🏋️'}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, isDark && styles.exerciseNameDark]} numberOfLines={1}>
                      {name}
                    </Text>
                    <View style={styles.exerciseStats}>
                      <Text style={[styles.exerciseStat, isDark && styles.exerciseStatDark]}>
                        {sets.length} set{sets.length > 1 ? 's' : ''}
                      </Text>
                      {totalReps > 0 && (
                        <Text style={[styles.exerciseStat, isDark && styles.exerciseStatDark]}>
                          {totalReps} reps
                        </Text>
                      )}
                      {maxWeight > 0 && (
                        <Text style={[styles.exerciseStat, isDark && styles.exerciseStatDark]}>
                          {maxWeight} kg max
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.source)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="barbell-outline" size={48} color={isDark ? '#555' : '#CCC'} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        Aucune seance
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        Commence une seance pour voir ton historique ici
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('ExercicesTab')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          Historique
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.sessionCount, isDark && styles.sessionCountDark]}>
            {sessions.length} seance{sessions.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSession}
        contentContainerStyle={[
          styles.listContent,
          sessions.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  sessionCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sessionCountDark: {
    color: '#888',
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionCardDark: {
    backgroundColor: '#2A2A2A',
  },
  sessionHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  timeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  timeTextDark: {
    color: '#666',
  },
  sessionName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sessionNameDark: {
    color: '#FFFFFF',
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metaTextDark: {
    color: '#888',
  },
  sessionActions: {
    justifyContent: 'center',
    paddingLeft: theme.spacing.sm,
  },
  deleteButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  exercisesList: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  exercisesListDark: {
    borderTopColor: '#333',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseEmoji: {
    fontSize: 18,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  exerciseNameDark: {
    color: '#FFFFFF',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  exerciseStat: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  exerciseStatDark: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyIconDark: {
    backgroundColor: '#2A2A2A',
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTextDark: {
    color: '#888',
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
