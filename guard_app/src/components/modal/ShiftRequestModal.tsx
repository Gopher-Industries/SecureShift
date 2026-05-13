// components/modal/ShiftRequestModal.tsx
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AppColors } from '../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
};

export default function ShiftRequestModal({ visible, onClose, colors }: Props) {
  const s = getStyles(colors);
  const { t } = useTranslation();

  const REQUEST_TYPES = [
    { id: 'swap', label: t('shifts.swap') },
    { id: 'leave', label: t('shifts.leave') },
  ];

  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [requestDate, setRequestDate] = useState<Date | null>(null);
  const [requestTime, setRequestTime] = useState<Date | null>(null);
  const [requestType, setRequestType] = useState<string>(REQUEST_TYPES[0].label);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleCreateRequest = () => {
    if (requestType === REQUEST_TYPES[0].label) {
      if (requestDate === null || requestTime === null) {
        Alert.alert(t('shifts.alerts.missingTimeHead'), t('shifts.alerts.missingTimeMsg'));
        return;
      }
      if (requestDate < new Date()) {
        Alert.alert(t('shifts.alerts.invalidTimeHead'), t('shifts.alerts.invalidTimeMsg'));
        return;
      }
    }

    //Send request to API

    onClose();
  };

  const openPicker = (kind: 'date' | 'time') => {
    setActivePicker(kind);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    if (!selected) return;

    if (activePicker === 'date') {
      setRequestDate(selected);
    } else if (activePicker === 'time') {
      setRequestTime(selected);
    }

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('shifts.createRequest')}</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <View style={s.modalHeaderRow}>
              <Text style={s.modalShiftHeader}>{t('shifts.requestType')}</Text>
            </View>
            <TouchableOpacity style={s.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={requestType ? s.dropdownTextSelected : s.dropdownTextPlaceholder}>
                {requestType || t('shifts.selectRequestType')}
              </Text>
              <Text style={s.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showDropdown && (
              <View style={s.dropdownMenu}>
                {REQUEST_TYPES.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={[s.dropdownItem, requestType === request.id && s.dropdownItemSelected]}
                    onPress={() => {
                      setRequestType(request.label);
                      setShowDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        s.dropdownItemText,
                        requestType === request.id && s.dropdownItemTextSelected,
                      ]}
                    >
                      {request.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={s.modalHeaderRow}>
              <Text style={s.modalShiftHeader}>{t('shifts.requestedTime')}</Text>
            </View>
            <TextInput
              style={s.modalInput}
              placeholder={t('shifts.reasonHint')}
              placeholderTextColor={colors.muted}
              keyboardType="default"
              returnKeyType="done"
              onChangeText={(s) => setReason(s)}
            />

            {requestType === REQUEST_TYPES[0].label && (
              <View>
                <View style={s.modalHeaderRow}>
                  <Text style={s.modalShiftHeader}>{t('shifts.requestedTime')}</Text>
                </View>
                <View style={s.modalHeaderRow}>
                  <TouchableOpacity style={s.modalTimeInput} onPress={() => openPicker('date')}>
                    <Text style={s.modalTimeText}>
                      {requestDate ? requestDate.toDateString() : t('shifts.selectDate')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modalTimeInput} onPress={() => openPicker('time')}>
                    <Text style={s.modalTimeText}>
                      {requestTime ? formatTime(requestTime) : t('shifts.selectTime')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={s.modalRequirements}>
              <TouchableOpacity style={s.modalButton} onPress={handleCreateRequest}>
                <Text style={s.modalButtonText}>{t('shifts.createRequest')}</Text>
              </TouchableOpacity>
            </View>

            {activePicker && (
              <DateTimePicker
                value={
                  activePicker === 'date'
                    ? (requestDate ?? new Date())
                    : activePicker === 'time'
                      ? (requestTime ?? new Date())
                      : (requestTime ?? new Date())
                }
                mode={activePicker === 'date' ? 'date' : 'time'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
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
    modalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalShiftHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginLeft: 6,
    },
    modalRequirements: {
      marginTop: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalInput: {
      fontSize: 14,
      color: colors.text,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      width: 'auto',
    },
    modalTimeInput: {
      marginTop: 8,
      fontSize: 14,
      color: colors.text,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      minWidth: 120,
      maxWidth: 140,
    },
    modalTimeText: {
      alignSelf: 'center',
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignSelf: 'center',
    },
    modalButtonText: {
      color: colors.white,
      fontWeight: '600',
      textAlign: 'center',
    },
    dropdown: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
    },
    dropdownMenu: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      maxHeight: 340,
    },
    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    dropdownTextPlaceholder: {
      fontSize: 15,
      color: colors.muted,
    },
    dropdownTextSelected: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    dropdownIcon: {
      fontSize: 12,
      color: colors.muted,
    },
  });
