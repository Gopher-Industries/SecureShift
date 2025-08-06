import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#f0f4ff' }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <HomeScreen isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </View>
  );
}
