import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Sample data for notifications
const notifications = [
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
  const renderItem = ({ item }: { item: typeof notifications[0] }) => {
    const isReminder = item.icon === 'exclamation-circle';
    const cardStyle = isReminder ? styles.greyCard : styles.blueCard;

    return (
      <View style={[styles.card, cardStyle]}>
        <View style={styles.cardContent}>
          <FontAwesome5 name={item.icon as any} size={20} color={item.iconColor} />
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Recent Notification’s</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2 new</Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 12 }}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F4F4F4',
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  // Recent Notifications
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: '#DB4D56',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#fff',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
  },
  // For approved/new shift cards
  blueCard: {
    backgroundColor: '#E6EEFF',
    borderColor: '#B0C7FF',
  },
  // For reminder card
  greyCard: {
    backgroundColor: '#F3F3F3',
    borderColor: '#DDD',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  // Notification message
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 4,
  },
  // Time text
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#777',
  },
  // Dot shown for non-reminder items
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D3E50',
    marginTop: 4,
  },
});
