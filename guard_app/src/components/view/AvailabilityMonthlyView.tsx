import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '../../theme/colors';

type MonthDay = {
  date: Date;
  inMonth: boolean;
};

type Props = {
  monthDays: MonthDay[];
  formatDate: (date: Date) => string;
  getSlotsForDate: (date: Date) => string[];
  setSelectedDate: (date: Date | null) => void;
  setShowCalendarModal: (visible: boolean) => void;
  getLocalizedDay: (dayEn: string, short?: boolean) => string;
  colors: AppColors;
  t: (key: string) => string;
};

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AvailabilityMonthlyView({
  monthDays,
  formatDate,
  getSlotsForDate,
  setSelectedDate,
  setShowCalendarModal,
  getLocalizedDay,
  colors,
}: Props) {
  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.calendarContainer}>
      <View style={styles.monthGrid}>
        <View style={styles.monthWeekHeader}>
          {SHORT_DAYS.map((_, idx) => (
            <View key={idx} style={styles.monthWeekDay}>
              <Text style={styles.monthWeekDayText}>{getLocalizedDay(WEEK_DAYS[idx], true)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.monthDaysGrid}>
          {monthDays.map((dayObj, idx) => {
            const daySlots = getSlotsForDate(dayObj.date);
            const hasSlots = daySlots.length > 0;
            const isToday = formatDate(dayObj.date) === formatDate(new Date());

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.monthDay,
                  !dayObj.inMonth && styles.monthDayDim,
                  isToday && styles.monthDayToday,
                ]}
                onPress={() => {
                  setSelectedDate(dayObj.date);
                  setShowCalendarModal(true);
                }}
              >
                <Text
                  style={[
                    styles.monthDayNumber,
                    !dayObj.inMonth && styles.monthDayNumberDim,
                    isToday && styles.monthDayNumberToday,
                  ]}
                >
                  {dayObj.date.getDate()}
                </Text>

                {hasSlots && (
                  <View style={styles.monthSlotIndicators}>
                    {daySlots.slice(0, 3).map((slot) => (
                      <View key={slot} style={styles.monthSlotDot} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
    monthGrid: {
      backgroundColor: colors.card,
      padding: 8,
    },
    monthWeekHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    monthWeekDay: {
      flex: 1,
      alignItems: 'center',
    },
    monthWeekDayText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    monthDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    monthDay: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      backgroundColor: colors.card,
    },
    monthDayDim: {
      opacity: 0.3,
    },
    monthDayToday: {
      backgroundColor: colors.primarySoft,
    },
    monthDayNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    monthDayNumberDim: {
      color: colors.muted,
    },
    monthDayNumberToday: {
      color: colors.primary,
    },
    monthSlotIndicators: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 4,
    },
    monthSlotDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
  });
