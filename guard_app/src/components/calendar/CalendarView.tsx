// components/calender/CalendarView.tsx
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppColors } from '../../theme/colors';

const { width } = Dimensions.get('window');

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

type Props<T extends { id: string; date: string; title: string; status?: string }> = {
  shifts: T[];
  onShiftPress: (shift: T) => void;
  colors: AppColors;
};

function CalendarView<T extends { id: string; date: string; title: string; status?: string }>({
  shifts,
  onShiftPress,
  colors,
}: Props<T>) {
  const s = getStyles(colors);
  const { t } = useTranslation();
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const gridStart = addDays(monthStart, -startWeekday);

  const totalCells = 42;
  const allCells = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, T[]>();
    shifts.forEach((shift) => {
      const key = dateKeyLocal(new Date(shift.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shift);
    });
    return map;
  }, [shifts]);

  const monthLabel = monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const getStatusColor = (status?: string) => {
    if (status === 'Confirmed') return colors.status.confirmed;
    if (status === 'Pending') return colors.link;
    if (status === 'Available') return colors.primary;
    return colors.muted;
  };

  return (
    <View style={s.calendarContainer}>
      <View style={s.calHeader}>
        <Text style={s.calMonthText}>{monthLabel}</Text>
        <View style={s.calNavButtons}>
          <TouchableOpacity
            onPress={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
            }
            style={s.calNavBtn}
          >
            <Text style={s.calNavBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
            }
            style={s.calNavBtn}
          >
            <Text style={s.calNavBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.calWeekHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <View key={i} style={s.calWeekCell}>
            <Text style={s.calWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={s.calGrid}>
        {allCells.map((d, idx) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const key = dateKeyLocal(d);
          const dayShifts = shiftsByDate.get(key) || [];
          const hasShifts = dayShifts.length > 0;

          return (
            <TouchableOpacity
              key={idx}
              style={[s.calDayCell, !inMonth && s.calDayCellDim]}
              onPress={() => hasShifts && onShiftPress(dayShifts[0])}
              disabled={!hasShifts}
            >
              <Text style={[s.calDayNumber, !inMonth && s.calDayNumberDim]}>{d.getDate()}</Text>
              {hasShifts && (
                <View style={s.calShiftIndicators}>
                  {dayShifts.slice(0, 3).map((shift, i) => (
                    <View
                      key={i}
                      style={[s.calShiftDot, { backgroundColor: getStatusColor(shift.status) }]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.calLegend}>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.primary }]} />
          <Text style={s.calLegendText}>{t('shifts.available')}</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.link }]} />
          <Text style={s.calLegendText}>{t('shifts.applied')}</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.status.confirmed }]} />
          <Text style={s.calLegendText}>{t('shifts.accepted')}</Text>
        </View>
        <View style={s.calLegendItem}>
          <View style={[s.calLegendDot, { backgroundColor: colors.muted }]} />
          <Text style={s.calLegendText}>{t('shifts.completed')}</Text>
        </View>
      </View>
    </View>
  );
}

export default CalendarView;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    calendarContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    calMonthText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    calNavButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    calNavBtn: {
      width: 32,
      height: 32,
      backgroundColor: colors.primarySoft,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calNavBtnText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    calWeekHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    calWeekCell: {
      flex: 1,
      alignItems: 'center',
    },
    calWeekText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    calGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    calDayCell: {
      width: (width - 32 - 16 * 2 - 24) / 7,
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      backgroundColor: colors.card,
    },
    calDayCellDim: {
      opacity: 0.3,
    },
    calDayNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    calDayNumberDim: {
      color: colors.muted,
    },
    calShiftIndicators: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 4,
    },
    calShiftDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    calLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexWrap: 'wrap',
    },
    calLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    calLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    calLegendText: {
      fontSize: 12,
      color: colors.muted,
    },
  });
