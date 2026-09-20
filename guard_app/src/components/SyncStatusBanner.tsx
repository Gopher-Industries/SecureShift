// Small banner that drives the app-level attendance sync and shows how many
// offline attendance actions are still waiting to reach the server. Rendered
// once, next to OfflineBanner, so the sync runs for the whole app.
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useAttendanceSync } from '../hooks/useAttendanceSync';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

export default function SyncStatusBanner() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const { pendingCount, isConnected } = useAttendanceSync();

  if (pendingCount <= 0) return null;

  const label = isConnected
    ? t('net.syncing', { count: pendingCount })
    : t('net.pendingSync', { count: pendingCount });

  return (
    <View style={s.bar}>
      <Text style={s.text}>{label}</Text>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    bar: {
      alignItems: 'center',
      backgroundColor: colors.status.pending,
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    text: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
  });
