// src/screen/ActiveSOSScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  addSOSNote,
  cancelSOS,
  getSOSStatus,
  SOSAlert,
  SOSStatus,
  triggerSOS,
  updateSOSLocation,
} from '../api/sos';
import ErrorMessageBox from '../components/ErrorMessageBox';
import { useAppTheme } from '../theme';

import type { RootStackParamList } from '../navigation/AppNavigator';

type ScreenRouteProp = RouteProp<RootStackParamList, 'ActiveSOS'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const CANCEL_GRACE_MS = 10_000;
const STATUS_POLL_MS = 5_000;
const LOCATION_PUSH_INTERVAL_MS = 15_000;
const LOCATION_DISTANCE_INTERVAL_M = 10;

type Coords = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

const STATUS_LABELS: Record<SOSStatus, string> = {
  pending: 'Sending SOS...',
  notifying: 'Notifying supervisor',
  notified: 'Supervisor notified',
  connected: 'Connected — help on the way',
  cancelled: 'SOS cancelled',
  resolved: 'SOS resolved',
};

function formatTime(iso?: string) {
  if (!iso) return '--:--:--';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString();
  } catch {
    return '--:--:--';
  }
}

function formatCoord(value?: number) {
  if (typeof value !== 'number') return '—';
  return value.toFixed(5);
}

