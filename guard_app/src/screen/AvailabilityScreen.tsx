import React, { useEffect, useState } from 'react';
import { View, Text, Button, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { getMe } from '../api/auth';
import { getAvailability, upsertAvailability, type AvailabilityData } from '../api/availability';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await getMe();
        const id = me?._id ?? me?.id;

        if (!id) {
          setError('Could not determine logged-in user id.');
          return;
        }

        setUserId(id);

        const data = await getAvailability(id);

        if (data) {
          setDays(data.days);
          setTimeSlots(data.timeSlots);
        } else {
          setDays([]);
          setTimeSlots([]);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const addTestSlot = () => {
    const slot = '09:00-17:00';
    if (!timeSlots.includes(slot)) {
      setTimeSlots((prev) => [...prev, slot]);
    }
  };

  const clearSlots = () => setTimeSlots([]);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not loaded yet.');
      return;
    }

    if (days.length === 0) {
      Alert.alert('Validation', 'Please select at least one day.');
      return;
    }

    if (timeSlots.length === 0) {
      Alert.alert('Validation', 'Please add at least one time slot.');
      return;
    }

    try {
      setSaving(true);

      const payload: AvailabilityData = {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text>Loading availability…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Select days:</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        {WEEK_DAYS.map((day) => {
          const selected = days.includes(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => toggleDay(day)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                marginRight: 6,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: selected ? 'black' : '#ccc',
                backgroundColor: selected ? '#ddd' : 'white',
              }}
            >
              <Text>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Time slots:</Text>
      <Text>For now tap &quot;Add test slot&quot; to send &quot;09:00-17:00&quot;.</Text>

      <View style={{ flexDirection: 'row', marginVertical: 8 }}>
        <Button title="Add test slot" onPress={addTestSlot} />
        <View style={{ width: 8 }} />
        <Button title="Clear slots" onPress={clearSlots} />
      </View>

      {timeSlots.map((slot) => (
        <Text key={slot}>• {slot}</Text>
      ))}

      <View style={{ marginTop: 24 }}>
        <Button
          title={saving ? 'Saving...' : 'Save Availability'}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  );
}
