import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { checkIn, checkOut, type ShiftDto } from '../api/shifts';
import LocationVerificationModal from '../components/LocationVerificationModal';
import { COLORS } from '../theme/colors';
import { formatDate } from '../utils/date';

// Manually defining route params here since we haven't updated AppNavigator yet
type RootStackParamList = {
  ShiftDetails: { shift: ShiftDto; refresh?: () => void };
};

type ScreenRouteProp = RouteProp<RootStackParamList, 'ShiftDetails'>;
type ScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ShiftDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<ScreenNavProp>();
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
      // Keep modal open or show spinner?
      // For now, let's close modal and show global loading, or handle inside modal.
      // The modal currently stays open on success until we close it, so we can close it now.
      setModalVisible(false);

      // Call API
      // Show loading overlay? For simplicity, using simple Alert after.
      let res;
      if (actionType === 'check-in') {
        res = await checkIn(shift._id, loc);
        Alert.alert('Success', 'Checked in successfully ✅');
      } else {
        res = await checkOut(shift._id, loc);
        Alert.alert('Success', 'Checked out successfully ✅');
      }

      // Update local state
      if (res?.shift) {
        setShift(res.shift);
        // Trigger refresh in parent if callback provided
        if (route.params.refresh) route.params.refresh();
      }
    } catch (e: any) {
      setModalVisible(false);
      const msg = e?.response?.data?.message ?? e?.message ?? 'Action failed';

      if (msg.includes('not at the shift location')) {
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
    // Map backend status to display
    return <Text style={{ color, fontWeight: '700' }}>{status.toUpperCase()}</Text>;
  };

  // Determine which button to show
  // We need to know if we are currently checked in?
  // The backend shift object usually tracks this.
  // Assuming 'assigned' means ready to check in.
  // We might need a 'checked-in' status or similar field from backend to know if we should show Check Out.
  // For now, let's assume:
  // if status == 'assigned' -> Show Check In
  // if status == 'checked-in' (if that existed) -> Show Check Out.
  // Since we don't have the full backend schema for 'in-progress',
  // I will add a temporary toggle or check if 'startTime' is past?
  // Actually, usually status updates to 'in-progress' or similar.
  // Let's assume 'assigned' means Not Started.
  // If we can't detect 'Checked In' state from `shift.status`, we might need a flag.
  // I will assume status becomes 'in-progress' after check-in.

  const showCheckIn = shift.status === 'assigned';
  // If backend supports 'in-progress', use that. Else, maybe we can only check in once?
  // Let's assume we can also Check Out if status is 'in-progress' OR if we just checked in.
  // Without backend changes documentation, I'll provide both buttons for testing if status is ambiguous,
  // OR standard flow: 'assigned' -> Check In -> 'in-progress' -> Check Out -> 'completed'.
  const showCheckOut = shift.status === 'in-progress';

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
            <Text style={s.rowText}>${shift.payRate} / hr</Text>
          </View>

          <View style={[s.row, { marginTop: 20 }]}>
            <Text style={s.label}>Status: </Text>
            <StatusBadge status={shift.status ?? 'open'} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actions}>
          {(showCheckIn || shift.status === 'assigned') && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: COLORS.status.confirmed }]}
              onPress={() => onCheckPress('check-in')}
            >
              <Text style={s.btnText}>Check Check-In</Text>
            </TouchableOpacity>
          )}

          {(showCheckOut || shift.status === 'in-progress') && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: COLORS.status.rejected }]}
              onPress={() => onCheckPress('check-out')}
            >
              <Text style={s.btnText}>Check Out</Text>
            </TouchableOpacity>
          )}

          {shift.status === 'completed' && (
            <View style={s.completedBox}>
              <Text style={s.completedText}>Shift Completed ✅</Text>
            </View>
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

  actions: { marginTop: 24 },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
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
});
