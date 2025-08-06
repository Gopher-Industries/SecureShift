import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ShiftCard({ title, time, location, isDarkMode }) {
  return (
    <View style={[styles.card, isDarkMode ? styles.darkCard : styles.lightCard]}>
      <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>{title}</Text>

      <View style={styles.row}>
        <Icon name="clock-time-four-outline" size={22} color={isDarkMode ? '#ccc' : '#333'} />
        <Text style={[styles.text, isDarkMode && { color: '#ccc' }]}>{'  ' + time}</Text>
      </View>

      <View style={styles.row}>
        <Icon name="map-marker" size={22} color="red" />
        <Text style={[styles.text, isDarkMode && { color: '#ccc' }]}>{'  ' + location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 8,
  },
  lightCard: {
    backgroundColor: '#fff',
  },
  darkCard: {
    backgroundColor: '#1f1f1f',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  text: {
    fontSize: 17,
    color: '#333',
  },
});