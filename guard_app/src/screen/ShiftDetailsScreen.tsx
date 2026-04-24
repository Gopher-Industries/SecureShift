// src/screen/ShiftDetailsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// import { checkIn, checkOut } from '../api/attendance'; //uncomment when API is ready
import LocationVerificationModal from '../components/LocationVerificationModal';
import { getAttendanceForShift, setAttendanceForShift } from '../lib/attendancestore';
import { useAppTheme } from '../theme';
import { formatDate } from '../utils/date';

import type { ShiftDto } from '../api/shifts';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { AppColors } from '../theme/colors';

type ScreenRouteProp = RouteProp<RootStackParamList, 'ShiftDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type AttendanceState = {
  checkInTime?: string;
  checkOutTime?: string;
};

type AttendanceHistoryItem = {
  label: string;
  value: string;
};

function StatusBadge({ status, color }: { status: string; color: string }) {
  return <Text style={{ color, fontWeight: '700' }}>{status.toUpperCase()}</Text>;
}

const normalizeAttendance = (
  attendance?: {
    checkInTime?: string | null;
    checkOutTime?: string | null;
  } | null,
): AttendanceState => ({
  checkInTime: attendance?.checkInTime ?? undefined,
  checkOutTime: attendance?.checkOutTime ?? undefined,
});

