// components/toggle/ViewToggle.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '../../theme/colors';

type Props = {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  colors: AppColors;
};

function ViewToggle({ view, onViewChange, colors }: Props) {
  const s = getStyles(colors);

  return (
    <View style={s.viewToggle}>
      <TouchableOpacity
        style={[s.viewToggleBtn, view === 'list' && s.viewToggleBtnActive]}
        onPress={() => onViewChange('list')}
      >
        <Text style={[s.viewToggleIcon, view === 'list' && s.viewToggleIconActive]}>☰</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.viewToggleBtn, view === 'calendar' && s.viewToggleBtnActive]}
        onPress={() => onViewChange('calendar')}
      >
        <Text style={[s.viewToggleIcon, view === 'calendar' && s.viewToggleIconActive]}>📅</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ViewToggle;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    viewToggleBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewToggleBtnActive: {
      backgroundColor: colors.primary,
    },
    viewToggleIcon: {
      fontSize: 18,
      color: colors.muted,
    },
    viewToggleIconActive: {
      color: colors.white,
    },
  });
