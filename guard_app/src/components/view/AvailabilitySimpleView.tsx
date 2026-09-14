import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AddAvailabilityModal from '../modal/AddAvailabilityModal';

import type { AppColors } from '../../theme/colors';

type Props = {
  error: string | null;
  days: string[];
  timeSlots: string[];
  saving: boolean;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  toggleDay: (day: string) => void;
  handleRemoveSlot: (slot: string) => void;
  clearSlots: () => void;
  handleSave: () => void;
  handleAddSlot: (dayName: string, slotLabel: string) => void;
  getLocalizedDay: (dayEn: string, short?: boolean) => string;
  getOrderedShortDays: () => React.ReactNode;
  weekDays: string[];
  colors: AppColors;
  t: (key: string) => string;
};

export default function AvailabilitySimpleView({
  error,
  days,
  timeSlots,
  saving,
  modalVisible,
  setModalVisible,
  toggleDay,
  handleRemoveSlot,
  clearSlots,
  handleSave,
  handleAddSlot,
  getLocalizedDay,
  getOrderedShortDays,
  weekDays,
  colors,
  t,
}: Props) {
  const styles = getStyles(colors);

  const hoursToday = Math.floor(Math.random() * 16);
  const hoursWeek = Math.floor(Math.random() * 50);
  const shiftsWeek = Math.floor(Math.random() * 10);
  let mockWarning = '';
  // Mock warning - base actual warning off of the warning given by the backend
  if (hoursToday > 10) {
    mockWarning = t('avail.dayHourWarn');
  }
  if (shiftsWeek > 7) {
    mockWarning = t('avail.weekShiftWarn');
  }
  if (hoursWeek > 38) {
    mockWarning = t('avail.weekHourWarn');
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.insightCard}>
        <View style={styles.insightColumn}>
          <Text style={styles.insightTitle}>{t('avail.hoursToday')}</Text>
          <Text style={styles.insightNumber}>{hoursToday}</Text>
        </View>
        <View style={styles.insightColumn}>
          <Text style={styles.insightTitle}>{t('avail.hoursWeek')}</Text>
          <Text style={styles.insightNumber}>{hoursWeek}</Text>
        </View>
        <View style={styles.insightColumn}>
          <Text style={styles.insightTitle}>{t('avail.shiftsWeek')}</Text>
          <Text style={styles.insightNumber}>{shiftsWeek}</Text>
        </View>
      </View>

      {mockWarning.length > 0 && (
        <View style={styles.warnginCard}>
          <Text style={styles.warningText}>{mockWarning}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('avail.daysAvailable')}</Text>
      <View style={styles.daysRow}>
        {weekDays.map((day) => {
          const selected = days.includes(day);
          return (
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={getLocalizedDay(day)}
              key={day}
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => toggleDay(day)}
            >
              <Text style={selected ? styles.dayChipTextSelected : styles.dayChipText}>
                {getLocalizedDay(day, true)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{t('avail.timeSlots')}</Text>

      {timeSlots.length === 0 ? (
        <Text style={styles.helperTextMuted}>{t('avail.noSlotsAdded')}</Text>
      ) : (
        timeSlots.map((slot) => (
          <View key={slot} style={styles.slotRow}>
            <Text style={styles.slotItem}>
              • {getOrderedShortDays()} - {slot}
            </Text>
            <TouchableOpacity onPress={() => handleRemoveSlot(slot)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>{t('avail.removeBtn')}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>{t('avail.addAvailability')}</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.secondaryButton} onPress={clearSlots}>
          <Text style={styles.secondaryButtonText}>{t('avail.clearSlots')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.saveButtonWrapper}>
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? t('avail.saving') : t('avail.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <AddAvailabilityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddSlot={handleAddSlot}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.bg,
    },
    errorText: {
      color: colors.status.rejected,
      marginBottom: 12,
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    insightColumn: {
      width: '33.33%',
      alignItems: 'center',
      flexDirection: 'column',
    },
    insightTitle: {
      fontSize: 16,
      textAlign: 'center',
    },
    insightNumber: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    warnginCard: {
      backgroundColor: colors.status.rejected,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    warningText: {
      color: colors.white,
      fontWeight: 'bold',
      textAlign: 'center',
    },

    sectionTitle: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 8,
      color: colors.text,
    },
    helperTextMuted: {
      color: colors.muted,
      marginBottom: 8,
    },
    daysRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    dayChip: {
      paddingHorizontal: 8.35,
      paddingVertical: 6,
      borderRadius: 8,
      marginHorizontal: 3,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    dayChipSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    dayChipText: {
      color: '#000',
    },
    dayChipTextSelected: {
      color: '#003f88',
      fontWeight: '600',
    },
    slotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 16,
      elevation: 2,
    },
    slotItem: {
      color: colors.text,
      flex: 1,
    },
    removeButton: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.status.rejected,
      backgroundColor: colors.card,
    },
    removeButtonText: {
      color: colors.status.rejected,
      fontSize: 12,
      fontWeight: '600',
    },
    actionsRow: {
      flexDirection: 'row',
      marginTop: 12,
    },
    spacer: {
      width: 8,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: colors.white,
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    saveButtonWrapper: {
      marginTop: 24,
      height: 44,
    },
  });
