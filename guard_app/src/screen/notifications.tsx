import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';

type IconName = 'check-circle' | 'calendar-alt' | 'exclamation-circle';

const notifications: {
  id: string;
  icon: IconName;
  iconColor: string;
  title: string;
  time: string;
}[] = [
  {
    id: '1',
    icon: 'check-circle',
    iconColor: '#4CAF50',
    title: 'Your application for Hospital Complex shift has been approved.',
    time: '2 hours ago',
  },
  {
    id: '2',
    icon: 'calendar-alt',
    iconColor: '#2196F3',
    title: 'New shift available: Sephora – Tomorrow',
    time: '4 hours ago',
  },
  {
    id: '3',
    icon: 'exclamation-circle',
    iconColor: '#FF9800',
    title: 'Reminder: Shopping Center shift starts today at 9:00 am',
    time: '1 hour ago',
  },
];

export default function NotificationsScreen() {
  const renderItem = ({ item }: { item: (typeof notifications)[number] }) => {
    const isReminder = item.icon === 'exclamation-circle';
    const cardStyle = isReminder ? styles.greyCard : styles.blueCard;

    return (
      <View
        style={[styles.card, cardStyle]}
        accessible
        accessibilityLabel={`${item.title}, ${item.time}`}
      >
        <View style={styles.cardContent}>
          <FontAwesome5 name={item.icon} size={20} color={item.iconColor} />
          <View style={styles.textContainer}>
            <Text style={styles.messageText}>{item.title}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          {!isReminder && <View style={styles.dot} />}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer} accessible accessibilityRole="header">
        <Text style={styles.headerText}>Recent Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2 new</Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#DB4D56',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Android elevation
    ...(Platform.OS === 'android' ? { elevation: 2 } : null),
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
  },
  blueCard: {
    backgroundColor: '#E6EEFF',
    borderColor: '#B0C7FF',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Android elevation
    ...(Platform.OS === 'android' ? { elevation: 2 } : null),
  },
  cardContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  container: {
    backgroundColor: '#F4F4F4',
    flex: 1,
    padding: 16,
  },
  dot: {
    backgroundColor: '#2D3E50',
    borderRadius: 5,
    height: 10,
    marginTop: 4,
    width: 10,
  },
  greyCard: {
    backgroundColor: '#F3F3F3',
    borderColor: '#DDD',
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
  },
  listContent: {
    gap: 12,
    paddingBottom: 12,
  },
  messageText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  textContainer: {
    flex: 1,
  },
  timeText: {
    color: '#777',
    fontSize: 12,
    fontWeight: '400',
  },
});
