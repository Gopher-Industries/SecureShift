import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '../../theme/colors';

type Props = {
  weekDays: Date[];
  timeSlotsRange: number[];
  getSlotsForDate: (date: Date) => string[];
  getLocalizedDay: (dayEn: string, short?: boolean) => string;
  setSelectedDate: (date: Date | null) => void;
  setShowCalendarModal: (visible: boolean) => void;
  handleRemoveCalendarSlot: (slotLabel: string) => void;
  colors: AppColors;
  t: (key: string) => string;
};

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseTimeRange(slot: string) {
  const [start, end] = slot.split('-');
  if (!start || !end) return null;

  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  if ([startHour, startMin, endHour, endMin].some((n) => Number.isNaN(n))) {
    return null;
  }

  return {
    startMinutes: startHour * 60 + startMin,
    endMinutes: endHour * 60 + endMin,
  };
}

export default function AvailabilityWeeklyView({
  weekDays,
  timeSlotsRange,
  getSlotsForDate,
  getLocalizedDay,
  setSelectedDate,
  setShowCalendarModal,
  handleRemoveCalendarSlot,
  colors,
  t,
}: Props) {
  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.calendarContainer}>
      <View style={styles.weekHeader}>
        {weekDays.map((day, idx) => (
          <View key={idx} style={styles.weekDay}>
            <Text style={styles.weekDayName}>
              {getLocalizedDay(WEEK_DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1], true)}
            </Text>
            <Text style={styles.weekDayDate}>{day.getDate()}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.timeGrid}>
        {timeSlotsRange.map((hour) => (
          <View key={hour} style={styles.timeRow}>
            <View style={styles.timeLabel}>
              <Text style={styles.timeLabelText}>{hour.toString().padStart(2, '0')}:00</Text>
            </View>

            {weekDays.map((day, idx) => {
              const daySlots = getSlotsForDate(day);
              const hourStartMinutes = hour * 60;
              const hourEndMinutes = hour * 60 + 60;

              const hasSlot = daySlots.some((slot) => {
                const range = parseTimeRange(slot);
                if (!range) return false;
                return range.startMinutes < hourEndMinutes && range.endMinutes > hourStartMinutes;
              });

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.timeCell, hasSlot && styles.timeCellFilled]}
                  onPress={() => {
                    setSelectedDate(day);
                    setShowCalendarModal(true);
                  }}
                >
                  {hasSlot && <View style={styles.slotIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.slotsSummary}>
        <Text style={styles.slotsSummaryTitle}>{t('avail.thisWeek')}</Text>

        {weekDays.map((day, idx) => {
          const daySlots = getSlotsForDate(day);
          if (daySlots.length === 0) return null;

          return (
            <View key={idx} style={styles.daySummary}>
              <Text style={styles.daySummaryDay}>
                {getLocalizedDay(WEEK_DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1], true)}{' '}
                {day.getDate()}
              </Text>

              {daySlots.map((slot) => (
                <View key={slot} style={styles.slotItemRow}>
                  <Text style={styles.slotTime}>{slot}</Text>
                  <TouchableOpacity onPress={() => handleRemoveCalendarSlot(slot)}>
                    <Text style={styles.removeButtonText}>{t('avail.removeBtn')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    calendarContainer: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    weekHeader: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    weekDay: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    },
    weekDayName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 4,
    },
    weekDayDate: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    timeGrid: {
      flex: 1,
    },
    timeRow: {
      flexDirection: 'row',
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timeLabel: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    timeLabelText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '500',
    },
    timeCell: {
      flex: 1,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      backgroundColor: colors.card,
    },
    timeCellFilled: {
      backgroundColor: colors.primarySoft,
    },
    slotIndicator: {
      flex: 1,
      backgroundColor: colors.primary,
      opacity: 0.3,
    },
    slotsSummary: {
      backgroundColor: colors.card,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    slotsSummaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    daySummary: {
      marginBottom: 16,
    },
    daySummaryDay: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 8,
    },
    slotItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.primarySoft,
      borderRadius: 6,
      marginBottom: 4,
    },
    slotTime: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    removeButtonText: {
      color: colors.status.rejected,
      fontSize: 12,
      fontWeight: '600',
    },
  });
