import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  useColorScheme, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { theme } from '../../theme';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import logger from '../../services/logger';
import websocketService from '../../services/websocket';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ICON_MAP = {
  workout:        { name: 'barbell',          color: theme.colors.primary },
  session:        { name: 'barbell',          color: theme.colors.primary },
  achievement:    { name: 'trophy',           color: theme.colors.warning },
  badge:          { name: 'trophy',           color: theme.colors.warning },
  challenge:      { name: 'flag',             color: theme.colors.error },
  match:          { name: 'people',           color: theme.colors.secondary },
  social:         { name: 'people',           color: theme.colors.secondary },
  reminder:       { name: 'alarm',            color: theme.colors.info },
  streak:         { name: 'flame',            color: theme.colors.accent },
  like:           { name: 'heart',            color: '#E89A6F' },
  comment:        { name: 'chatbubble',       color: theme.colors.info },
  follow:         { name: 'person-add',       color: theme.colors.secondary },
  message:        { name: 'mail',             color: theme.colors.primary },
  activity:       { name: 'pulse',            color: theme.colors.success },
  system:         { name: 'information-circle', color: '#888' },
  admin:          { name: 'shield',           color: theme.colors.error },
  support:        { name: 'help-circle',      color: theme.colors.info },
  shared_session: { name: 'people-circle',    color: theme.colors.accent },
};

const getIcon = (type) => ICON_MAP[type] || { name: 'notifications', color: '#888' };

const formatRelativeDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMin = Math.floor((now - d) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const groupByTime = (notifications) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets = { today: [], yesterday: [], week: [], older: [] };

  notifications.forEach(n => {
    const d = new Date(n.createdAt);
    if (d >= today) buckets.today.push(n);
    else if (d >= yesterday) buckets.yesterday.push(n);
    else if (d >= weekAgo) buckets.week.push(n);
    else buckets.older.push(n);
  });

  const sections = [];
  if (buckets.today.length) sections.push({ title: 'Aujourd\'hui', data: buckets.today });
  if (buckets.yesterday.length) sections.push({ title: 'Hier', data: buckets.yesterday });
  if (buckets.week.length) sections.push({ title: 'Cette semaine', data: buckets.week });
  if (buckets.older.length) sections.push({ title: 'Plus ancien', data: buckets.older });
  return sections;
};

// ─── Notification Item ──────────────────────────────────────────────────────

