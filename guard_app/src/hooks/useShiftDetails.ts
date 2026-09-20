import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { checkIn, checkOut, getUserAttendance } from '../api/attendance';
import { formatAttendanceTime } from '../components/functions/formatAttendanceTime';
import { enqueueAttendance } from '../lib/attendanceQueue';
import { getAttendanceForShift, setAttendanceForShift } from '../lib/attendancestore';
import { getHandoverNotesForSite, HandoverNote, saveHandoverNote } from '../lib/handoverNotesStore';
import { LocalStorage } from '../lib/localStorage';
import { getIsConnected } from '../lib/networkStatus';
import { useAppTheme } from '../theme';
import { formatDate } from '../utils/date';
import {
  formatLocalDateKey,
  getDistanceInMeters,
  getShiftCoordinates,
  getShiftDateKey,
  getShiftWindow,
  type Coordinates,
} from '../utils/shiftDetails';

import type { ShiftDto } from '../api/shifts';
import type { RootStackParamList } from '../navigation/AppNavigator';

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

// GA-021 — all ShiftDetailsScreen state/effects/handlers, extracted from the
// screen unchanged so the screen is render-only.
export function useShiftDetails() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const [shift] = useState<ShiftDto>(route.params.shift);
  const [attendance, setAttendance] = useState<AttendanceState | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');
  const [errorState, setErrorState] = useState<ErrorState>(null);
  const [handoverText, setHandoverText] = useState('');
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>([]);
  const [savingHandover, setSavingHandover] = useState(false);

  const siteKey = [
    shift.location?.street,
    shift.location?.suburb,
    shift.location?.state,
    shift.location?.postcode,
  ]
    .filter(Boolean)
    .join('|');

  useEffect(() => {
    if (!siteKey) {
      setHandoverNotes([]);
      return;
    }

    getHandoverNotesForSite(siteKey)
      .then(setHandoverNotes)
      .catch(() => setHandoverNotes([]));
  }, [siteKey]);

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

        const match = records.find((record) => String(record.shiftId) === String(shift._id));

        if (match?.checkInTime || match?.checkOutTime) {
          const synced: AttendanceState = {
            checkInTime: match.checkInTime ?? storedAttendance?.checkInTime,
            checkOutTime: match.checkOutTime ?? storedAttendance?.checkOutTime,
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

    const { start: shiftStart, end: shiftEnd } = getShiftWindow(
      shift.date,
      shift.startTime,
      shift.endTime,
    );

    if (shiftStart && now < shiftStart) {
      return {
        title: 'Check-in unavailable',
        message: 'You cannot check in before the shift start time.',
      };
    }

    if (shiftEnd && now > shiftEnd) {
      return {
        title: 'Check-in unavailable',
        message: 'You cannot check in after the shift has ended.',
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
    const now = new Date();
    const { start: shiftStart } = getShiftWindow(shift.date, shift.startTime, shift.endTime);

    if (shiftStart && now < shiftStart) {
      return {
        title: 'Check-out unavailable',
        message: 'You cannot check out before the shift start time.',
      };
    }

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

  const handleSaveHandoverNote = async () => {
    const trimmedText = handoverText.trim();

    if (!trimmedText) {
      Alert.alert('Handover Note', 'Please enter a note before saving.');
      return;
    }

    if (!siteKey) {
      Alert.alert('Handover Note', 'Shift site information is unavailable.');
      return;
    }

    try {
      setSavingHandover(true);

      const note: HandoverNote = {
        id: `${shift._id}-${Date.now()}`,
        shiftId: shift._id,
        siteKey,
        text: trimmedText,
        author: shift.acceptedBy?.name ?? 'Guard',
        createdAt: new Date().toISOString(),
      };

      await saveHandoverNote(note);

      const updatedNotes = await getHandoverNotesForSite(siteKey);
      setHandoverNotes(updatedNotes);
      setHandoverText('');

      Alert.alert('Success', 'Handover note saved.');
    } catch {
      Alert.alert('Error', 'Failed to save handover note.');
    } finally {
      setSavingHandover(false);
    }
  };

  // Queue an attendance action locally and reflect it optimistically. Used when
  // the device is offline or the request can't reach the server; the app-level
  // sync (useAttendanceSync) replays it once connectivity returns.
  const saveAttendanceOffline = async (
    type: 'check-in' | 'check-out',
    loc: { latitude: number; longitude: number; timestamp: number },
  ) => {
    await enqueueAttendance({ shiftId: shift._id, type, location: loc });

    const timeIso = new Date(loc.timestamp).toISOString();
    const next: AttendanceState =
      type === 'check-in'
        ? { checkInTime: timeIso, checkOutTime: attendance?.checkOutTime }
        : { checkInTime: attendance?.checkInTime, checkOutTime: timeIso };

    setAttendance(next);
    setAttendanceForShift(shift._id, next).catch(() => {});

    Alert.alert(
      'Saved offline',
      `Your ${type === 'check-in' ? 'check-in' : 'check-out'} was saved and will sync automatically when you're back online.`,
    );
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

        // Offline: queue the check-in and sync it later.
        if (!(await getIsConnected())) {
          await saveAttendanceOffline('check-in', loc);
          return;
        }

        console.log('➡️ checkIn request for shift:', shift._id);
        const res = await checkIn(shift._id, loc);

        const next: AttendanceState = {
          checkInTime: res.attendance?.checkInTime ?? new Date().toISOString(),
          checkOutTime: res.attendance?.checkOutTime ?? undefined,
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

        // Offline: queue the check-out and sync it later.
        if (!(await getIsConnected())) {
          await saveAttendanceOffline('check-out', loc);
          return;
        }

        console.log('➡️ checkOut request for shift:', shift._id);
        const res = await checkOut(shift._id, loc);

        const next: AttendanceState = {
          checkInTime: res.attendance?.checkInTime ?? attendance?.checkInTime,
          checkOutTime: res.attendance?.checkOutTime ?? new Date().toISOString(),
        };

        setAttendance(next);
        setAttendanceForShift(shift._id, next).catch(() => {});

        Alert.alert('Success', 'Checked out successfully ✅');
      }
    } catch (e: unknown) {
      setModalVisible(false);
      console.log('❌ attendance API failed:', e);

      // Request never reached the server (no response = connectivity failure):
      // queue it so it syncs when the network returns, instead of erroring out.
      if (e instanceof AxiosError && !e.response) {
        await saveAttendanceOffline(actionType, loc);
        return;
      }

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

  const handleStartPatrol = () => navigation.navigate('PatrolTour', { shift });

  return {
    shift,
    statusColor,
    canDoAttendance,
    hasCheckedIn,
    hasCheckedOut,
    showCheckIn,
    showCheckOut,
    shouldShowAttendanceHistory,
    attendanceHistory,
    handoverText,
    setHandoverText,
    handoverNotes,
    savingHandover,
    modalVisible,
    setModalVisible,
    errorState,
    closeErrorBox,
    openModalFor,
    handleSaveHandoverNote,
    handleVerificationSuccess,
    handleMessageEmployer,
    handleStartPatrol,
  };
}
