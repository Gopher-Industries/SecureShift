import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { checkIn, checkOut } from '../api/attendance';
import LocationVerificationModal from '../components/LocationVerificationModal';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

import type { ShiftDto } from '../api/shifts';

type RootStackParamList = {
  ShiftDetails: { shift: ShiftDto; refresh?: () => void };
};

type ScreenRouteProp = RouteProp<RootStackParamList, 'ShiftDetails'>;

export default function ShiftDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const [shift, setShift] = useState<ShiftDto>(route.params.shift);

  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');

  const onCheckPress = (type: 'check-in' | 'check-out') => {
    setActionType(type);
    setModalVisible(true);
  };

  const handleVerificationSuccess = async (loc: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => {
    try {
      setModalVisible(false);

      if (actionType === 'check-in') {
        await checkIn(shift._id, loc);
        Alert.alert('Success', 'Checked in successfully ✅');
      } else {
        await checkOut(shift._id, loc);
        Alert.alert('Success', 'Checked out successfully ✅');
      }

      // Optional: tell parent to refresh list
      route.params.refresh?.();
    } catch (e: any) {
      setModalVisible(false);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Action failed';

      if (String(msg).toLowerCase().includes('not at the shift location')) {
        Alert.alert('Location Error', 'You are not at the shift location ❌');
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    let color = COLORS.link;
    if (status === 'assigned') color = COLORS.status.confirmed;
    if (status === 'completed') color = COLORS.primary;
    return <Text style={{ color, fontWeight: '700' }}>{status.toUpperCase()}</Text>;
  };

  // Only allow check-in when assigned (based on your ShiftDto)
  const showCheckIn = shift.status === 'assigned';

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.title}>{shift.title}</Text>
          <Text style={s.company}>{shift.createdBy?.company}</Text>

          <View style={s.divider} />

          <View style={s.row}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={s.rowText}>
              {shift.location
                ? `${shift.location.street ?? ''}, ${shift.location.suburb ?? ''}`
                : 'Location N/A'}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={s.rowText}>{formatDate(shift.date)}</Text>
          </View>

          <View style={s.row}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={s.rowText}>
              {shift.startTime} - {shift.endTime}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="cash-outline" size={20} color="#666" />
            <Text style={s.rowText}>${shift.payRate ?? 0} / hr</Text>
          </View>

          <View style={[s.row, { marginTop: 20 }]}>
            <Text style={s.label}>Status: </Text>
            <StatusBadge status={shift.status ?? 'open'} />
          </View>
        </View>

        <View style={s.actions}>
          {showCheckIn && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: COLORS.status.confirmed }]}
              onPress={() => onCheckPress('check-in')}
            >
              <Text style={s.btnText}>Check In</Text>
            </TouchableOpacity>
          )}

          {/* NOTE: Check-out button requires backend state/attendance info to know if checked-in */}
          {/* We can enable it later once backend tells us check-in happened */}
        </View>
      </ScrollView>

      <LocationVerificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onVerified={handleVerificationSuccess}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  company: { fontSize: 16, color: COLORS.muted, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowText: { marginLeft: 10, fontSize: 16, color: '#333' },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },

  actions: { marginTop: 24 },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