export default function ShiftDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [shift] = useState<ShiftDto>(route.params.shift);
  const [attendance, setAttendance] = useState<AttendanceState | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');

  useEffect(() => {
    console.log('Shift details:', shift);
  }, [shift]);

  useEffect(() => {
    (async () => {
      const a = await getAttendanceForShift(shift._id);
      setAttendance(a ? normalizeAttendance(a) : null);
    })();
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
    // Uncomment this section when the backend API is ready to handle location-based check-in/check-out.
    // try {
    //   setModalVisible(false);
    //   console.log('Location:', loc);

    //   if (actionType === 'check-in') {
    //     const res = await checkIn(shift._id, loc);

    //     const next: AttendanceState = normalizeAttendance({
    //       checkInTime: res.attendance?.checkInTime,
    //       checkOutTime: undefined,
    //     });

    //     await setAttendanceForShift(shift._id, next);
    //     setAttendance(next);

    //     Alert.alert('Success', 'Checked in successfully ✅');
    //   } else {
    //     const res = await checkOut(shift._id, loc);

    //     const next: AttendanceState = normalizeAttendance({
    //       checkInTime: res.attendance?.checkInTime,
    //       checkOutTime: res.attendance?.checkOutTime,
    //     });

    //     await setAttendanceForShift(shift._id, next);
    //     setAttendance(next);

    //     Alert.alert('Success', 'Checked out successfully ✅');
    //   }

    //   if (route.params.refresh) route.params.refresh();
    // } catch (e: unknown) {
    //   setModalVisible(false);
    //   let msg;
    //   if (e instanceof AxiosError) {
    //     msg = e?.response?.data?.message ?? e?.message ?? 'Action failed';
    //   } else {
    //     msg = 'Action failed';
    //   }

    //   if (typeof msg === 'string' && msg.toLowerCase().includes('location')) {
    //     Alert.alert('Location Error', 'You are not at the shift location ❌');
    //   } else {
    //     Alert.alert('Error', msg);
    //   }
    // }

    // locally update attendance (e.g. due to location verification issues in API)
    try {
      setModalVisible(false);
      console.log('Location:', loc);

      const now = new Date().toISOString();

      // checking in/out should only be allowed during shift time - this is a fallback check in case the API doesn't enforce it properly
      const nowD = new Date();
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      if (actionType === 'check-in' && (nowD < start || nowD > end)) {
        Alert.alert('Not allowed', 'Check-in is only allowed during shift time.');
        return;
      }

      if (actionType === 'check-in') {
        const next: AttendanceState = {
          checkInTime: now,
          checkOutTime: attendance?.checkOutTime,
        };

        await setAttendanceForShift(shift._id, next);
        setAttendance(next);

        Alert.alert('Success', 'Checked in successfully ✅');
      } else {
        const next: AttendanceState = {
          checkInTime: attendance?.checkInTime,
          checkOutTime: now,
        };

        await setAttendanceForShift(shift._id, next);
        setAttendance(next);

        Alert.alert('Success', 'Checked out successfully ✅');
      }

      if (route.params.refresh) route.params.refresh();
    } catch {
      setModalVisible(false);
      Alert.alert('Error', 'Action failed');
    }
  };

  let statusColor = colors.link;
  if (shift.status === 'assigned') statusColor = colors.status.confirmed;
  if (shift.status === 'completed') statusColor = colors.primary;

  const canDoAttendance = shift.status === 'assigned';
  const hasCheckedIn = !!attendance?.checkInTime;
  const hasCheckedOut = !!attendance?.checkOutTime;

  const shouldShowAttendanceHistory = shift.status === 'completed' || hasCheckedIn;
  const showCheckIn = canDoAttendance && !hasCheckedIn;
  const showCheckOut = canDoAttendance && hasCheckedIn && !hasCheckedOut;

  const attendanceHistory: AttendanceHistoryItem[] = [
    ...(attendance?.checkInTime ? [{ label: 'Check In', value: attendance.checkInTime }] : []),
    ...(attendance?.checkOutTime ? [{ label: 'Check Out', value: attendance.checkOutTime }] : []),
  ];

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
            <Ionicons name="location-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>
              {shift.location
                ? `${shift.location.street ?? ''}, ${shift.location.suburb ?? ''}`
                : 'Location N/A'}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>{formatDate(shift.date)}</Text>
          </View>

          <View style={s.row}>
            <Ionicons name="time-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>
              {shift.startTime} - {shift.endTime}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="cash-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>${shift.payRate ?? 0} / hr</Text>
          </View>

          <View style={[s.row, s.statusRow]}>
            <Text style={s.label}>Status: </Text>
            <StatusBadge status={shift.status ?? 'open'} color={statusColor} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Location Details</Text>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Street</Text>
              <Text style={s.infoValue}>{shift.location?.street ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Suburb</Text>
              <Text style={s.infoValue}>{shift.location?.suburb ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>State</Text>
              <Text style={s.infoValue}>{shift.location?.state ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Postcode</Text>
              <Text style={s.infoValue}>{shift.location?.postcode ?? 'N/A'}</Text>
            </View>
          </View>
          {shouldShowAttendanceHistory && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Attendance History</Text>

              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((item, index) => (
                  <View key={index} style={s.historyItem}>
                    <Text style={s.historyLabel}>{item.label}</Text>
                    <Text style={s.historyValue}>{item.value}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.emptyHistory}>No attendance history available</Text>
              )}
            </View>
          )}

          {attendance?.checkInTime && (
            <Text style={s.metaText}>✅ Checked in: {attendance.checkInTime}</Text>
          )}
          {attendance?.checkOutTime && (
            <Text style={s.metaText}>✅ Checked out: {attendance.checkOutTime}</Text>
          )}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.messageBtn]} onPress={handleMessageEmployer}>
            <Text style={s.btnText}>Message Employer</Text>
          </TouchableOpacity>

          {showCheckIn && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.confirmed }]}
              onPress={() => openModalFor('check-in')}
            >
              <Text style={s.btnText}>Check In</Text>
            </TouchableOpacity>
          )}

          {showCheckOut && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.rejected }]}
              onPress={() => openModalFor('check-out')}
            >
              <Text style={s.btnText}>Check Out</Text>
            </TouchableOpacity>
          )}

          {shift.status === 'completed' && (
            <View style={s.completedBox}>
              <Text style={s.completedText}>Shift Completed ✅</Text>
            </View>
          )}

          {!canDoAttendance && (
            <Text style={s.hint}>
              You can only check in/out when the shift is <Text style={s.hintStrong}>ASSIGNED</Text>
              .
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

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    company: {
      fontSize: 16,
      color: colors.muted,
      marginBottom: 12,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusRow: {
      marginTop: 20,
    },
    rowText: {
      marginLeft: 10,
      fontSize: 16,
      color: colors.text,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    metaText: {
      marginTop: 6,
      color: colors.muted,
    },
    actions: {
      marginTop: 24,
    },
    btn: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      elevation: 2,
    },
    messageBtn: {
      backgroundColor: colors.primary,
    },
    btnText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    completedBox: {
      backgroundColor: colors.greenSoft,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.rowHighlightBorder,
    },
    completedText: {
      color: colors.status.confirmed,
      fontWeight: 'bold',
      fontSize: 16,
    },
    hint: {
      marginTop: 8,
      color: colors.muted,
      textAlign: 'center',
    },
    hintStrong: {
      fontWeight: '700',
    },
    section: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      maxWidth: '65%',
      textAlign: 'right',
    },
    historyItem: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    historyLabel: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 4,
    },
    historyValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    emptyHistory: {
      fontSize: 14,
      color: colors.muted,
    },
  });
