/* eslint-disable react-native/no-inline-styles */
// src/screen/SettingsScreen.tsx
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import ExpoConstants from 'expo-constants';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LocalStorage } from '../lib/localStorage';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

// Keep this in sync with your ProfileScreen storage key
const PROFILE_STORAGE_KEY = '@guard_profile_v1';
const CANVAS_PADDING = 20;

function Row({
  icon,
  label,
  right,
  onPress,
  accessibilityLabel,
  testID,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  colors: AppColors;
}) {
  const styles = getStyles(colors);

  const content = (
    <View style={styles.rowInner}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {right}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = getStyles(colors);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const darkMode = themeMode === 'dark';

  const appName =
    (ExpoConstants?.expoConfig as unknown as { name?: string })?.name ||
    (ExpoConstants as unknown as { manifest?: { name?: string } })?.manifest?.name ||
    'SecureShift Guard';

  const appVersion =
    (ExpoConstants?.expoConfig as unknown as { version?: string })?.version ||
    (ExpoConstants as unknown as { manifest?: { version?: string } })?.manifest?.version ||
    '1.0.0';

  const handleLogout = async () => {
    try {
      await LocalStorage.removeToken(); // clear auth tokens
      await LocalStorage.removePushToken(); // clear push tokens
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY); // clear profile data
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.');
    }
  };

  const openMail = () =>
    Linking.openURL('mailto:support@secureshift.app?subject=SecureShift%20Guard%20Support').catch(
      () => Alert.alert('Unable to open mail app'),
    );

  const callSupport = () =>
    Linking.openURL('tel:+61123456789').catch(() => Alert.alert('Unable to start call'));

  const openWebsite = () =>
    Linking.openURL('https://example.gopherindustries.com/secure-shift').catch(() =>
      Alert.alert('Unable to open website'),
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
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card} testID="about-card">
          <Text style={styles.cardTitle}>About</Text>
          <Row
            icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
            label={appName}
            right={<Text style={styles.meta}>v{appVersion}</Text>}
            colors={colors}
          />
          <Row
            icon={<Feather name="file-text" size={18} color={colors.primary} />}
            label="Release Notes"
            onPress={() => Alert.alert('Release Notes', 'Coming soon')}
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="contact-card">
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Row
            icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
            label="Email Support"
            onPress={openMail}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
            label="Call Support"
            onPress={callSupport}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="globe-outline" size={18} color={colors.primary} />}
            label="Visit Website"
            onPress={openWebsite}
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="prefs-card">
          <Text style={styles.cardTitle}>Preferences</Text>
          <Row
            icon={<Ionicons name="notifications-outline" size={18} color={colors.primary} />}
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
            accessibilityLabel="Toggle notifications"
            colors={colors}
          />
          <Row
            icon={<Ionicons name="moon-outline" size={18} color={colors.primary} />}
            label="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={(value) => void setThemeMode(value ? 'dark' : 'light')}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
            accessibilityLabel="Toggle dark mode"
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="privacy-card">
          <Text style={styles.cardTitle}>Data & Privacy</Text>
          <Row
            icon={<Ionicons name="trash-outline" size={18} color={colors.status.rejected} />}
            label="Clear Local Data"
            onPress={clearLocalData}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Coming soon')}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
            label="Terms of Service"
            onPress={() => navigation.navigate('Terms')}
            colors={colors}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Log out"
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
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
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 8,
    },
    footer: { alignItems: 'center', marginTop: 8 },
    logoutBtn: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 9999,
      elevation: 3,
      minWidth: 180,
      paddingHorizontal: 20,
      paddingVertical: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    logoutText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    meta: { color: colors.muted, fontSize: 12 },
    row: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 10,
      padding: 12,
    },
    rowIcon: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      height: 36,
      justifyContent: 'center',
      marginRight: 10,
      width: 36,
    },
    rowInner: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    rowLabel: { color: colors.text, flexShrink: 1, fontSize: 14, fontWeight: '600' },
    rowLeft: { alignItems: 'center', flexDirection: 'row', flexShrink: 1 },
    rowRight: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    safe: { backgroundColor: colors.bg, flex: 1 },
    scroll: { padding: CANVAS_PADDING },
    spacer: { height: 20 },
  });
