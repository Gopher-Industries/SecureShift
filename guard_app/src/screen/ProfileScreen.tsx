import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
        </View>

        {/* Name */}
        <Text style={styles.name}>Alex Johnson</Text>

        {/* Performance Summary */}
        <View style={[styles.card, styles.performanceCard]}>
          <Text style={styles.cardTitle}>
            <Text style={styles.icon}>⭐</Text> Performance Summary
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#4F46E5' }]}>140</Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#facc15' }]}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: 'green' }]}>98%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.infoText}>Email: alex.johnson@gmail.com</Text>
          <Text style={[styles.infoText, { marginTop: 6 }]}>Phone: +61 123456789</Text>
        </View>

        {/* Certifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certifications</Text>
          <View style={styles.badgesRow}>
            {['Security License', 'CPR', 'First Aid'].map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
//styles for the profile screen
const styles = StyleSheet.create({
  //main screen container
  container: {
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  // Padding around scroll view content
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  // Container for avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  // Avatar circle with icon inside
  avatar: {
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  // Name text below avatar
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Reusable card style
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
    marginBottom: 15,
    padding: 15,
  },
  performanceCard: {
    backgroundColor: '#EEF2FF',
  },
  // Card title style
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  // Badge label
  badge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#1E3A8A',
    fontSize: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
});