export default function ActiveSOSScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const s = useMemo(() => getStyles(colors), [colors]);

  const initialSosId = route.params?.sosId;
  const initialContactPhone = route.params?.emergencyContact?.phone;
  const initialContactName = route.params?.emergencyContact?.name;

  const [sosId, setSosId] = useState<string | null>(initialSosId ?? null);
  const [alert, setAlert] = useState<SOSAlert | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [triggeredAt, setTriggeredAt] = useState<string | null>(null);
  const [status, setStatus] = useState<SOSStatus>('pending');
  const [errorState, setErrorState] = useState<{ title: string; message: string } | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [cancelRemainingMs, setCancelRemainingMs] = useState(CANCEL_GRACE_MS);
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastPushedAtRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelDeadlineRef = useRef<number>(Date.now() + CANCEL_GRACE_MS);
  const mountedRef = useRef(true);

  const closeError = useCallback(() => setErrorState(null), []);

  const showError = useCallback((title: string, message: string) => {
    setErrorState({ title, message });
  }, []);

  /**
   * Try to grab a single fix to start with (for triggering or for the initial
   * location indicator). Returns null on failure.
   */
  const fetchInitialPosition = useCallback(async (): Promise<Coords | null> => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        showError(
          'Location services are off',
          'Turn on location services in Settings so we can share your live location with responders.',
        );
        return null;
      }
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== 'granted') {
        showError(
          'Location permission required',
          'SOS needs location permission to share your live position with responders.',
        );
        return null;
      }
      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // ignore
        }
      }
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        timestamp: fix.timestamp,
      };
    } catch {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          timestamp: last.timestamp,
        };
      }
      return null;
    }
  }, [showError]);

  /**
   * Start watching position and push updates to the backend at most every
   * LOCATION_PUSH_INTERVAL_MS or every LOCATION_DISTANCE_INTERVAL_M metres.
   */
  const startLocationWatcher = useCallback(
    async (activeSosId: string) => {
      if (watcherRef.current) return;
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_PUSH_INTERVAL_MS,
            distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          },
          (loc) => {
            const next: Coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              timestamp: loc.timestamp,
            };
            setCoords(next);
            const now = Date.now();
            if (now - lastPushedAtRef.current >= LOCATION_PUSH_INTERVAL_MS) {
              lastPushedAtRef.current = now;
              updateSOSLocation(activeSosId, next).catch(() => {
                // best-effort; ignore individual push failures
              });
            }
          },
        );
        watcherRef.current = sub;
      } catch {
        // location watcher is best effort
      }
    },
    [],
  );

  const stopLocationWatcher = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopCancelTimer = useCallback(() => {
    if (cancelTickRef.current) {
      clearInterval(cancelTickRef.current);
      cancelTickRef.current = null;
    }
  }, []);

  /**
   * Start polling backend for status changes once we have a sosId.
   */
  const startPolling = useCallback(
    (activeSosId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const next = await getSOSStatus(activeSosId);
          if (!mountedRef.current) return;
          setAlert(next);
          setStatus(next.status);
          if (next.status === 'cancelled' || next.status === 'resolved') {
            stopPolling();
            stopLocationWatcher();
          }
        } catch {
          // ignore poll failures
        }
      }, STATUS_POLL_MS);
    },
    [stopLocationWatcher, stopPolling],
  );

  /**
   * Bootstrap: either resume an existing SOS (sosId in params) or trigger
   * a new one using the current location.
   */
  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    (async () => {
      try {
        if (initialSosId) {
          // Resume an existing SOS
          const existing = await getSOSStatus(initialSosId);
          if (!active) return;
          setAlert(existing);
          setStatus(existing.status);
          setTriggeredAt(existing.triggeredAt);
          setCoords(existing.location);
          cancelDeadlineRef.current =
            new Date(existing.triggeredAt).getTime() + CANCEL_GRACE_MS;
          setBootstrapping(false);
          startPolling(initialSosId);
          startLocationWatcher(initialSosId);
        } else {
          // Trigger a new SOS
          const fix = await fetchInitialPosition();
          if (!active) return;
          if (!fix) {
            setBootstrapping(false);
            return;
          }
          setCoords(fix);
          const created = await triggerSOS(fix);
          if (!active) return;
          setAlert(created);
          setSosId(created._id);
          setStatus(created.status);
          setTriggeredAt(created.triggeredAt);
          cancelDeadlineRef.current =
            new Date(created.triggeredAt).getTime() + CANCEL_GRACE_MS;
          setBootstrapping(false);
          startPolling(created._id);
          startLocationWatcher(created._id);
        }
      } catch (e: unknown) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : 'Could not activate SOS';
        showError('Unable to activate SOS', msg);
        setBootstrapping(false);
      }
    })();

    return () => {
      active = false;
      mountedRef.current = false;
      stopPolling();
      stopLocationWatcher();
      stopCancelTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Tick the cancel-grace countdown so the user sees seconds remaining.
   */
  useEffect(() => {
    cancelTickRef.current = setInterval(() => {
      const remaining = Math.max(0, cancelDeadlineRef.current - Date.now());
      setCancelRemainingMs(remaining);
      if (remaining <= 0) {
        stopCancelTimer();
      }
    }, 250);
    return () => stopCancelTimer();
  }, [stopCancelTimer]);

  const canQuickCancel = cancelRemainingMs > 0 && (status === 'pending' || status === 'notifying' || status === 'notified');
  const canConfirmCancel = !canQuickCancel && status !== 'cancelled' && status !== 'resolved';

  const performCancel = useCallback(async () => {
    if (!sosId) {
      navigation.goBack();
      return;
    }
    try {
      const next = await cancelSOS(sosId);
      setAlert(next);
      setStatus(next.status);
      stopPolling();
      stopLocationWatcher();
      Alert.alert('SOS cancelled', 'Your SOS has been cancelled.');
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not cancel SOS';
      showError('Cancel failed', msg);
    }
  }, [navigation, showError, sosId, stopLocationWatcher, stopPolling]);

  const handleCancelPress = useCallback(() => {
    if (canQuickCancel) {
      void performCancel();
      return;
    }
    Alert.alert(
      'Cancel SOS?',
      'Cancelling will tell responders you no longer need help. Are you sure?',
      [
        { text: 'Keep active', style: 'cancel' },
        { text: 'Cancel SOS', style: 'destructive', onPress: () => void performCancel() },
      ],
    );
  }, [canQuickCancel, performCancel]);

  const handleCallEmergency = useCallback(async () => {
    const phone = alert?.emergencyContact?.phone ?? initialContactPhone ?? '000';
    const url = `tel:${phone}`;
    try {
      // Try to open the dialer directly. We skip Linking.canOpenURL because
      // some emulators report tel: as unsupported even when a dialer exists.
      await Linking.openURL(url);
    } catch {
      showError(
        'Cannot place call',
        `We could not start a call to ${phone}. If you're on an emulator, try a real device.`,
      );
    }
  }, [alert?.emergencyContact?.phone, initialContactPhone, showError]);

  const handleSaveNote = useCallback(async () => {
    if (!sosId) return;
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      setNoteVisible(false);
      return;
    }
    try {
      setNoteSaving(true);
      const next = await addSOSNote(sosId, trimmed);
      setAlert(next);
      setNoteVisible(false);
      setNoteDraft('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save note';
      showError('Note failed', msg);
    } finally {
      setNoteSaving(false);
    }
  }, [noteDraft, showError, sosId]);

  const cancelSecondsRemaining = Math.ceil(cancelRemainingMs / 1000);

  const contactLabel =
    alert?.emergencyContact?.name ?? initialContactName ?? 'Emergency Contact';
  const contactPhone =
    alert?.emergencyContact?.phone ?? initialContactPhone ?? '000';

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.banner}>
          <Ionicons name="warning" size={42} color="#FFFFFF" />
          <Text style={s.bannerTitle}>EMERGENCY ACTIVE</Text>
          <Text style={s.bannerSubtitle}>SOS Sent</Text>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="time-outline" size={20} color={colors.muted} />
            <Text style={s.rowLabel}>Triggered</Text>
            <Text style={s.rowValue}>{formatTime(triggeredAt ?? alert?.triggeredAt)}</Text>
          </View>

          <View style={s.row}>
            <Ionicons name="pulse-outline" size={20} color={colors.muted} />
            <Text style={s.rowLabel}>Status</Text>
            <View style={s.statusValueWrap}>
              {bootstrapping ? <ActivityIndicator size="small" color="#B00020" /> : null}
              <Text style={[s.rowValue, s.statusValue]}>{STATUS_LABELS[status]}</Text>
            </View>
          </View>

          {alert?.statusMessage ? <Text style={s.statusMessage}>{alert.statusMessage}</Text> : null}
        </View>

        <View style={s.card}>
          <View style={s.locHeader}>
            <Ionicons name="location" size={20} color="#B00020" />
            <Text style={s.locHeaderText}>Sharing live location</Text>
          </View>
          <Text style={s.coords}>
            {formatCoord(coords?.latitude)}, {formatCoord(coords?.longitude)}
          </Text>
          <Text style={s.coordsHint}>
            Updates every {Math.round(LOCATION_PUSH_INTERVAL_MS / 1000)}s while SOS is active.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.callBtn]} onPress={handleCallEmergency}>
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text style={s.btnText}>Call {contactLabel}</Text>
          </TouchableOpacity>
          <Text style={s.callHint}>{contactPhone}</Text>

          <TouchableOpacity
            style={[s.btn, s.noteBtn]}
            onPress={() => {
              setNoteDraft(alert?.note ?? '');
              setNoteVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            <Text style={s.btnText}>{alert?.note ? 'Update Note' : 'Add Note'}</Text>
          </TouchableOpacity>

          {(canQuickCancel || canConfirmCancel) ? (
            <TouchableOpacity
              style={[s.btn, canQuickCancel ? s.cancelQuickBtn : s.cancelConfirmBtn]}
              onPress={handleCancelPress}
            >
              <Text style={s.btnText}>
                {canQuickCancel
                  ? `Cancel SOS (${cancelSecondsRemaining}s)`
                  : 'Cancel SOS'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!canQuickCancel && status !== 'cancelled' && status !== 'resolved' ? (
            <Text style={s.graceHint}>
              Quick cancel window has ended. Tap Cancel SOS to confirm.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={noteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Update situation</Text>
            <TextInput
              style={s.modalInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Describe what's happening..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />
            <View style={s.modalActions}>
              <Pressable style={s.modalBtnSecondary} onPress={() => setNoteVisible(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnPrimary, noteSaving ? s.modalBtnDisabled : null]}
                disabled={noteSaving}
                onPress={() => void handleSaveNote()}
              >
                {noteSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.modalBtnPrimaryText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        onClose={closeError}
      />
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#1A0000',
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    banner: {
      backgroundColor: '#B00020',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: '#FF3B3B',
    },
    bannerTitle: {
      color: '#FFFFFF',
      fontSize: 26,
      fontWeight: '900',
      marginTop: 8,
      letterSpacing: 1,
    },
    bannerSubtitle: {
      color: '#FFD9DD',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    rowLabel: {
      marginLeft: 10,
      flex: 1,
      fontSize: 15,
      color: colors.muted,
      fontWeight: '600',
    },
    rowValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '700',
    },
    statusValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusValue: {
      color: '#B00020',
    },
    statusMessage: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 4,
    },
    locHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locHeaderText: {
      marginLeft: 8,
      color: '#B00020',
      fontWeight: '700',
      fontSize: 16,
    },
    coords: {
      color: colors.text,
      fontSize: 16,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    coordsHint: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 6,
    },
    actions: {
      marginTop: 4,
    },
    btn: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    callBtn: {
      backgroundColor: '#B00020',
    },
    noteBtn: {
      backgroundColor: '#244B7A',
    },
    cancelQuickBtn: {
      backgroundColor: '#9E9E9E',
    },
    cancelConfirmBtn: {
      backgroundColor: '#4B5563',
    },
    btnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    callHint: {
      color: '#FFD9DD',
      textAlign: 'center',
      marginTop: -6,
      marginBottom: 12,
    },
    graceHint: {
      color: '#FFD9DD',
      textAlign: 'center',
      fontSize: 13,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    modalInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      color: colors.text,
      fontSize: 15,
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalBtnSecondary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    modalBtnSecondaryText: {
      color: colors.muted,
      fontWeight: '600',
    },
    modalBtnPrimary: {
      backgroundColor: '#B00020',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    modalBtnDisabled: {
      opacity: 0.7,
    },
    modalBtnPrimaryText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
