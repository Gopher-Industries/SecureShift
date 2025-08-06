import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import ShiftCard from '../components/ShiftCard';

export default function HomeScreen({ isDarkMode, toggleTheme }) {
  const bgColor = isDarkMode ? '#121212' : '#f0f4ff';
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Welcome, Guard!</Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>

      <ShiftCard
        icon="🌅"
        shift="Morning Shift"
        time="8:00 AM – 12:00 PM"
        location="Main Gate"
        isDarkMode={isDarkMode}
      />
      <ShiftCard
        icon="⛅"
        shift="Afternoon Shift"
        time="1:00 PM – 5:00 PM"
        location="Building B"
        isDarkMode={isDarkMode}
      />
      <ShiftCard
        icon="🌙"
        shift="Night Shift"
        time="6:00 PM – 10:00 PM"
        location="Reception"
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});