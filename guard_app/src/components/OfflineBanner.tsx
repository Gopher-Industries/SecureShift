import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

export default function OfflineBanner() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    // the network listener does not fire in Expo Go, so we read the state
    // ourselves every few seconds
    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (active) {
          setOffline(state.isConnected === false);
        }
      } catch {
        // if the state cannot be read we keep the bar hidden
      }
    };

    void check();
    const timer = setInterval(() => void check(), 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <View style={s.bar}>
      <Text style={s.text}>{t('net.offline')}</Text>
    </View>
  );
}

const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    bar: {
      alignItems: 'center',
      backgroundColor: colors.status.rejected,
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: statusBarHeight + 8,
    },
    text: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
  });
