// component/card/ShiftCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../theme';
import type { AppColors } from '../../theme/colors';
import type { ShiftCardItem } from '../../models/Shifts';

type Props = {
  shift: ShiftCardItem;
  onPress?: () => void;
  showApply?: boolean;
  onApply?: () => void;
  applying?: boolean;
  colors: AppColors;
};

export default function ShiftCard({
  shift,
  onPress,
  showApply = false,
  onApply,
  applying = false,
}: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const s = getStyles(colors);

  const status = 'status' in shift ? shift.status : 'Completed';

  const statusColor =
    status === 'Confirmed'
      ? colors.status.confirmed
      : status === 'Pending'
        ? colors.link
        : status === 'Available'
          ? colors.primary
          : colors.muted;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleSection}>
          <Text style={s.cardTitle}>{shift.title}</Text>

          {showApply && status === 'Available' ? (
            <TouchableOpacity
              style={[s.applyBtn, applying && s.applyBtnDisabled]}
              onPress={onApply}
              disabled={applying}
            >
              <Text style={s.applyBtnText}>
                {applying ? t('shifts.applying') : t('shifts.apply')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.cardStatusBadge, { backgroundColor: statusColor }]}>
              <Text style={s.cardStatusText}>
                {status ? t(`shifts.${status.toLowerCase()}`, status) : t('shifts.available')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={s.cardCompany}>{shift.company}</Text>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>{t('shifts.date')}</Text>
        <Text style={s.cardValue}>
          {new Date(shift.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>{t('shifts.time')}</Text>
        <Text style={s.cardValue}>{shift.time}</Text>
      </View>

      <View style={s.cardRow}>
        <Text style={s.cardLabel}>{t('shifts.payRate')}</Text>
        <Text style={s.cardPay}>{shift.rate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      marginBottom: 8,
    },
    cardTitleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    cardStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 12,
    },
    cardStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.white,
    },
    cardCompany: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 12,
    },
    cardRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    cardLabel: {
      fontSize: 13,
      color: colors.muted,
      width: 60,
    },
    cardValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    cardPay: {
      fontSize: 13,
      color: colors.status.confirmed,
      fontWeight: '700',
    },
    applyBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginLeft: 12,
    },
    applyBtnDisabled: {
      opacity: 0.7,
    },
    applyBtnText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '700',
    },
  });
