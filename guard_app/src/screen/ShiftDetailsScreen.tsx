import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { checkIn, checkOut, getUserAttendance } from '../api/attendance';
import ErrorMessageBox from '../components/ErrorMessageBox';
import LocationVerificationModal from '../components/modal/LocationVerificationModal';
import { getAttendanceForShift, setAttendanceForShift } from '../lib/attendancestore';
import { LocalStorage } from '../lib/localStorage';
import { useAppTheme } from '../theme';
import { formatDate } from '../utils/date';
import { formatAttendanceTime } from '../components/functions/formatAttendanceTime';

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

type ErrorState = {
  title: string;
  message: string;
} | null;

type Coordinates = {
  latitude: number;
  longitude: number;
};

function StatusBadge({ status, color }: { status: string; color: string }) {
  return <Text style={[stylesInline.statusBadge, { color }]}>{status.toUpperCase()}</Text>;
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getShiftDateKey(shiftDateValue: string | Date) {
  const shiftDate = new Date(shiftDateValue);
  return formatLocalDateKey(shiftDate);
}

function parseTimeToDate(baseDateValue: string | Date, timeValue?: string) {
  if (!timeValue) return null;

  const [hoursText, minutesText] = timeValue.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const baseDate = new Date(baseDateValue);
  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceInMeters(a: Coordinates, b: Coordinates) {
  const earthRadius = 6371000;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * c;
}

function getShiftCoordinates(shift: ShiftDto): Coordinates | null {
  const latitude = (shift.location as any)?.latitude;
  const longitude = (shift.location as any)?.longitude;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
}

export default function ShiftDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [shift] = useState<ShiftDto>(route.params.shift);
  const [attendance, setAttendance] = useState<AttendanceState | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');
  const [errorState, setErrorState] = useState<ErrorState>(null);

  useEffect(() => {
    (async () => {
      const storedAttendance = await getAttendanceForShift(shift._id);

      if (storedAttendance?.checkInTime || storedAttendance?.checkOutTime) {
        setAttendance(storedAttendance);
      }

      try {
        const token = await LocalStorage.getToken();
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id ?? payload._id ?? payload.sub;
        if (!userId) return;

        const records = await getUserAttendance(userId);

        const match = records.find((record) => {
          const recordShiftId = typeof record.shift === 'object' ? record.shift?._id : record.shift;

          return String(recordShiftId) === String(shift._id);
        });

        if (match?.clockIn || match?.clockOut) {
          const synced: AttendanceState = {
            checkInTime: match.clockIn ?? storedAttendance?.checkInTime,
            checkOutTime: match.clockOut ?? storedAttendance?.checkOutTime,
          };

          setAttendance(synced);
          await setAttendanceForShift(shift._id, synced);
        }
      } catch (error) {
        console.log('Failed to load attendance history:', error);
      }
    })();
  }, [shift._id]);

  const openModalFor = (type: 'check-in' | 'check-out') => {
    setActionType(type);
    setModalVisible(true);
  };

  const closeErrorBox = () => {
    setErrorState(null);
  };

  const showErrorBox = (title: string, message: string) => {
    setErrorState({ title, message });
  };

  const validateCheckInRules = (loc: Coordinates) => {
    const now = new Date();
    const todayKey = formatLocalDateKey(now);
    const shiftDateKey = getShiftDateKey(shift.date);

    if (shiftDateKey !== todayKey) {
      return {
        title: 'Check-in unavailable',
        message: 'You can only check in on the shift date.',
      };
    }

    const shiftStart = parseTimeToDate(shift.date, shift.startTime);
    if (shiftStart && now < shiftStart) {
      return {
        title: 'Check-in unavailable',
        message: 'You cannot check in before the shift start time.',
      };
    }

    const shiftCoords = getShiftCoordinates(shift);
    if (shiftCoords) {
      const distance = getDistanceInMeters(loc, shiftCoords);

      if (distance > 100) {
        return {
          title: 'Location mismatch',
          message:
            'You need to be within 100 metres of the shift location to check in. Please move closer to the site and try again.',
        };
      }
    }

    return null;
  };

  const validateCheckOutRules = (loc: Coordinates) => {
    const shiftCoords = getShiftCoordinates(shift);

    if (shiftCoords) {
      const distance = getDistanceInMeters(loc, shiftCoords);

      if (distance > 100) {
        return {
          title: 'Location mismatch',
          message:
            'You need to be within 100 metres of the shift location to check out. Please move closer to the site and try again.',
        };
      }
    }

    return null;
  };

  const handleVerificationSuccess = async (loc: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => {
    console.log('✅ handleVerificationSuccess called with:', loc);

    try {
      setModalVisible(false);

      if (actionType === 'check-in') {
        const clientValidationError = validateCheckInRules({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });

        if (clientValidationError) {
          showErrorBox(clientValidationError.title, clientValidationError.message);
          return;
        }

        console.log('➡️ checkIn request for shift:', shift._id);
        const res = await checkIn(shift._id, loc);

        const next: AttendanceState = {
          checkInTime: res.attendance?.clockIn ?? new Date().toISOString(),
          checkOutTime: res.attendance?.clockOut ?? undefined,
        };

        setAttendance(next);
        setAttendanceForShift(shift._id, next).catch(() => {});

        Alert.alert('Success', 'Checked in successfully ✅');
      } else {
        const clientValidationError = validateCheckOutRules({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });

        if (clientValidationError) {
          showErrorBox(clientValidationError.title, clientValidationError.message);
          return;
        }

        console.log('➡️ checkOut request for shift:', shift._id);
        const res = await checkOut(shift._id, loc);

        const next: AttendanceState = {
          checkInTime: res.attendance?.clockIn ?? attendance?.checkInTime,
          checkOutTime: res.attendance?.clockOut ?? new Date().toISOString(),
        };

        setAttendance(next);
        setAttendanceForShift(shift._id, next).catch(() => {});

        Alert.alert('Success', 'Checked out successfully ✅');
      }
    } catch (e: unknown) {
      setModalVisible(false);
      console.log('❌ attendance API failed:', e);

      const msg =
        e instanceof AxiosError
          ? String(e.response?.data?.message ?? e.message ?? 'Action failed')
          : e instanceof Error
            ? e.message
            : 'Action failed';

      console.log('📝 normalized backend message:', msg);

      const normalizedMsg = msg.toLowerCase();

      if (
        normalizedMsg.includes('check in on the shift date') ||
        normalizedMsg.includes('before the shift start time') ||
        normalizedMsg.includes('too early') ||
        normalizedMsg.includes('too late') ||
        normalizedMsg.includes('check-in window')
      ) {
        showErrorBox(
          actionType === 'check-in' ? 'Check-in unavailable' : 'Check-out unavailable',
          msg,
        );
        return;
      }

      if (
        normalizedMsg.includes('not within shift radius') ||
        normalizedMsg.includes('not at the shift location') ||
        normalizedMsg.includes('location') ||
        normalizedMsg.includes('radius') ||
        normalizedMsg.includes('100m') ||
        normalizedMsg.includes('100 m') ||
        normalizedMsg.includes('within 100 metres')
      ) {
        showErrorBox('Location mismatch', msg);
        return;
      }

      if (normalizedMsg.includes('already checked in')) {
        const synced: AttendanceState = { checkInTime: new Date().toISOString() };
        setAttendance(synced);
        setAttendanceForShift(shift._id, synced).catch(() => {});
        return;
      }

      if (normalizedMsg.includes('shift is not defined')) {
        showErrorBox(
          actionType === 'check-in' ? 'Unable to check in' : 'Unable to check out',
          'The server could not process this shift right now. Please try again later.',
        );
        return;
      }

      showErrorBox(
        actionType === 'check-in' ? 'Unable to check in' : 'Unable to check out',
        msg.trim().length > 0
          ? msg
          : `Something went wrong while trying to ${
              actionType === 'check-in' ? 'check in' : 'check out'
            }. Please try again.`,
      );
    }
  };

  let statusColor = colors.link;
  if (shift.status === 'assigned') statusColor = colors.status.confirmed;
  if (shift.status === 'completed') statusColor = colors.primary;

  const canDoAttendance = shift.status === 'assigned';
  const hasCheckedIn = Boolean(attendance?.checkInTime);
  const hasCheckedOut = Boolean(attendance?.checkOutTime);

  const showCheckIn = canDoAttendance && !hasCheckedIn;
  const showCheckOut = canDoAttendance && hasCheckedIn && !hasCheckedOut;

  const shouldShowAttendanceHistory = shift.status === 'completed' || hasCheckedIn;

  const attendanceHistory: AttendanceHistoryItem[] = [
    ...(attendance?.checkInTime
      ? [{ label: '✅ Checked In', value: formatAttendanceTime(attendance.checkInTime) }]
      : []),
    ...(attendance?.checkOutTime
      ? [{ label: '✅ Checked Out', value: formatAttendanceTime(attendance.checkOutTime) }]
      : []),
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
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.messageBtn]} onPress={handleMessageEmployer}>
            <Text style={s.btnText}>Message Employer</Text>
          </TouchableOpacity>

          {showCheckIn ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.confirmed }]}
              onPress={() => openModalFor('check-in')}
            >
              <Text style={s.btnText}>Check In</Text>
            </TouchableOpacity>
          ) : null}

          {showCheckOut ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.rejected }]}
              onPress={() => openModalFor('check-out')}
            >
              <Text style={s.btnText}>Check Out</Text>
            </TouchableOpacity>
          ) : null}

          {shift.status === 'completed' ? (
            <View style={s.completedBox}>
              <Text style={s.completedText}>Shift Completed ✅</Text>
            </View>
          ) : null}

          {!canDoAttendance ? (
            <Text style={s.hint}>
              You can only check in/out when the shift is <Text style={s.hintStrong}>ASSIGNED</Text>
              .
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <LocationVerificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onVerified={handleVerificationSuccess}
      />

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        onClose={closeErrorBox}
      />
    </View>
  );
}

const stylesInline = StyleSheet.create({
  statusBadge: {
    fontWeight: '700',
  },
});

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
