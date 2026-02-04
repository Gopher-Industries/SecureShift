// src/screen/ShiftDetailsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { checkIn, checkOut } from '../api/attendance';
import LocationVerificationModal from '../components/LocationVerificationModal';
import { getAttendanceForShift, setAttendanceForShift } from '../lib/attendancestore';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

import type { ShiftDto } from '../api/shifts';

type ScreenRouteProp = RouteProp<RootStackParamList, 'ShiftDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type AttendanceState = {
  checkInTime?: string;
  checkOutTime?: string;
};

export default function ShiftDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();

  const [shift, setShift] = useState<ShiftDto>(route.params.shift);

  const [attendance, setAttendance] = useState<AttendanceState | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');

  // Load attendance from AsyncStorage when screen opens
  useEffect(() => {
    (async () => {
      const a = await getAttendanceForShift(shift._id);
      setAttendance(a);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift._id]);

  const openModalFor = (type: 'check-in' | 'check-out') => {
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
        const res = await checkIn(shift._id, loc);

        // ✅ persist attendance
        const next = {
          checkInTime: res.attendance.checkInTime,
          checkOutTime: undefined,
        };
        await setAttendanceForShift(shift._id, next);
        setAttendance(next);

        Alert.alert('Success', 'Checked in successfully ✅');
      } else {
        const res = await checkOut(shift._id, loc);

        // ✅ persist attendance
        const next = {
          checkInTime: res.attendance.checkInTime,
          checkOutTime: res.attendance.checkOutTime,
        };
        await setAttendanceForShift(shift._id, next);
        setAttendance(next);

        Alert.alert('Success', 'Checked out successfully ✅');
      }

      // Refresh parent list if callback exists
      if (route.params.refresh) route.params.refresh();
    } catch (e: any) {
      setModalVisible(false);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Action failed';

      // Optional: friendlier location error if backend returns message
      if (typeof msg === 'string' && msg.toLowerCase().includes('location')) {
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

  // ✅ Correct button rules (no in-progress)
  const canDoAttendance = shift.status === 'assigned';
  const hasCheckedIn = !!attendance?.checkInTime;
  const hasCheckedOut = !!attendance?.checkOutTime;

  const showCheckIn = canDoAttendance && !hasCheckedIn;
  const showCheckOut = canDoAttendance && hasCheckedIn && !hasCheckedOut;

  const handleMessageEmployer = () => {
    const employerId = shift.createdBy?._id;
    if (!employerId) {
      Alert.alert('Unavailable', 'Employer details not found for this shift.');
      return;
    }

    const shiftTitle = `${shift.title} - ${formatDate(shift.date)} (${shift.startTime} - ${shift.endTime})`;
    navigation.navigate('Messages', {
      context: 'shift',
      shiftParticipantId: employerId,
      shiftParticipantName: shift.createdBy?.company ?? shift.createdBy?.name ?? 'Employer',
      shiftTitle,
    });
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.title}>{shift.title}</Text>
          <Text style={s.company}>{shift.createdBy?.company ?? 'Company N/A'}</Text>

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

          {/* Optional: show attendance info */}
          {attendance?.checkInTime && (
            <Text style={s.metaText}>✅ Checked in: {attendance.checkInTime}</Text>
          )}
          {attendance?.checkOutTime && (
            <Text style={s.metaText}>✅ Checked out: {attendance.checkOutTime}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.messageBtn]} onPress={handleMessageEmployer}>
            <Text style={s.btnText}>Message Employer</Text>
          </TouchableOpacity>

          {showCheckIn && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: COLORS.status.confirmed }]}
              onPress={() => openModalFor('check-in')}
            >
              <Text style={s.btnText}>Check In</Text>
            </TouchableOpacity>
          )}

          {showCheckOut && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: COLORS.status.rejected }]}
              onPress={() => openModalFor('check-out')}
            >
              <Text style={s.btnText}>Check Out</Text>
            </TouchableOpacity>
          )}

          {/* Completed UI */}
          {shift.status === 'completed' && (
            <View style={s.completedBox}>
              <Text style={s.completedText}>Shift Completed ✅</Text>
            </View>
          )}

          {/* Helpful message if not assigned */}
          {!canDoAttendance && (
            <Text style={s.hint}>
              You can only check in/out when the shift is{' '}
              <Text style={{ fontWeight: '700' }}>ASSIGNED</Text>.
            </Text>
          )}
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
  metaText: { marginTop: 6, color: COLORS.muted },

  actions: { marginTop: 24 },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  messageBtn: { backgroundColor: COLORS.primary },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  completedBox: {
    backgroundColor: '#EAF7EF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4F0DC',
  },
  completedText: { color: '#1A936F', fontWeight: 'bold', fontSize: 16 },

  hint: { marginTop: 8, color: COLORS.muted, textAlign: 'center' },
});
