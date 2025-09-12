import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessagesScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Messages</Text>
      <Text>Placeholder — hook up list/API later.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', padding: 16 },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: '#0F172A' },
});
