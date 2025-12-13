import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AvailabilityScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Availability</Text>
      <Text>Availability screen coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default AvailabilityScreen;