function NotificationItem({ item, isDark, onPress, onDelete }) {
  const icon = getIcon(item.type);
  const isUnread = !item.read;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDark && styles.cardDark,
        isUnread && styles.cardUnread,
        isUnread && isDark && styles.cardUnreadDark,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Accent line for unread */}
      {isUnread && (
        <LinearGradient
          colors={['transparent', `${theme.colors.primary}50`, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cardTopLine}
        />
      )}

      <View style={styles.cardBody}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${icon.color}18` }, isDark && { backgroundColor: `${icon.color}25` }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.notifTitle, isDark && styles.textLight]} numberOfLines={2}>
            {item.title}
          </Text>
          {(item.message || item.body) ? (
            <Text style={[styles.notifMessage, isDark && styles.textMuted]} numberOfLines={3}>
              {item.message || item.body}
            </Text>
          ) : null}
          <Text style={[styles.notifTime, isDark && styles.textTertiary]}>
            {formatRelativeDate(item.createdAt)}
          </Text>
        </View>

        {/* Right side */}
        <View style={styles.rightCol}>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={16} color={isDark ? '#555' : '#CCC'} />
          </TouchableOpacity>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, isDark }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
      <View style={[styles.sectionLine, isDark && styles.sectionLineDark]} />
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ isDark }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <LinearGradient
          colors={[theme.colors.primary, '#F9C4A3']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="notifications-off-outline" size={36} color="#FFF" />
        </LinearGradient>
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.textLight]}>
        Aucune notification
      </Text>
      <Text style={[styles.emptySubtitle, isDark && styles.textMuted]}>
        Vous recevrez des notifications pour vos séances, badges et défis.
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.notifications.list);
      const data = response.data?.notifications || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.app.error('[NOTIFICATIONS] Error loading:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      loadNotifications();
    });
    return () => subscription.remove();
  }, [loadNotifications]);

  // Écouter les notifications WebSocket en temps réel
  useEffect(() => {
    const handleNewNotification = (notification) => {
      logger.app.debug('[NOTIFICATIONS] New notification via WebSocket', notification);
      // Ajouter directement la notif en tête de liste pour affichage instantané
      setNotifications(prev => {
        const id = notification.id || notification._id;
        if (prev.some(n => (n.id || n._id) === id)) return prev;
        return [{ ...notification, createdAt: notification.timestamp || new Date().toISOString() }, ...prev];
      });
    };

    websocketService.on('new_notification', handleNewNotification);
    return () => websocketService.off('new_notification', handleNewNotification);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const pendingReadRef = useRef(new Set());
  const markAsRead = useCallback(async (notificationId) => {
    if (pendingReadRef.current.has(notificationId)) return;
    pendingReadRef.current.add(notificationId);
    // Optimistic update immédiat
    setNotifications(prev =>
      prev.map(n => (n.id || n._id) === notificationId ? { ...n, read: true } : n)
    );
    try {
      await apiClient.put(endpoints.notifications.markAsRead(notificationId));
    } catch (error) {
      logger.app.error('[NOTIFICATIONS] Error marking as read:', error);
    } finally {
      pendingReadRef.current.delete(notificationId);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put(endpoints.notifications.markAllRead);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      logger.app.error('[NOTIFICATIONS] Error marking all as read:', error);
    }
  }, []);

  const pendingDeleteRef = useRef(new Set());
  const deleteNotification = useCallback(async (notificationId) => {
    if (pendingDeleteRef.current.has(notificationId)) return;
    pendingDeleteRef.current.add(notificationId);
    setNotifications(prev => prev.filter(n => (n.id || n._id) !== notificationId));
    try {
      await apiClient.delete(endpoints.notifications.delete(notificationId));
    } catch (error) {
      logger.app.error('[NOTIFICATIONS] Error deleting:', error);
    } finally {
      pendingDeleteRef.current.delete(notificationId);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const sections = useMemo(() => groupByTime(notifications), [notifications]);

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
          style={[styles.backBtn, isDark && styles.backBtnDark]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={22} color={isDark ? '#E0E0E0' : '#333'} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id || item._id)}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} isDark={isDark} />
        )}
        renderItem={({ item }) => {
          const notifId = item.id || item._id;
          return (
            <NotificationItem
              item={item}
              isDark={isDark}
              onPress={() => {
                if (!item.read) markAsRead(notifId);
              }}
              onDelete={() => deleteNotification(notifId)}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={<EmptyState isDark={isDark} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout
  container: { flex: 1, backgroundColor: '#F2F3F7' },
  containerDark: { backgroundColor: '#111318' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textLight: { color: '#FFFFFF' },
  textMuted: { color: '#7A7D85' },
  textTertiary: { color: '#555' },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E8E9EE',
  },
  headerDark: { borderBottomColor: '#22262E' },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  backBtnDark: { backgroundColor: '#1E2228' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  unreadPill: {
    backgroundColor: theme.colors.primary, borderRadius: 10,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadPillText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: `${theme.colors.primary}15` },
  markAllText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  // ── Section Headers
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 4, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionTitleDark: { color: '#666' },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#E8E9EE' },
  sectionLineDark: { backgroundColor: '#22262E' },

  // ── List
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  listContentEmpty: { flex: 1 },

  // ── Card
  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardDark: { backgroundColor: '#1A1D24' },
  cardUnread: { backgroundColor: `${theme.colors.primary}06` },
  cardUnreadDark: { backgroundColor: `${theme.colors.primary}12` },
  cardTopLine: { height: 2 },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },

  // ── Icon
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // ── Content
  content: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 3 },
  notifMessage: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#AAA', marginTop: 2 },

  // ── Right column
  rightCol: { alignItems: 'center', gap: 10, paddingTop: 2 },
  deleteBtn: { padding: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  // ── Empty state
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: { marginBottom: 24 },
  emptyIconGradient: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 10, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 21 },
});
