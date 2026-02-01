// guard_app/src/screen/AvailabilityScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { getMe } from '../api/auth';
import { getAvailability, upsertAvailability, type AvailabilityData } from '../api/availability';
import AddAvailabilityModal from '../components/AddAvailabilityModal';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

type ViewMode = 'simple' | 'weekly' | 'monthly';

function extractTimeSlots(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const maybe = (data as { timeSlots?: unknown }).timeSlots;
  return Array.isArray(maybe) ? maybe.filter((x): x is string => typeof x === 'string') : [];
}

export default function AvailabilityScreen() {
  // Simple mode state (existing)
  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Calendar mode state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('17:00');

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Helper functions
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

  const parseTimeRange = (slot: string) => {
    const [start, end] = slot.split('-');
    if (!start || !end) return null;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    if ([startHour, startMin, endHour, endMin].some((n) => Number.isNaN(n))) return null;
    return {
      startMinutes: startHour * 60 + startMin,
      endMinutes: endHour * 60 + endMin,
    };
  };

  const persistAvailability = async (
    nextDays: string[],
    nextTimeSlots: string[],
    options?: { showSuccess?: boolean },
  ) => {
    if (!userId) {
      Alert.alert('Error', 'User not loaded');
      return false;
    }

    if (nextDays.length === 0 || nextTimeSlots.length === 0) {
      Alert.alert('Validation', 'Please select at least one day and one time slot.');
      return false;
    }

    try {
      setSaving(true);
      const payload: AvailabilityData = { userId, days: nextDays, timeSlots: nextTimeSlots };
      await upsertAvailability(payload);
      if (options?.showSuccess) {
        Alert.alert('Success', 'Availability saved');
      }
      return true;
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save availability');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Load simple availability
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Real mode - load from API
        const me = await getMe();
        const id = me?._id ?? me?.id;
        if (!id) throw new Error('Unable to determine user ID');
        setUserId(id);

        // Load simple availability
        const data = await getAvailability(id);
        if (data) {
          setDays(Array.isArray(data.days) ? data.days : []);
          setTimeSlots(extractTimeSlots(data));
        }

      } catch (e) {
        console.error(e);
        setError('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // Simple mode functions (existing)
  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
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

  // Calendar mode functions (new)
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
      Alert.alert('Error', 'Please enter both start and end times');
      return;
    }

    if (fromTime >= toTime) {
      Alert.alert('Error', 'End time must be after start time');
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
    Alert.alert('Remove', 'Remove this time slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const nextTimeSlots = timeSlots.filter((s) => s !== slotLabel);
          if (nextTimeSlots.length === 0) {
            Alert.alert('Validation', 'Please keep at least one time slot.');
            return;
          }

          setTimeSlots(nextTimeSlots);
          await persistAvailability(days, nextTimeSlots);
        },
      },
    ]);
  };

  // Navigation
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

  // Render functions
  const renderSimpleMode = () => (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.sectionTitle}>Days you are available</Text>
      <View style={styles.daysRow}>
        {WEEK_DAYS.map((day) => {
          const selected = days.includes(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => toggleDay(day)}
            >
              <Text style={selected ? styles.dayChipTextSelected : styles.dayChipText}>
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Time slots</Text>

      {timeSlots.length === 0 ? (
        <Text style={styles.helperTextMuted}>No time slots added yet.</Text>
      ) : (
        timeSlots.map((slot) => (
          <View key={slot} style={styles.slotRow}>
            <Text style={styles.slotItem}>• {slot}</Text>
            <TouchableOpacity onPress={() => handleRemoveSlot(slot)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>Add availability</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.secondaryButton} onPress={clearSlots}>
          <Text style={styles.secondaryButtonText}>Clear slots</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.saveButtonWrapper}>
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save Availability'}</Text>
        </TouchableOpacity>
      </View>

      <AddAvailabilityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddSlot={handleAddSlot}
      />
    </View>
  );

  const renderWeeklyMode = () => (
    <ScrollView style={styles.calendarContainer}>
      <View style={styles.weekHeader}>
        {weekDays.map((day, idx) => (
          <View key={idx} style={styles.weekDay}>
            <Text style={styles.weekDayName}>{SHORT_DAYS[idx]}</Text>
            <Text style={styles.weekDayDate}>{day.getDate()}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.timeGrid}>
        {TIME_SLOTS.map((hour) => (
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
        <Text style={styles.slotsSummaryTitle}>This Week's Availability</Text>
        {weekDays.map((day, idx) => {
          const daySlots = getSlotsForDate(day);
          if (daySlots.length === 0) return null;

          return (
            <View key={idx} style={styles.daySummary}>
              <Text style={styles.daySummaryDay}>
                {SHORT_DAYS[idx]} {day.getDate()}
              </Text>
              {daySlots.map((slot) => (
                <View key={slot} style={styles.slotItemRow}>
                  <Text style={styles.slotTime}>{slot}</Text>
                  <TouchableOpacity onPress={() => handleRemoveCalendarSlot(slot)}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderMonthlyMode = () => (
    <ScrollView style={styles.calendarContainer}>
      <View style={styles.monthGrid}>
        <View style={styles.monthWeekHeader}>
          {SHORT_DAYS.map((day, idx) => (
            <View key={idx} style={styles.monthWeekDay}>
              <Text style={styles.monthWeekDayText}>{day}</Text>
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading availability…</Text>
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
      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'simple' && styles.toggleBtnActive]}
          onPress={() => setViewMode('simple')}
        >
          <Text style={[styles.toggleText, viewMode === 'simple' && styles.toggleTextActive]}>
            Simple
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation (for calendar views) */}
      {viewMode !== 'simple' && (
        <View style={styles.navigation}>
          <TouchableOpacity onPress={goToPrevious} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>

          <Text style={styles.navDate}>{headerDate}</Text>

          <TouchableOpacity onPress={goToNext} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content based on view mode */}
      {viewMode === 'simple' && renderSimpleMode()}
      {viewMode === 'weekly' && renderWeeklyMode()}
      {viewMode === 'monthly' && renderMonthlyMode()}

      {/* Calendar Add Modal */}
      <Modal visible={showCalendarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Availability</Text>

            {selectedDate && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Date</Text>
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
              <Text style={styles.modalLabel}>From</Text>
              <TextInput
                style={styles.modalInput}
                value={fromTime}
                onChangeText={setFromTime}
                placeholder="09:00"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>To</Text>
              <TextInput
                style={styles.modalInput}
                value={toTime}
                onChangeText={setToTime}
                placeholder="17:00"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setShowCalendarModal(false);
                  setSelectedDate(null);
                  setFromTime('09:00');
                  setToTime('17:00');
                }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnAdd}
                onPress={handleAddCalendarSlot}
                disabled={saving}
              >
                <Text style={styles.modalBtnAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8 },
  errorText: { color: 'red', marginBottom: 12 },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4,
    margin: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#003f88' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#FFFFFF' },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 24, fontWeight: '600', color: '#003f88' },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginLeft: 8,
  },
  todayBtnText: { fontSize: 14, fontWeight: '600', color: '#003f88' },
  navDate: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#111827' },

  // Simple Mode (existing)
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  helperTextMuted: { color: '#888', marginBottom: 8 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dayChipSelected: { backgroundColor: '#e3ecff', borderColor: '#003f88' },
  dayChipText: { color: '#000' },
  dayChipTextSelected: { color: '#003f88', fontWeight: '600' },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  slotItem: { color: '#111' },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e11d48',
    backgroundColor: '#fef2f2',
  },
  removeButtonText: { color: '#b91c1c', fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  spacer: { width: 8 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#003f88',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  saveButtonWrapper: { marginTop: 24 },

  // Calendar Views
  calendarContainer: { flex: 1 },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  weekDayName: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  weekDayDate: { fontSize: 16, fontWeight: '700', color: '#111827' },
  timeGrid: { flex: 1 },
  timeRow: { flexDirection: 'row', height: 60, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  timeLabel: { width: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  timeLabelText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  timeCell: { flex: 1, borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  timeCellFilled: { backgroundColor: '#E0F2FE' },
  slotIndicator: { flex: 1, backgroundColor: '#003f88', opacity: 0.3 },
  slotsSummary: { backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  slotsSummaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  daySummary: { marginBottom: 16 },
  daySummaryDay: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  slotItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 4,
  },
  slotTime: { fontSize: 14, color: '#111827', fontWeight: '500' },

  // Monthly View
  monthGrid: { backgroundColor: '#FFFFFF', padding: 8 },
  monthWeekHeader: { flexDirection: 'row', marginBottom: 8 },
  monthWeekDay: { flex: 1, alignItems: 'center' },
  monthWeekDayText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  monthDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
  },
  monthDayDim: { opacity: 0.3 },
  monthDayToday: { backgroundColor: '#E0F2FE' },
  monthDayNumber: { fontSize: 14, fontWeight: '600', color: '#111827' },
  monthDayNumberDim: { color: '#9CA3AF' },
  monthDayNumberToday: { color: '#003f88' },
  monthSlotIndicators: { flexDirection: 'row', gap: 2, marginTop: 4 },
  monthSlotDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#003f88' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  modalValue: { fontSize: 16, color: '#111827', fontWeight: '500' },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalBtnCancelText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  modalBtnAdd: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#003f88',
  },
  modalBtnAddText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
