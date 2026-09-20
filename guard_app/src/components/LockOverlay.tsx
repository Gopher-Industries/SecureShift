import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

export default function LockOverlay({ onUnlock }: { onUnlock: () => void }) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  return (
    <View style={s.overlay}>
      <Ionicons name="lock-closed" size={56} color={colors.primary} />
      <Text style={s.title}>{t('appLock.lockedTitle')}</Text>
      <Text style={s.message}>{t('appLock.lockedMessage')}</Text>
      <TouchableOpacity style={s.button} onPress={onUnlock} accessibilityRole="button">
        <Text style={s.buttonText}>{t('appLock.unlock')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      marginTop: 24,
      paddingHorizontal: 28,
      paddingVertical: 12,
    },
    buttonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
    message: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      paddingHorizontal: 32,
      textAlign: 'center',
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.bg,
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 1000,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginTop: 16,
      textAlign: 'center',
    },
  });
