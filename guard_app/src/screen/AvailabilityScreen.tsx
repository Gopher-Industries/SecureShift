// guard_app/src/screen/AvailabilityScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { getMe } from '../api/auth';
import { getAvailability, upsertAvailability, type AvailabilityData } from '../api/availability';
import AddAvailabilityModal from '../components/AddAvailabilityModal';

/* ✅ DEV MOCK TO BYPASS BACKEND */
const DEV_MOCK_AVAILABILITY = __DEV__ && true;

// IMPORTANT: days must match WEEK_DAYS values (full names), because the UI checks days.includes(day)
const mockAvailability: { days: string[]; timeSlots: string[] } = {
  days: ['Monday', 'Wednesday'],
  timeSlots: ['Monday 09:00 - 17:00', 'Wednesday 10:00 - 14:00'],
};

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function extractTimeSlots(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const maybe = (data as { timeSlots?: unknown }).timeSlots;
  return Array.isArray(maybe) ? maybe.filter((x): x is string => typeof x === 'string') : [];
}

export default function AvailabilityScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ MOCK MODE: never call backend
        if (DEV_MOCK_AVAILABILITY) {
          setUserId('dev-user');
          setDays(mockAvailability.days);
          setTimeSlots(mockAvailability.timeSlots);
          return;
        }

        // ✅ REAL MODE
        const me = await getMe();
        const id = me?._id ?? me?.id;
        if (!id) throw new Error('Unable to determine user ID');

        setUserId(id);

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
    if (!userId) {
      Alert.alert('Error', 'User not loaded');
      return;
    }

    if (days.length === 0 || timeSlots.length === 0) {
      Alert.alert('Validation', 'Please select at least one day and one time slot.');
      return;
    }

    // ✅ MOCK MODE: pretend save succeeded
    if (DEV_MOCK_AVAILABILITY) {
      Alert.alert('Success', 'Availability saved (mock)');
      return;
    }

    try {
      setSaving(true);

      const payload: AvailabilityData = {
        userId,
        days,
        timeSlots,
      };

      await upsertAvailability(payload);
      Alert.alert('Success', 'Availability saved');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading availability…</Text>
      </View>
    );
  }

  return (
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
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8 },
  errorText: { color: 'red', marginBottom: 12 },

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
});
