import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '../../theme/colors';

type ViewMode = 'simple' | 'weekly' | 'monthly';

type Props = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  colors: AppColors;
  t: (key: string) => string;
};

export default function AvailabilityViewToggle({ viewMode, onChange, colors, t }: Props) {
  const styles = getStyles(colors);

  return (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'simple' && styles.toggleBtnActive]}
        onPress={() => onChange('simple')}
      >
        <Text style={[styles.toggleText, viewMode === 'simple' && styles.toggleTextActive]}>
          {t('avail.simple')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
        onPress={() => onChange('weekly')}
      >
        <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
          {t('avail.weekly')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
        onPress={() => onChange('monthly')}
      >
        <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
          {t('avail.monthly')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      padding: 4,
      margin: 16,
      marginBottom: 7,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
    },
    toggleTextActive: {
      color: colors.white,
    },
  });
