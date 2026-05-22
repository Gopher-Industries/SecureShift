// guard_app/src/screen/AvailabilityScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { getMe } from '../api/auth';
import { getAvailability, upsertAvailability, type AvailabilityData } from '../api/availability';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';
import AvailabilitySimpleView from '../components/view/AvailabilitySimpleView';
import AvailabilityWeeklyView from '../components/view/AvailabilityWeeklyView';
import AvailabilityMonthlyView from '../components/view/AvailabilityMonthlyView';
import AvailabilityCalendarModal from '../components/calendar/AvailabilityCalendarModal';
import AvailabilityViewToggle from '../components/toggle/AvailabilityViewToggle';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6);

type ViewMode = 'simple' | 'weekly' | 'monthly';

function extractTimeSlots(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const maybe = (data as { timeSlots?: unknown }).timeSlots;
  return Array.isArray(maybe) ? maybe.filter((x): x is string => typeof x === 'string') : [];
}

export default function AvailabilityScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const getLocalizedDay = (dayEn: string, short = false) => {
    switch (dayEn) {
      case 'Monday':
        return short ? t('avail.mon') : t('avail.monFull');
      case 'Tuesday':
        return short ? t('avail.tue') : t('avail.tueFull');
      case 'Wednesday':
        return short ? t('avail.wed') : t('avail.wedFull');
      case 'Thursday':
        return short ? t('avail.thu') : t('avail.thuFull');
      case 'Friday':
        return short ? t('avail.fri') : t('avail.friFull');
      case 'Saturday':
        return short ? t('avail.sat') : t('avail.satFull');
      case 'Sunday':
        return short ? t('avail.sun') : t('avail.sunFull');
      default:
        return dayEn;
    }
  };

  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('17:00');

  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getDayName = (date: Date) => {
    return WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const persistAvailability = async (
    nextDays: string[],
    nextTimeSlots: string[],
    options?: { showSuccess?: boolean },
  ) => {
    if (!userId) {
      Alert.alert(t('avail.errorText'), t('avail.userNotLoaded'));
      return false;
    }

    if (nextDays.length === 0 || nextTimeSlots.length === 0) {
      Alert.alert(t('avail.validation'), t('avail.selectOneMsg'));
      return false;
    }

    try {
      setSaving(true);
      const payload: AvailabilityData = { userId, days: nextDays, timeSlots: nextTimeSlots };
      await upsertAvailability(payload);
      if (options?.showSuccess) {
        Alert.alert(t('docs.success') || 'Success', t('avail.savedSuccess'));
      }
      return true;
    } catch (e) {
      console.error(e);
      Alert.alert(t('avail.errorText'), t('avail.saveFailed'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await getMe();
        const id = me?._id ?? me?.id;
        if (!id) throw new Error(t('avail.determineIdFailed'));
        setUserId(id);

        const data = await getAvailability(id);
        if (data) {
          setDays(Array.isArray(data.days) ? data.days : []);
          setTimeSlots(extractTimeSlots(data));
        }
      } catch (e) {
        console.error(e);
        setError(t('avail.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const getOrderedShortDays = () => {
    const orderedShortDays = [];
    for (let i = 0; i < WEEK_DAYS.length; i++) {
      if (days.includes(WEEK_DAYS[i])) orderedShortDays.push(getLocalizedDay(WEEK_DAYS[i], true));
    }
    return <Text>{orderedShortDays.join(' ')}</Text>;
  };

  const clearSlots = () => {
    setTimeSlots([]);
  };

  const handleAddSlot = (dayName: string, slotLabel: string) => {
    setDays((prev) => (prev.includes(dayName) ? prev : [...prev, dayName]));
    setTimeSlots((prev) => (prev.includes(slotLabel) ? prev : [...prev, slotLabel]));
  };

  const handleRemoveSlot = (slotLabel: string) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slotLabel));
  };

  const handleSave = async () => {
    await persistAvailability(days, timeSlots, { showSuccess: true });
  };

  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = getMonthStart(currentDate);
    const end = getMonthEnd(currentDate);
    const startDay = start.getDay();
    const gridStart = addDays(start, -(startDay === 0 ? 6 : startDay - 1));

    return Array.from({ length: 42 }, (_, i) => {
      const day = addDays(gridStart, i);
      return { date: day, inMonth: day >= start && day <= end };
    });
  }, [currentDate]);

  const getSlotsForDate = (date: Date) => {
    const dayName = getDayName(date);
    if (!days.includes(dayName)) return [];
    return timeSlots;
  };

  const handleAddCalendarSlot = async () => {
    if (!selectedDate) return;

    if (!fromTime || !toTime) {
      Alert.alert(t('avail.errorText'), t('avail.enterStartEnd'));
      return;
    }

    const convertToMinutes = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };

    if (convertToMinutes(fromTime) >= convertToMinutes(toTime)) {
      Alert.alert(t('avail.errorText'), t('avail.endAfterStart'));
      return;
    }

    const dayName = getDayName(selectedDate);
    const slotLabel = `${fromTime}-${toTime}`;
    const nextDays = days.includes(dayName) ? days : [...days, dayName];
    const nextTimeSlots = timeSlots.includes(slotLabel) ? timeSlots : [...timeSlots, slotLabel];
    setDays(nextDays);
    setTimeSlots(nextTimeSlots);

    const saved = await persistAvailability(nextDays, nextTimeSlots, { showSuccess: true });
    if (!saved) return;

    setShowCalendarModal(false);
    setFromTime('09:00');
    setToTime('17:00');
    setSelectedDate(null);
  };

  const handleRemoveCalendarSlot = async (slotLabel: string) => {
    Alert.alert(t('avail.removeTitle'), t('avail.removeMsg'), [
      { text: t('avail.cancel'), style: 'cancel' },
      {
        text: t('avail.removeBtn'),
        style: 'destructive',
        onPress: async () => {
          const nextTimeSlots = timeSlots.filter((s) => s !== slotLabel);
          if (nextTimeSlots.length === 0) {
            Alert.alert(t('avail.validation'), t('avail.keepOneSlot'));
            return;
          }

          setTimeSlots(nextTimeSlots);
          await persistAvailability(days, nextTimeSlots);
        },
      },
    ]);
  };

  const goToPrevious = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(addDays(currentDate, -7));
    } else if (viewMode === 'monthly') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(addDays(currentDate, 7));
    } else if (viewMode === 'monthly') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>{t('avail.loading')}</Text>
      </View>
    );
  }

  const headerDate =
    viewMode === 'weekly'
      ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : viewMode === 'monthly'
        ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

  return (
    <View style={styles.fullContainer}>
      <AvailabilityViewToggle viewMode={viewMode} onChange={setViewMode} colors={colors} t={t} />

      {viewMode !== 'simple' && (
        <View style={styles.navigation}>
          <TouchableOpacity onPress={goToPrevious} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>{t('avail.today')}</Text>
          </TouchableOpacity>

          <Text style={styles.navDate}>{headerDate}</Text>

          <TouchableOpacity onPress={goToNext} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'simple' && (
        <AvailabilitySimpleView
          error={error}
          days={days}
          timeSlots={timeSlots}
          saving={saving}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          toggleDay={toggleDay}
          handleRemoveSlot={handleRemoveSlot}
          clearSlots={clearSlots}
          handleSave={handleSave}
          handleAddSlot={handleAddSlot}
          getLocalizedDay={getLocalizedDay}
          getOrderedShortDays={getOrderedShortDays}
          weekDays={WEEK_DAYS}
          colors={colors}
          t={t}
        />
      )}
      {viewMode === 'weekly' && (
        <AvailabilityWeeklyView
          weekDays={weekDays}
          timeSlotsRange={TIME_SLOTS}
          getSlotsForDate={getSlotsForDate}
          getLocalizedDay={getLocalizedDay}
          setSelectedDate={setSelectedDate}
          setShowCalendarModal={setShowCalendarModal}
          handleRemoveCalendarSlot={handleRemoveCalendarSlot}
          colors={colors}
          t={t}
        />
      )}
      {viewMode === 'monthly' && (
        <AvailabilityMonthlyView
          monthDays={monthDays}
          formatDate={formatDate}
          getSlotsForDate={getSlotsForDate}
          setSelectedDate={setSelectedDate}
          setShowCalendarModal={setShowCalendarModal}
          getLocalizedDay={getLocalizedDay}
          colors={colors}
          t={t}
        />
      )}

      <AvailabilityCalendarModal
        visible={showCalendarModal}
        selectedDate={selectedDate}
        fromTime={fromTime}
        toTime={toTime}
        setFromTime={setFromTime}
        setToTime={setToTime}
        onClose={() => {
          setShowCalendarModal(false);
          setSelectedDate(null);
          setFromTime('09:00');
          setToTime('17:00');
        }}
        onAdd={handleAddCalendarSlot}
        saving={saving}
        colors={colors}
        t={t}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    fullContainer: { flex: 1, backgroundColor: colors.bg },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    loadingText: { marginTop: 8, color: colors.text },
    errorText: { color: colors.status.rejected, marginBottom: 12 },

    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    navBtnText: { fontSize: 24, fontWeight: '600', color: colors.primary },
    todayBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primarySoft,
      borderRadius: 6,
      marginLeft: 8,
    },
    todayBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    navDate: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.text },
  });
