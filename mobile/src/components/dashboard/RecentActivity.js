import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * RecentActivity - Liste des séances récentes
 * Affiche les 5 dernières séances avec détails expandables
 */
export const RecentActivity = ({
  recentSessions = [],
  formatDate,
  extractSessionCalories,
  onStartEdit,
  onSaveSessionName,
  onDeleteSession,
  isFreeUser = false,
  totalSessions = 0,
  navigation,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = theme.colors.primary;

  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const hiddenSessions = totalSessions - recentSessions.length;

  const toggleExpand = useCallback((sessionId) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  }, []);

  const handleStartEdit = useCallback((session) => {
    const sessionId = session.id || session._id;
    setEditingSessionId(sessionId);
    setEditingName(session.name || 'Séance');
  }, []);

  const handleSaveEdit = useCallback(
    (sessionId) => {
      if (onSaveSessionName) {
        onSaveSessionName(sessionId, editingName);
      }
      setEditingSessionId(null);
      setEditingName('');
    },
    [editingName, onSaveSessionName]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingSessionId(null);
    setEditingName('');
  }, []);

  const handleDelete = useCallback(
    (sessionId) => {
      Alert.alert('Supprimer', 'Supprimer cette séance ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteSession?.(sessionId),
        },
      ]);
    },
    [onDeleteSession]
  );

  const formatSetInfo = useCallback((set) => {
    const parts = [];
    if (set.reps || set.rep || set.repetitions) {
      parts.push(`${set.reps || set.rep || set.repetitions} reps`);
    }
    if (set.weightKg || set.weight || set.kg) {
      parts.push(`${set.weightKg || set.weight || set.kg} kg`);
    }
    if (set.durationMin || set.minutes) {
      parts.push(`${set.durationMin || set.minutes} min`);
    }
    if (set.distanceKm || set.km) {
      parts.push(`${set.distanceKm || set.km} km`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Complété';
  }, []);

  const getEntryType = useCallback((entry) => {
    if (entry?.type) return entry.type;
    if (entry?.mode) return entry.mode;
    const data = entry?.data || {};
    if (data.cardioSets?.length) return 'cardio';
    if (data.sets?.length) {
      const hasWeight = data.sets.some((s) => s.weightKg || s.weight);
      return hasWeight ? 'muscu' : 'poids_du_corps';
    }
    return 'muscu';
  }, []);

  const getEntrySets = useCallback((entry) => {
    const data = entry?.data || {};
    if (data.cardioSets?.length) return data.cardioSets;
    if (data.sets?.length) return data.sets;
    if (entry?.sets?.length) return entry.sets;
    return [];
  }, []);

  const defaultFormatDate = useCallback((raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    if (isNaN(date)) return '';
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('fr-FR', options);
  }, []);

  const dateFormatter = formatDate || defaultFormatDate;

  if (recentSessions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Activité récente
      </Text>

      <View style={styles.sessionsList}>
        {recentSessions.map((session, index) => {
          const sessionId = session.id || session._id || index;
          const isExpanded = expandedSessionId === sessionId;
          const isEditing = editingSessionId === sessionId;
          const entries = session?.entries || session?.items || session?.exercises || [];
          const calories = extractSessionCalories?.(session) || 0;

          return (
            <View
              key={sessionId}
              style={[
                styles.sessionItem,
                isDark && styles.sessionItemDark,
                isExpanded && styles.sessionItemExpanded,
              ]}
            >
              {/* Header */}
              <TouchableOpacity
                style={styles.sessionHeader}
                onPress={() => entries.length > 0 && toggleExpand(sessionId)}
                activeOpacity={entries.length > 0 ? 0.7 : 1}
              >
                {/* Date */}
                <View style={styles.sessionDate}>
                  <Text style={[styles.sessionDateText, isDark && styles.sessionDateTextDark]}>
                    {dateFormatter(session?.endedAt || session?.date || session?.createdAt)}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.sessionDetails}>
                  {isEditing ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={[styles.sessionNameInput, isDark && styles.sessionNameInputDark]}
                        value={editingName}
                        onChangeText={setEditingName}
                        autoFocus
                        onSubmitEditing={() => handleSaveEdit(sessionId)}
                        returnKeyType="done"
                      />
                      <TouchableOpacity onPress={() => handleSaveEdit(sessionId)}>
                        <Ionicons name="checkmark" size={20} color="#22C55E" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit}>
                        <Ionicons name="close" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleStartEdit(session)}>
                      <Text style={[styles.sessionName, isDark && styles.sessionNameDark]}>
                        {session?.name || 'Séance'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.sessionMeta, isDark && styles.sessionMetaDark]}>
                    {session?.durationMinutes ? `${session.durationMinutes} min` : ''}
                    {entries.length ? ` • ${entries.length} exo` : ''}
                    {calories > 0 ? ` • ${calories} kcal` : ''}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.sessionActions}>
                  {entries.length > 0 && (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isDark ? '#666' : theme.colors.text.tertiary}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(sessionId)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Expanded details */}
              {isExpanded && entries.length > 0 && (
                <View style={styles.sessionExpanded}>
                  {entries.map((entry, entryIndex) => {
                    const sets = getEntrySets(entry);
                    const entryType = getEntryType(entry);
                    const entryName =
                      entry?.name ||
                      entry?.exerciseName ||
                      entry?.exoName ||
                      `Exercice ${entryIndex + 1}`;

                    const totalReps = sets.reduce(
                      (sum, s) => sum + (s.reps || s.rep || s.repetitions || 0),
                      0
                    );
                    const maxWeight = Math.max(
                      ...sets.map((s) => s.weightKg || s.weight || s.kg || 0),
                      0
                    );

                    return (
                      <View key={entryIndex} style={styles.exerciseDetail}>
                        <View style={styles.exerciseHeader}>
                          <Text
                            style={[styles.exerciseName, isDark && styles.exerciseNameDark]}
                            numberOfLines={1}
                          >
                            {entryName}
                          </Text>
                          <Text style={styles.exerciseType}>
                            {entryType === 'cardio' ? '🏃' : entryType === 'poids_du_corps' ? '🤸' : '🏋️'}
                          </Text>
                        </View>
                        <View style={styles.exerciseSummary}>
                          <View style={styles.summaryBadge}>
                            <Text style={styles.summaryBadgeText}>
                              {sets.length} set{sets.length > 1 ? 's' : ''}
                            </Text>
                          </View>
                          {totalReps > 0 && (
                            <View style={styles.summaryBadge}>
                              <Text style={styles.summaryBadgeText}>{totalReps} reps</Text>
                            </View>
                          )}
                          {maxWeight > 0 && (
                            <View style={styles.summaryBadge}>
                              <Text style={styles.summaryBadgeText}>{maxWeight} kg</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Premium upsell */}
      {isFreeUser && hiddenSessions > 0 && (
        <TouchableOpacity
          style={[styles.upsellContainer, isDark && styles.upsellContainerDark]}
          onPress={() => navigation?.navigate('Subscription')}
          activeOpacity={0.7}
        >
          <Text style={[styles.upsellText, isDark && styles.upsellTextDark]}>
            📊 {hiddenSessions} séance{hiddenSessions > 1 ? 's' : ''} de plus dans ton historique
          </Text>
          <Text style={styles.upsellLink}>Voir tout avec Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  containerDark: {},
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  sessionsList: {
    gap: theme.spacing.sm,
  },
  sessionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionItemDark: {
    backgroundColor: '#2A2A2A',
  },
  sessionItemExpanded: {
    borderWidth: 1,
    borderColor: `${theme.colors.primary}4D`,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sessionDate: {
    backgroundColor: `${theme.colors.primary}1A`,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  sessionDateText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  sessionDateTextDark: {
    color: theme.colors.primary,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  sessionNameDark: {
    color: '#FFFFFF',
  },
  sessionMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  sessionMetaDark: {
    color: '#777777',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sessionNameInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    paddingVertical: 2,
  },
  sessionNameInputDark: {
    color: '#FFFFFF',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sessionExpanded: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  exerciseDetail: {
    paddingVertical: theme.spacing.xs,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  exerciseName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  exerciseNameDark: {
    color: '#FFFFFF',
  },
  exerciseType: {
    fontSize: theme.fontSize.sm,
  },
  exerciseSummary: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: 4,
  },
  summaryBadge: {
    backgroundColor: `${theme.colors.primary}1A`,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  summaryBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  upsellContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}14`,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  upsellContainerDark: {
    backgroundColor: `${theme.colors.primary}26`,
  },
  upsellText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  upsellTextDark: {
    color: '#AAAAAA',
  },
  upsellLink: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    marginTop: 4,
  },
});
