// components/modal/ShiftRequestModal.tsx
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
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

import { createShiftRequest, getSwapableShifts, SwapOptionsResponse } from '../../api/shiftRequest';

import type { AllShift, AppliedShift, CompletedShift } from '../../models/Shifts';
import type { AppColors } from '../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
  shift: AppliedShift | CompletedShift | AllShift | null;
};

export default function ShiftRequestModal({ visible, onClose, colors, shift }: Props) {
  const s = getStyles(colors);
  const { t } = useTranslation();

  const REQUEST_TYPES = [
    { index: 0, id: 'SWAP', label: t('shifts.swap') },
    { index: 1, id: 'LEAVE', label: t('shifts.leave') },
  ];

  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [leaveStart, setLeaveStart] = useState<Date | null>(null);
  const [leaveEnd, setLeaveEnd] = useState<Date | null>(null);
  const [requestType, setRequestType] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showSwapOptions, setShowSwapOptions] = useState<boolean>(false);
  const [swapOptions, setSwapOptions] = useState<SwapOptionsResponse[]>([]);
  const [swapChoice, setSwapChoice] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSwapChoice(-1);

      if (!shift) throw error;
      const res = await getSwapableShifts(shift.id);
      if (!res) throw error;
      setSwapOptions(res);
      setSwapChoice(0);
      setError(false);
      setLoading(false);
    } catch (e: unknown) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void fetchData(), [fetchData]));

  const handleCreateRequest = async () => {
    if (reason.length === 0) {
      Alert.alert(t('shifts.alerts.missingReasonHead'), t('shifts.alerts.missingReasonMsg'));
    }

    if (requestType === 1) {
      if (leaveStart === null || leaveEnd === null) {
        Alert.alert(t('shifts.alerts.missingDateHead'), t('shifts.alerts.missingDateMsg'));
        return;
      }
      if (leaveStart < new Date()) {
        Alert.alert(t('shifts.alerts.invalidDateHead'), t('shifts.alerts.invalidDateMsg'));
        return;
      }
      if (leaveStart > leaveEnd) {
        Alert.alert(t('shifts.alerts.invalidDateHead'), t('shifts.alerts.invalidDateMsg'));
        return;
      }
    }

    if (requestType === 0) {
      if (swapChoice < 0 || swapChoice > swapOptions.length) {
        Alert.alert(t('shifts.alerts.invalidDateHead'), t('shifts.alerts.invalidDateHead'));
        return;
      }
    }

    if (shift === null) return;

    try {
      if (REQUEST_TYPES[requestType].id === 'SWAP') {
        const res = await createShiftRequest({
          type: REQUEST_TYPES[requestType].id,
          targetGuardId: swapOptions[swapChoice].acceptedBy.id,
          originalShiftId: swapOptions[swapChoice].id,
          replacementShiftId: null,
          leaveStartDate: leaveStart,
          leaveEndDate: leaveEnd,
          reason,
        });
        Alert.alert(t('shifts.alerts.requestCreated'), t('shifts.alerts.successMessage'));
      } else if (REQUEST_TYPES[requestType].id === 'LEAVE') {
        const res = await createShiftRequest({
          type: REQUEST_TYPES[requestType].id,
          targetGuardId: swapOptions[swapChoice].acceptedBy.id,
          originalShiftId: shift.id,
          replacementShiftId: swapOptions[swapChoice].id,
          leaveStartDate: leaveStart,
          leaveEndDate: leaveEnd,
          reason,
        });
        Alert.alert(t('shifts.alerts.requestCreated'), t('shifts.alerts.successMessage'));
      } else {
        Alert.alert(t('shifts.alerts.requestFailed'));
      }
    } catch {
      Alert.alert(t('shifts.alerts.requestFailed'));
    }

    onClose();
  };

  const openPicker = (kind: 'start' | 'end') => {
    setActivePicker(kind);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    if (!selected) return;

    if (activePicker === 'start') {
      setLeaveStart(selected);
    } else if (activePicker === 'end') {
      setLeaveEnd(selected);
    }

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        {!loading && (
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
                <Text
                  style={
                    REQUEST_TYPES[requestType].label
                      ? s.dropdownTextSelected
                      : s.dropdownTextPlaceholder
                  }
                >
                  {REQUEST_TYPES[requestType].label || t('shifts.selectRequestType')}
                </Text>
                <Text style={s.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View style={s.dropdownMenu}>
                  {REQUEST_TYPES.map((request) => (
                    <TouchableOpacity
                      key={request.id}
                      style={[
                        s.dropdownItem,
                        requestType === request.index && s.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setRequestType(request.index);
                        setShowDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          s.dropdownItemText,
                          requestType === request.index && s.dropdownItemTextSelected,
                        ]}
                      >
                        {request.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={s.modalHeaderRow}>
                <Text style={s.modalShiftHeader}>{t('shifts.reason')}</Text>
              </View>
              <TextInput
                style={s.modalInput}
                placeholder={t('shifts.reasonHint')}
                placeholderTextColor={colors.muted}
                keyboardType="default"
                returnKeyType="done"
                onChangeText={(s) => setReason(s)}
              />

              {requestType === 0 && (
                <View style={s.modalBody}>
                  <View style={s.modalHeaderRow}>
                    <Text style={s.modalShiftHeader}>{t('shifts.swapShift')}</Text>
                  </View>
                  {error || loading || swapOptions.length === 0 ? (
                    <TouchableOpacity style={s.dropdown}>
                      <Text style={s.dropdownTextError}>{t('shifts.swapOptionsError')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <TouchableOpacity
                        style={s.dropdown}
                        onPress={() => setShowSwapOptions(!showSwapOptions)}
                      >
                        <Text style={s.dropdownTextSelected}>
                          {swapOptions === null || swapOptions[swapChoice] === undefined
                            ? t('shifts.swapOptionsError')
                            : swapOptions[swapChoice].title}
                        </Text>
                        <Text style={s.dropdownIcon}>{showSwapOptions ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      {showSwapOptions && (
                        <View style={s.dropdownMenu}>
                          {swapOptions.map((choice, index) => (
                            <TouchableOpacity
                              key={choice.id}
                              style={[
                                s.dropdownItem,
                                swapChoice === index && s.dropdownItemSelected,
                              ]}
                              onPress={() => {
                                setSwapChoice(index);
                                setShowSwapOptions(false);
                              }}
                            >
                              <Text
                                style={[
                                  s.dropdownItemText,
                                  requestType === index && s.dropdownItemTextSelected,
                                ]}
                              >
                                {choice.title}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {!showSwapOptions && (
                        <View>
                          <View style={s.detailsRow}>
                            <Text style={s.detailsLabel}>{t('shifts.date')}</Text>
                            <Text style={s.detailsValue}>
                              {new Date(swapOptions[swapChoice].date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }) +
                                ' ' +
                                swapOptions[swapChoice].startTime +
                                ' - ' +
                                swapOptions[swapChoice].endTime}
                            </Text>
                          </View>
                          <View style={s.detailsRow}>
                            <Text style={s.detailsLabel}>{t('shifts.location')}</Text>
                            <Text style={s.detailsValue}>
                              {swapOptions[swapChoice].location.street}
                            </Text>
                          </View>
                          <View style={s.detailsRow}>
                            <Text style={s.detailsLabel}>{t('shifts.assignedGuard')}</Text>
                            <Text style={s.detailsValue}>
                              {swapOptions[swapChoice].acceptedBy.name}
                            </Text>
                          </View>
                          <View style={s.detailsRow}>
                            <Text style={s.detailsLabel}>{t('shifts.payRate')}</Text>
                            <Text style={s.detailsValue}>
                              {swapOptions[swapChoice].payRate + '/hour'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {requestType === 1 && (
                <View style={s.modalBody}>
                  <View style={s.modalHeaderRow}>
                    <Text style={s.modalShiftHeader}>{t('shifts.requestedTime')}</Text>
                  </View>
                  <View style={s.modalHeaderRow}>
                    <TouchableOpacity style={s.modalTimeInput} onPress={() => openPicker('start')}>
                      <Text style={s.modalTimeText}>
                        {leaveStart ? leaveStart.toDateString() : t('shifts.selectStart')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.modalTimeInput} onPress={() => openPicker('end')}>
                      <Text style={s.modalTimeText}>
                        {leaveEnd ? leaveEnd.toDateString() : t('shifts.selectEnd')}
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
                    activePicker === 'start' ? (leaveStart ?? new Date()) : (leaveEnd ?? new Date())
                  }
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePickerChange}
                />
              )}
            </View>
          </Pressable>
        )}
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
    dropdownTextError: {
      fontSize: 15,
      color: colors.status.rejected,
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
    detailsRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    detailsLabel: {
      fontSize: 13,
      color: colors.muted,
      width: 60,
    },
    detailsValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
  });
