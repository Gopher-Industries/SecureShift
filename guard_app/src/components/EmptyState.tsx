import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
};

export default function EmptyState({ icon = 'file-tray-outline', title, message }: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  return (
    <View style={s.wrap}>
      <View style={s.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.muted} />
      </View>
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.message}>{message}</Text> : null}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    iconCircle: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      marginBottom: 12,
      width: 56,
    },
    message: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    wrap: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
  });
