import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExpoConstants from 'expo-constants';

const NAVY = '#274b93';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';
const CANVAS_PADDING = 20;

export default function ReleaseNotesScreen() {
    
    const appVersion =
  (ExpoConstants?.expoConfig as any)?.version ||
  (ExpoConstants as any)?.manifest?.version ||
  '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="information-circle-outline" size={18} color={NAVY} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Release Notes</Text>
              <Text style={styles.version}>Version {appVersion}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Features</Text>
          <Text style={styles.item}>• Added a dedicated Release Notes screen</Text>
          <Text style={styles.item}>• App version is now displayed in one place</Text>
          <Text style={styles.item}>• Content is organised and easier to read</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Known Issues</Text>
          <Text style={styles.item}>• Release notes content is static for now</Text>
          <Text style={styles.item}>• Minor UI differences may appear on some devices</Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 6,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  headerRow: { alignItems: 'center', flexDirection: 'row' },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  item: { color: '#111827', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  safe: { backgroundColor: '#F9FAFB', flex: 1 },
  scroll: { padding: CANVAS_PADDING },
  spacer: { height: 20 },
  version: { color: MUTED, fontSize: 14, marginTop: 2 },
});