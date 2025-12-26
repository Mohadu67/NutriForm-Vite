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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

/**
 * NotificationsScreen - Liste des notifications
 */
export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.notifications.list);
      // L'API peut renvoyer { notifications: [] } ou directement un tableau
      const data = response.data?.notifications || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error loading:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  // Marquer comme lu
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiClient.patch(endpoints.notifications.markAsRead(notificationId));
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id || n._id) === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking as read:', error);
    }
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.patch(endpoints.notifications.markAllRead);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking all as read:', error);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiClient.delete(endpoints.notifications.delete(notificationId));
      setNotifications((prev) =>
        prev.filter((n) => (n.id || n._id) !== notificationId)
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Error deleting:', error);
    }
  }, []);

  // Formatter la date relative
  const formatRelativeDate = useCallback((date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'A l\'instant';
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return notifDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  // Obtenir l'icone selon le type
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'workout':
      case 'session':
        return { name: 'barbell', color: theme.colors.primary };
      case 'achievement':
      case 'badge':
        return { name: 'trophy', color: '#F59E0B' };
      case 'challenge':
        return { name: 'flag', color: '#EF4444' };
      case 'match':
      case 'social':
        return { name: 'people', color: '#EC4899' };
      case 'reminder':
        return { name: 'alarm', color: '#3B82F6' };
      case 'streak':
        return { name: 'flame', color: '#F97316' };
      default:
        return { name: 'notifications', color: '#6B7280' };
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }) => {
    const notifId = item.id || item._id;
    const icon = getNotificationIcon(item.type);
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isDark && styles.notificationItemDark,
          isUnread && styles.notificationItemUnread,
          isUnread && isDark && styles.notificationItemUnreadDark,
        ]}
        onPress={() => {
          if (!item.read) markAsRead(notifId);
          // Naviguer selon le type de notification
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, isDark && styles.notificationTitleDark]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationMessage, isDark && styles.notificationMessageDark]}>
            {item.message || item.body}
          </Text>
          <Text style={[styles.notificationTime, isDark && styles.notificationTimeDark]}>
            {formatRelativeDate(item.createdAt)}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(notifId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={isDark ? '#666' : '#CCC'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="notifications-off-outline" size={48} color={isDark ? '#555' : '#CCC'} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        Aucune notification
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        Vous recevrez des notifications pour vos seances, badges et defis.
      </Text>
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
          Notifications
          {unreadCount > 0 && (
            <Text style={styles.headerBadge}> ({unreadCount})</Text>
          )}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={styles.headerSpacer} />}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={renderNotification}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
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
    flex: 1,
    textAlign: 'center',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerBadge: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  headerSpacer: {
    width: 60,
  },
  markAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  markAllText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  listContentEmpty: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationItemDark: {
    backgroundColor: '#2A2A2A',
  },
  notificationItemUnread: {
    backgroundColor: `${theme.colors.primary}08`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationItemUnreadDark: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  notificationTitleDark: {
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  notificationMessageDark: {
    color: '#999999',
  },
  notificationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 6,
  },
  notificationTimeDark: {
    color: '#666666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  deleteButton: {
    padding: theme.spacing.xs,
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
  },
  emptyTextDark: {
    color: '#888888',
  },
});
