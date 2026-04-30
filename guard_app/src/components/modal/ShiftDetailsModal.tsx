// components/modal/ShiftDetailsModal.tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppColors } from '../../theme/colors';
import type { AllShift, AppliedShift, CompletedShift } from '../../models/Shifts';

type Props = {
  shift: AppliedShift | CompletedShift | AllShift | null;
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
};

function ShiftDetailsModal({ shift, visible, onClose, colors }: Props) {
  const s = getStyles(colors);
  const { t } = useTranslation();

  if (!shift) return null;

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('shifts.shiftDetails')}</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <View style={s.modalTitleRow}>
              <Text style={s.modalShiftTitle}>{shift.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={s.statusBadgeText}>
                  {status ? t(`shifts.${status.toLowerCase()}`, status) : t('shifts.available')}
                </Text>
              </View>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.date')}</Text>
              <Text style={s.modalValue}>
                {new Date(shift.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.time')}</Text>
              <Text style={s.modalValue}>{shift.time}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.location')}</Text>
              <Text style={s.modalValue}>{shift.site}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.payRate')}</Text>
              <Text style={s.modalValue}>{shift.rate}</Text>
            </View>

            <View style={s.modalRequirements}>
              <Text style={s.modalRequirementsTitle}>{t('shifts.requirements')}</Text>
              <View style={s.modalTags}>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>Security License</Text>
                </View>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>First Aid</Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ShiftDetailsModal;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      width: '88%',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    modalCloseBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 20,
      color: colors.muted,
    },
    modalBody: {
      gap: 12,
    },
    modalTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalShiftTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginLeft: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.white,
    },
    modalDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    modalValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      flexShrink: 1,
      textAlign: 'right',
    },
    modalRequirements: {
      marginTop: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalRequirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modalTags: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    modalTag: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    modalTagText: {
      fontSize: 12,
      color: colors.text,
    },
  });
