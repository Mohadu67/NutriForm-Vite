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

/**
 * RecentActivity - Liste des seances recentes
 * Affiche les 5 dernieres seances avec details expandables
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
    setEditingName(session.name || 'Seance');
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
      Alert.alert('Supprimer', 'Supprimer cette seance ?', [
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
    return parts.length > 0 ? parts.join(' - ') : 'Complete';
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
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Activite recente
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
                isExpanded && isDark && styles.sessionItemExpandedDark,
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
                  <Text style={styles.sessionDateText}>
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
                        <Ionicons name="checkmark" size={20} color="#72baa1" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit}>
                        <Ionicons name="close" size={20} color="#a8a29e" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => handleStartEdit(session)}>
                      <Text style={[styles.sessionName, isDark && styles.sessionNameDark]}>
                        {session?.name || 'Seance'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.sessionMeta, isDark && styles.sessionMetaDark]}>
                    {session?.durationMinutes ? `${session.durationMinutes} min` : ''}
                    {entries.length ? ` · ${entries.length} exo` : ''}
                    {calories > 0 ? ` · ${calories} kcal` : ''}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.sessionActions}>
                  {entries.length > 0 && (
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#d6d3d1"
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(sessionId)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#a8a29e" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Expanded details */}
              {isExpanded && entries.length > 0 && (
                <View style={[styles.sessionExpanded, isDark && styles.sessionExpandedDark]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 14,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  sessionsList: {
    gap: 10,
  },
  sessionItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sessionItemDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sessionItemExpanded: {
    borderColor: 'rgba(114,186,161,0.3)',
  },
  sessionItemExpandedDark: {
    borderColor: 'rgba(114,186,161,0.3)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  sessionDate: {
    backgroundColor: 'rgba(114,186,161,0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sessionDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#72baa1',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  sessionNameDark: {
    color: '#FFFFFF',
  },
  sessionMeta: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 2,
  },
  sessionMetaDark: {
    color: '#a8a29e',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionNameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    borderBottomWidth: 1,
    borderBottomColor: '#72baa1',
    paddingVertical: 2,
  },
  sessionNameInputDark: {
    color: '#FFFFFF',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#efedea',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fafaf9',
  },
  sessionExpandedDark: {
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  exerciseDetail: {
    paddingVertical: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1917',
    flex: 1,
  },
  exerciseNameDark: {
    color: '#FFFFFF',
  },
  exerciseSummary: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
  },
  summaryBadge: {
    backgroundColor: 'rgba(114,186,161,0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  summaryBadgeText: {
    fontSize: 11,
    color: '#72baa1',
    fontWeight: '600',
  },
});
