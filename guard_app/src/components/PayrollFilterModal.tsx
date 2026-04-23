// src/components/PayrollFilterModal.tsx

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

export interface FilterPayrollProps {
  visible: boolean;
  onClose: () => void;
  onFilter: (
    start: Date,
    end: Date,
    period: string,
    guardId?: string,
    site?: string,
    department?: string,
  ) => void;
}

export default function PayRollFilterModal({ visible, onClose, onFilter }: FilterPayrollProps) {
  /*
  Check before Submission:
      - Conditional Types
      - Unused styles, functions, etc
      - Colours using hexcode not colors.whatever
      - ESLint warnings
      - Typos
      - Validation matches specification
      - Sort:
        - Imports
        - Constants
        - Functions
  */
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [department, setDepartment] = useState<string>('');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guardID, setGuardID] = useState<string>('');
  const [selectedPeriodType, setSelectedPeriodType] = useState<string>('');
  const [site, setSite] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);

  const PERIOD_TYPES = [
    { id: 'daily', label: t('payroll.types.daily') },
    { id: 'weekly', label: t('payroll.types.weekly') },
    { id: 'monthly', label: t('payroll.types.monthly') },
  ];
  const handleCancel = () => {
    resetState();
    onClose();
  };

  const handleFilter = () => {
    if (!startDate || !endDate || selectedPeriodType == '') {
      Alert.alert(t('payroll.missingAlertHead'), t('payroll.missingAlertMsg'));
      return;
    }

    if (startDate > endDate) {
      Alert.alert(t('payroll.invalidAlertHead'), t('payroll.invalidAlertMsg'));
      return;
    }

    onFilter(startDate, endDate, selectedPeriodType, guardID, site, department);
    resetState();
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
      setStartDate(selected);
    } else if (activePicker === 'end') {
      setEndDate(selected);
    }

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
  };

  const resetState = () => {
    setStartDate(null);
    setEndDate(null);
    setShowDropdown(false);
    setShowOptional(false);
    setSelectedPeriodType('');
  };

  const selectedPeriodTypeLabel = PERIOD_TYPES.find((pd) => pd.id === selectedPeriodType)?.label;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('payroll.filter')}</Text>

          <Text style={styles.label}>{t('payroll.startDateHead')}</Text>
          <TouchableOpacity style={styles.inputLike} onPress={() => openPicker('start')}>
            <Text>{startDate ? startDate.toDateString() : t('payroll.selectStart')}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t('payroll.endDateHead')}</Text>
          <TouchableOpacity style={styles.inputLike} onPress={() => openPicker('end')}>
            <Text>{endDate ? endDate.toDateString() : t('payroll.selectEnd')}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t('payroll.periodHead')}</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
            <Text
              style={
                selectedPeriodType ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder
              }
            >
              {selectedPeriodTypeLabel || t('payroll.selectPeriod')}
            </Text>
            <Text style={styles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {PERIOD_TYPES.map((periodType) => (
                <TouchableOpacity
                  key={periodType.id}
                  style={[
                    styles.dropdownItem,
                    selectedPeriodType === periodType.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPeriodType(periodType.id);
                    setShowDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedPeriodType === periodType.id && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {periodType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.optionalSelect}
            onPress={() => setShowOptional(!showOptional)}
          >
            <Text style={styles.label}>{t('payroll.optional')}</Text>
            <Text style={styles.dropdownIcon}>{showOptional ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <View style={showOptional ? styles.optionalSectionShow : styles.optionalSectionGone}>
            <Text style={styles.label}>{t('payroll.ID')}</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              returnKeyType="done"
              onChangeText={(s) => setGuardID(s)}
            />

            <Text style={styles.label}>{t('payroll.siteHead')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('payroll.siteHint')}
              placeholderTextColor={colors.muted}
              keyboardType="default"
              returnKeyType="done"
              onChangeText={(s) => setSite(s)}
            />

            <Text style={styles.label}>{t('payroll.departmentHead')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('payroll.departmentHint')}
              placeholderTextColor={colors.muted}
              keyboardType="default"
              returnKeyType="done"
              onChangeText={(s) => setDepartment(s)}
            />
          </View>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>{t('payroll.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleFilter}>
              <Text style={styles.primaryButtonText}>{t('payroll.filter')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activePicker && (
          <DateTimePicker
            value={
              activePicker === 'start'
                ? (startDate ?? new Date())
                : activePicker === 'end'
                  ? (endDate ?? new Date())
                  : (endDate ?? new Date())
            }
            mode={'date'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
          />
        )}
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      padding: 16,
    },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    label: { fontWeight: '600', marginBottom: 4 },
    inputLike: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 12,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    column: { flex: 1 },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
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
    input: {
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    optionalSelect: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: 7,
    },
    optionalSectionGone: {
      display: 'none',
    },
    optionalSectionShow: {
      marginHorizontal: 13,
    },
    buttonsRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end', gap: 8 },
    primaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#003f88',
    },
    primaryButtonText: { color: '#fff', fontWeight: '600' },
    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#f5f5f5',
    },
    secondaryButtonText: { color: '#333', fontWeight: '500' },
  });
