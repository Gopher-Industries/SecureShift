import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';

const shifts = [
  {
    icon: '🌅',
    title: 'Morning Shift',
    time: '8:00 AM – 12:00 PM',
    location: 'Main Gate',
  },
  {
    icon: '⛅',
    title: 'Afternoon Shift',
    time: '1:00 PM – 5:00 PM',
    location: 'Building B',
  },
  {
    icon: '🌙',
    title: 'Night Shift',
    time: '6:00 PM – 10:00 PM',
    location: 'Reception',
  },
];

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  const toggleSwitch = () => setIsDarkMode((prev) => !prev);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.text }]}>
          Welcome, Guard!
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#0a84ff' }}
          thumbColor={isDarkMode ? '#0a84ff' : '#f4f3f4'}
          onValueChange={toggleSwitch}
          value={isDarkMode}
        />
      </View>

      {shifts.map((shift, idx) => (
        <View
          key={idx}
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.shiftTitle, { color: theme.text }]}>
            {shift.icon} {shift.title}
          </Text>
          <Text style={[styles.time, { color: theme.subtext }]}>🕒 {shift.time}</Text>
          <Text style={[styles.location, { color: theme.subtext }]}>📍 {shift.location}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// 💡 Color Themes
const lightTheme = {
  bg: '#e4efff',
  card: '#ffffff',
  text: '#111111',
  subtext: '#333333',
  shadow: '#aaa',
};

const darkTheme = {
  bg: '#111111',
  card: '#1c1c1e',
  text: '#ffffff',
  subtext: '#cccccc',
  shadow: '#000',
};

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  shiftTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
  },
});