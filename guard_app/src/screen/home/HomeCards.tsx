import React from 'react';
import { Text, View } from 'react-native';

import { getStyles } from '../HomeScreen.styles';

import type { AppColors } from '../../theme/colors';

// Presentational cards for the Home dashboard. Extracted from HomeScreen.tsx
// (GA-021) unchanged.

export const StatCard = ({
  icon,
  label,
  value,
  extraStyle,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  extraStyle?: object;
  colors: AppColors;
}) => {
  const styles = getStyles(colors);

  return (
    <View style={[styles.statCard, extraStyle]}>
      <View style={styles.statTop}>
        <View style={styles.statIcon} accessible={true} accessibilityLabel={label}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

export const RowItem = ({
  title,
  time,
  amount,
  highlight,
  colors,
}: {
  title: string;
  time: string;
  amount?: string;
  highlight?: boolean;
  colors: AppColors;
}) => {
  const styles = getStyles(colors);

  return (
    <View style={[styles.rowItem, highlight && styles.rowItemHL]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{time}</Text>
      </View>
      {!!amount && <Text style={styles.rowAmt}>{amount}</Text>}
    </View>
  );
};
