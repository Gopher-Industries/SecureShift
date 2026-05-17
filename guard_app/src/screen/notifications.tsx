// src/screen/notifications.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { getNotifications, getUnreadCount, markAsRead } from '../api/notification';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';
type IconName = 'check-circle' | 'calendar-alt' | 'exclamation-circle' | 'bell';

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        setLoading(true);
        const [notifsRes, countRes] = await Promise.all([
          getNotifications({ page: 1, limit: 20 }),
          getUnreadCount(),
        ]);

        if (notifsRes && notifsRes.notifications) {
          setNotifications(notifsRes.notifications);
          if (notifsRes.notifications.length < 20) {
            setHasMore(false);
          }
        }
        if (countRes && countRes.unreadCount !== undefined) {
          setUnreadCount(countRes.unreadCount);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await getNotifications({ page: nextPage, limit: 20 });
      if (res && res.notifications) {
        setNotifications((prev) => {
          const newItems = res.notifications.filter(
            (newItem: any) => !prev.some((existing) => existing._id === newItem._id),
          );
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        if (res.notifications.length < 20) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error fetching more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllReadLocal = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0) return;

    for (let i = 0; i < unreadItems.length; i++) {
      const item = unreadItems[i];
      try {
        await markAsRead(item._id);
      } catch (err) {
        console.error(`Failed to mark ${item._id} as read`, err);
      }
    }

    // Update local state to reflect that they've been read
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isReminder = item.type === 'REMINDER';
    const cardStyle = isReminder ? styles.greyCard : styles.blueCard;
    const isRead = item.isRead;

    let iconName: IconName = 'bell';
    let iconColor = colors.primary;

    if (item.type === 'SHIFT_APPLIED' || item.type?.includes('APPROVED')) {
      iconName = 'check-circle';
      iconColor = '#4CAF50';
    } else if (item.type?.includes('NEW') || item.type?.includes('SHIFT')) {
      iconName = 'calendar-alt';
      iconColor = '#2196F3';
    } else if (isReminder) {
      iconName = 'exclamation-circle';
      iconColor = '#FF9800';
    }

    const titleText = item.title;
    const messageText = item.message;
    const timeText = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now';

    return (
      <View
        style={[styles.card, cardStyle]}
        accessible
        accessibilityLabel={`${titleText || ''} ${messageText || ''}, ${timeText}`}
      >
        <View style={styles.cardContent}>
          <FontAwesome5 name={iconName} size={20} color={iconColor} />
          <View style={styles.textContainer}>
            {!!titleText && <Text style={styles.titleText}>{titleText}</Text>}
            {!!messageText && <Text style={styles.messageText}>{messageText}</Text>}
            <Text style={styles.timeText}>{timeText}</Text>
          </View>
          {!isRead && <View style={styles.dot} />}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer} accessible accessibilityRole="header">
        <Text style={styles.headerText}>{t('notif.header', 'Recent Notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.badge} onPress={handleMarkAllReadLocal}>
            <Text style={styles.badgeText}>{t('notif.markRead', 'Mark all as read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : notifications.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: colors.muted }}>
          {t('notif.empty', 'No notifications yet.')}
        </Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} /> : null
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    badge: {
      backgroundColor: '#DB4D56',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      ...(Platform.OS === 'android' ? { elevation: 2 } : null),
    },
    badgeText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '400',
    },
    blueCard: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      ...(Platform.OS === 'android' ? { elevation: 2 } : null),
    },
    cardContent: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    container: {
      backgroundColor: colors.bg,
      flex: 1,
      padding: 16,
    },
    dot: {
      backgroundColor: colors.primary,
      borderRadius: 5,
      height: 10,
      marginTop: 4,
      width: 10,
    },
    greyCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    headerContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 12,
    },
    headerText: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    listContent: {
      gap: 12,
      paddingBottom: 12,
    },
    titleText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    messageText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '400',
      marginBottom: 6,
    },
    textContainer: {
      flex: 1,
    },
    timeText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '400',
    },
  });
