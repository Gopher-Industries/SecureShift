import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShiftCard({ icon, shift, time, location, isDarkMode }) {
  const cardStyle = {
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    shadowColor: isDarkMode ? '#000000' : '#aaaaaa',
  };

  const textStyle = {
    color: isDarkMode ? '#ffffff' : '#000000',
  };

  return (
    <View style={[styles.card, cardStyle]}>
      <Text style={[styles.title, textStyle]}>{icon} {shift}</Text>
      <Text style={[styles.detail, textStyle]}>🕒 {time}</Text>
      <Text style={[styles.detail, textStyle]}>📍 {location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    marginTop: 4,
  },
});
