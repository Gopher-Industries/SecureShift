/* eslint-disable react-native/no-inline-styles */
// src/screen/SettingsScreen.tsx
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ExpoConstants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Modal,
} from 'react-native';

import { LocalStorage } from '../lib/localStorage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Keep this in sync with your ProfileScreen storage key
const PROFILE_STORAGE_KEY = '@guard_profile_v1';
const NOTIFICATIONS_STORAGE_KEY = '@guard_notifications_enabled';
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
  const navigation2 = useNavigation<Nav>();
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = getStyles(colors);
  const { t, i18n } = useTranslation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

        if (savedValue !== null) {
          setNotificationsEnabled(savedValue === 'true');
        }
      } catch (error) {
        console.error('Failed to load notification preference:', error);
      }
    };

    void loadNotificationPreference();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(value));

      Alert.alert(
        'Notifications',
        value ? 'Notifications have been enabled.' : 'Notifications have been disabled.',
      );
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      Alert.alert('Error', 'Unable to update notification preference.');
    }
  };

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
      await LocalStorage.removeToken();
      await LocalStorage.removePushToken();
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
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
      t('settings.clearLocalData'),
      'This will remove locally stored profile data. Continue?',
      [
        { text: t('lang.cancel'), style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
            } catch {
              // Ignore
            }
          },
        },
      ],
    );
  };

  const currentLangLabel =
    i18n.language === 'zh-CN'
      ? '简体中文'
      : i18n.language === 'zh-TW'
        ? '繁體中文'
        : i18n.language === 'hi'
          ? 'हिन्दी'
          : i18n.language === 'pa'
            ? 'Punjabi'
            : 'English';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card} testID="about-card">
          <Text style={styles.cardTitle}>{t('settings.about')}</Text>
          <Row
            icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
            label={appName}
            right={<Text style={styles.meta}>v{appVersion}</Text>}
            colors={colors}
          />
          <Row
            icon={<Feather name="file-text" size={18} color={colors.primary} />}
            label={t('settings.releaseNotes')}
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="contact-card">
          <Text style={styles.cardTitle}>{t('settings.contactUs')}</Text>
          <Row
            icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
            label={t('settings.emailSupport')}
            onPress={openMail}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
            label={t('settings.callSupport')}
            onPress={callSupport}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="globe-outline" size={18} color={colors.primary} />}
            label={t('settings.visitWebsite')}
            onPress={openWebsite}
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="prefs-card">
          <Text style={styles.cardTitle}>{t('settings.preferences')}</Text>
          <Row
            icon={<Ionicons name="notifications-outline" size={18} color={colors.primary} />}
            label={t('settings.notifications')}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => void handleToggleNotifications(value)}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
            colors={colors}
          />
          <Row
            icon={<Ionicons name="language-outline" size={18} color={colors.primary} />}
            label={t('settings.language')}
            right={<Text style={styles.meta}>{currentLangLabel}</Text>}
            onPress={() => setLangModalVisible(true)}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="moon-outline" size={18} color={colors.primary} />}
            label={t('settings.darkMode')}
            right={
              <Switch
                value={darkMode}
                onValueChange={(value) => void setThemeMode(value ? 'dark' : 'light')}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
            colors={colors}
          />
        </View>

        <View style={styles.card} testID="privacy-card">
          <Text style={styles.cardTitle}>{t('settings.dataPrivacy')}</Text>
          <Row
            icon={<Ionicons name="trash-outline" size={18} color={colors.status.rejected} />}
            label={t('settings.clearLocalData')}
            onPress={clearLocalData}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
            label={t('settings.privacyPolicy')}
            onPress={() => navigation2.navigate('PrivacyPolicy')}
            colors={colors}
          />
          <Row
            icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
            label={t('settings.tos')}
            onPress={() => navigation2.navigate('Terms')}
            colors={colors}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel={t('settings.logout')}
          >
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('lang.select')}</Text>
            {[
              { code: 'en', label: 'English' },
              { code: 'zh-CN', label: '简体中文' },
              { code: 'zh-TW', label: '繁體中文' },
              { code: 'hi', label: 'हिन्दी' },
            ].map((lng) => (
              <TouchableOpacity
                key={lng.code}
                style={styles.langOpt}
                onPress={() => {
                  i18n.changeLanguage(lng.code);
                  setLangModalVisible(false);
                }}
              >
                <Text style={styles.langOptText}>{lng.label}</Text>
                {i18n.language === lng.code && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLangModalVisible(false)}>
              <Text style={styles.cancelBtnText}>{t('lang.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    modalBg: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 30,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    langOpt: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    langOptText: {
      fontSize: 16,
      color: colors.text,
    },
    cancelBtn: {
      marginTop: 20,
      alignItems: 'center',
      paddingVertical: 12,
    },
    cancelBtnText: {
      color: colors.status.rejected,
      fontWeight: 'bold',
    },
  });
