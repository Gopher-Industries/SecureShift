import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface AddAvailabilityModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSlot: (dayName: string, slotLabel: string) => void;
}

const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

export default function AddAvailabilityModal({
  visible,
  onClose,
  onAddSlot,
}: AddAvailabilityModalProps) {
  const [slotDate, setSlotDate] = useState<Date | null>(new Date());
  const [fromTime, setFromTime] = useState<Date | null>(null);
  const [toTime, setToTime] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'date' | 'from' | 'to' | null>(null);

  const resetState = () => {
    setSlotDate(new Date());
    setFromTime(null);
    setToTime(null);
    setActivePicker(null);
  };

  const openPicker = (kind: 'date' | 'from' | 'to') => {
    setActivePicker(kind);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    if (!selected) return;

    if (activePicker === 'date') {
      setSlotDate(selected);
    } else if (activePicker === 'from') {
      setFromTime(selected);
    } else if (activePicker === 'to') {
      setToTime(selected);
    }

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const handleAdd = () => {
    if (!slotDate || !fromTime || !toTime) {
      Alert.alert('Missing info', 'Please select a date, start time, and end time.');
      return;
    }

    // JS: 0 = Sunday, 1 = Monday, ... 6 = Saturday
    // Our WEEK_DAYS array starts with Monday → shift index by +6 mod 7
    const weekdayIndex = slotDate.getDay();
    const weekdayName = WEEK_DAYS[(weekdayIndex + 6) % 7];

    const slotLabel = `${formatTime(fromTime)}-${formatTime(toTime)}`;

    onAddSlot(weekdayName, slotLabel);
    resetState();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add Availability</Text>

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.inputLike}
            onPress={() => openPicker('date')}
            accessibilityRole="button"
            accessibilityLabel="Select date"
          >
            <Text>{slotDate ? slotDate.toDateString() : 'Select date'}</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>From</Text>
              <TouchableOpacity
                style={styles.inputLike}
                onPress={() => openPicker('from')}
                accessibilityRole="button"
                accessibilityLabel="Select start time"
              >
                <Text>{fromTime ? formatTime(fromTime) : 'Start time'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>To</Text>
              <TouchableOpacity
                style={styles.inputLike}
                onPress={() => openPicker('to')}
                accessibilityRole="button"
                accessibilityLabel="Select end time"
              >
                <Text>{toTime ? formatTime(toTime) : 'End time'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
              <Text style={styles.primaryButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activePicker && (
          <DateTimePicker
            value={
              activePicker === 'date'
                ? (slotDate ?? new Date())
                : activePicker === 'from'
                  ? (fromTime ?? new Date())
                  : (toTime ?? new Date())
            }
            mode={activePicker === 'date' ? 'date' : 'time'}
            display="default"
            onChange={handlePickerChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  inputLike: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  column: {
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#003f88',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});
