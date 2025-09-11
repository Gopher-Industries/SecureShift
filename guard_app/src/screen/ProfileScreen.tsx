// src/screen/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

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
              <Text style={[styles.statValue, styles.statValueIndigo]}>140</Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.statValueYellow]}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.statValueGreen]}>98%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.infoText}>Email: alex.johnson@gmail.com</Text>
          <Text style={[styles.infoText, styles.infoTextSpaced]}>Phone: +61 123456789</Text>
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

const styles = StyleSheet.create({
  // --- class names alphabetized ---
  avatar: {
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
    marginBottom: 15,
    padding: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  container: {
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  infoTextSpaced: {
    marginTop: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  performanceCard: {
    backgroundColor: '#EEF2FF',
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statValueGreen: {
    color: 'green',
  },
  statValueIndigo: {
    color: '#4F46E5',
  },
  statValueYellow: {
    color: '#facc15',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});
