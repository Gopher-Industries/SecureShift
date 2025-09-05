import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Keep this in sync with your ProfileScreen storage key
const PROFILE_STORAGE_KEY = '@guard_profile_v1';

const NAVY = '#274b93';
const BORDER = '#E7EBF2';
const MUTED = '#5C667A';
const CANVAS_PADDING = 20;

function Row({
  icon,
  label,
  right,
  onPress,
  accessibilityLabel,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const content = (
    <View style={styles.rowInner}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {right}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={MUTED} /> : null}
      </View>
    </View>
  );
  if (!onPress) return <View style={styles.row} testID={testID}>{content}</View>;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75} accessibilityLabel={accessibilityLabel} testID={testID}>
      {content}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();

  // Local-only toggles (no backend yet)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const appName =
    (Constants?.expoConfig as any)?.name ||
    Constants?.manifest?.name ||
    'SecureShift Guard';
  const appVersion =
    (Constants?.expoConfig as any)?.version ||
    Constants?.manifest?.version ||
    '1.0.0';

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  const openMail = () =>
    Linking.openURL(
      'mailto:support@secureshift.app?subject=SecureShift%20Guard%20Support'
    ).catch(() => Alert.alert('Unable to open mail app'));

  const callSupport = () =>
    Linking.openURL('tel:+61123456789').catch(() =>
      Alert.alert('Unable to start call')
    );

  const openWebsite = () =>
    Linking.openURL('https://example.gopherindustries.com/secure-shift').catch(
      () => Alert.alert('Unable to open website')
    );

  const clearLocalData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove locally stored profile data (e.g., contact/certifications). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
              Alert.alert('Done', 'Local profile data cleared.');
            } catch {
              Alert.alert('Error', 'Could not clear local data.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* About */}
        <View style={styles.card} testID="about-card">
          <Text style={styles.cardTitle}>About</Text>
          <Row
            icon={<Ionicons name="information-circle-outline" size={18} color={NAVY} />}
            label={`${appName}`}
            right={<Text style={styles.meta}>v{appVersion}</Text>}
          />
          <Row
            icon={<Feather name="file-text" size={18} color={NAVY} />}
            label="Release Notes"
            onPress={() => Alert.alert('Release Notes', 'Coming soon')}
          />
        </View>

        {/* Contact Us */}
        <View style={styles.card} testID="contact-card">
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Row
            icon={<Ionicons name="mail-outline" size={18} color={NAVY} />}
            label="Email Support"
            onPress={openMail}
          />
          <Row
            icon={<Ionicons name="call-outline" size={18} color={NAVY} />}
            label="Call Support"
            onPress={callSupport}
          />
          <Row
            icon={<Ionicons name="globe-outline" size={18} color={NAVY} />}
            label="Visit Website"
            onPress={openWebsite}
          />
        </View>

        {/* Preferences (local only) */}
        <View style={styles.card} testID="prefs-card">
          <Text style={styles.cardTitle}>Preferences</Text>
          <Row
            icon={<Ionicons name="notifications-outline" size={18} color={NAVY} />}
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                trackColor={{ false: '#d1d5db', true: NAVY }}
              />
            }
            accessibilityLabel="Toggle notifications"
          />
          <Row
            icon={<Ionicons name="moon-outline" size={18} color={NAVY} />}
            label="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                trackColor={{ false: '#d1d5db', true: NAVY }}
              />
            }
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        {/* Data & Privacy */}
        <View style={styles.card} testID="privacy-card">
          <Text style={styles.cardTitle}>Data & Privacy</Text>
          <Row
            icon={<Ionicons name="trash-outline" size={18} color="#B91C1C" />}
            label="Clear Local Data"
            onPress={clearLocalData}
          />
          <Row
            icon={<Ionicons name="document-text-outline" size={18} color={NAVY} />}
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Coming soon')}
          />
          <Row
            icon={<Ionicons name="shield-checkmark-outline" size={18} color={NAVY} />}
            label="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Coming soon')}
          />
        </View>

        {/* Logout */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityLabel="Log out">
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: CANVAS_PADDING },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  cardTitle: { fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 8 },

  row: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowLabel: { fontSize: 14, color: '#111827', fontWeight: '600', flexShrink: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 12, color: MUTED },

  footer: { marginTop: 8, alignItems: 'center' },
  logoutBtn: {
    backgroundColor: NAVY,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
    minWidth: 180,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});
