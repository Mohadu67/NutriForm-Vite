import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProgram } from '../../contexts/ProgramContext';
import { theme } from '../../theme';

export default function ProgramHistoryScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { sessionHistory, historyStats, fetchSessionHistory, isPremium, loading } = useProgram();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isPremium) {
      fetchSessionHistory();
    }
  }, [isPremium]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessionHistory();
    setRefreshing(false);
  }, []);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Formater la durée
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}h ${remainMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity
      style={[styles.sessionCard, isDark && styles.sessionCardDark]}
      onPress={() => {
        if (item.programId) {
          navigation.navigate('ProgramDetail', { programId: item.programId });
        }
      }}
    >
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, isDark && styles.sessionDateDark]}>
          {formatDate(item.endedAt || item.completedAt)}
        </Text>
        <View style={[styles.statusBadge, item.status === 'finished' && styles.statusBadgeSuccess]}>
          <Text style={styles.statusText}>
            {item.status === 'finished' ? 'Terminé' : 'En cours'}
          </Text>
        </View>
      </View>

      <Text style={[styles.programName, isDark && styles.programNameDark]}>
        {item.programName || 'Programme'}
      </Text>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.statValue, isDark && styles.statValueDark]}>
            {formatDuration(item.durationSec || 0)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="layers-outline" size={16} color="#3B82F6" />
          <Text style={[styles.statValue, isDark && styles.statValueDark]}>
            {item.cyclesCompleted || 0}/{item.cyclesTotal || 0} cycles
          </Text>
        </View>
        {item.calories > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={16} color="#EF4444" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {item.calories} kcal
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.premiumGate}>
          <Ionicons name="lock-closed" size={64} color="#F59E0B" />
          <Text style={[styles.premiumTitle, isDark && styles.premiumTitleDark]}>
            Fonctionnalité Premium
          </Text>
          <Text style={[styles.premiumText, isDark && styles.premiumTextDark]}>
            L'historique des sessions est réservé aux membres Premium.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>Historique</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats summary */}
      {historyStats && (
        <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {historyStats.totalSessions || sessionHistory.length || 0}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>
              Sessions
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {historyStats.totalDuration
                ? formatDuration(historyStats.totalDuration)
                : '0m'}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>
              Durée totale
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {historyStats.totalCalories || 0}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>
              Calories
            </Text>
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* List */}
      {!loading && (
        <FlatList
          data={sessionHistory}
          renderItem={renderSession}
          keyExtractor={(item) => item._id || String(item.completedAt)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={isDark ? '#555' : '#CCC'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                Aucune session
              </Text>
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                Commencez un programme pour voir votre historique
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardDark: {
    backgroundColor: '#2A2A2A',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  summaryValueDark: {
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  summaryLabelDark: {
    color: '#888',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sessionCardDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sessionDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sessionDateDark: {
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22C55E',
  },
  programName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  programNameDark: {
    color: '#FFFFFF',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statValueDark: {
    color: '#AAA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#888',
  },
  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  premiumTitleDark: {
    color: '#FFFFFF',
  },
  premiumText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  premiumTextDark: {
    color: '#888',
  },
});
