import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '../../theme/colors';

type Props = {
  visible: boolean;
  selectedDate: Date | null;
  fromTime: string;
  toTime: string;
  setFromTime: (value: string) => void;
  setToTime: (value: string) => void;
  onClose: () => void;
  onAdd: () => void;
  saving: boolean;
  colors: AppColors;
  t: (key: string) => string;
};

export default function AvailabilityCalendarModal({
  visible,
  selectedDate,
  fromTime,
  toTime,
  setFromTime,
  setToTime,
  onClose,
  onAdd,
  saving,
  colors,
  t,
}: Props) {
  const styles = getStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('avail.addAvailTitle')}</Text>

          {selectedDate && (
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('avail.date')}</Text>
              <Text style={styles.modalValue}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>{t('avail.from')}</Text>
            <TextInput
              style={styles.modalInput}
              value={fromTime}
              onChangeText={setFromTime}
              placeholder="09:00"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>{t('avail.to')}</Text>
            <TextInput
              style={styles.modalInput}
              value={toTime}
              onChangeText={setToTime}
              placeholder="17:00"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onClose}>
              <Text style={styles.modalBtnCancelText}>{t('avail.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtnAdd} onPress={onAdd} disabled={saving}>
              <Text style={styles.modalBtnAddText}>{t('avail.addBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
    },
    modalField: {
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 8,
    },
    modalValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    modalInput: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalBtnCancel: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    modalBtnCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.muted,
    },
    modalBtnAdd: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    modalBtnAddText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
  });
