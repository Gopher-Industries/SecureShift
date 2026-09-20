import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { getUserProfile } from '../api/profile';
import {
  addSOSNote,
  cancelSOS,
  getSOSStatus,
  SOSAlert,
  SOSStatus,
  triggerSOS,
  updateSOSLocation,
} from '../api/sos';
import {
  CANCEL_GRACE_MS,
  LOCATION_DISTANCE_INTERVAL_M,
  LOCATION_PUSH_INTERVAL_MS,
  STATUS_POLL_MS,
  type Coords,
} from '../utils/sos';

import type { RootStackParamList } from '../navigation/AppNavigator';

type ScreenRouteProp = RouteProp<RootStackParamList, 'ActiveSOS'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// GA-021 — all Active SOS state/effects/handlers, extracted from the screen
// unchanged so the screen is render-only.
export function useActiveSOS() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<Nav>();

  const initialSosId = route.params?.sosId;
  const initialContactPhone = route.params?.emergencyContact?.phone;
  const initialContactName = route.params?.emergencyContact?.name;

  const [sosId, setSosId] = useState<string | null>(initialSosId ?? null);
  const [alert, setAlert] = useState<SOSAlert | null>(null);
  const [guardProfile, setGuardProfile] = useState<any>(null);
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
  const [initialDeadline] = useState(() => Date.now() + CANCEL_GRACE_MS);
  const cancelDeadlineRef = useRef<number>(initialDeadline);
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
  const startLocationWatcher = useCallback(async (activeSosId: string) => {
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
          console.log('📍 LOCAL SOS LOCATION UPDATE:', {
            sosId: activeSosId,
            location: next,
            updatedAt: new Date().toISOString(),
          });
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
  }, []);

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

  useEffect(() => {
    let active = true;

    (async () => {
      const profile = await getUserProfile();

      if (!active) return;

      setGuardProfile(profile);

      console.log('👮 GUARD PROFILE FOR SOS:', {
        guardId: profile?._id,
        name: profile?.name,
        email: profile?.email,
        phone: profile?.phone,
        address: profile?.address,
        license: profile?.license,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

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
          cancelDeadlineRef.current = new Date(existing.triggeredAt).getTime() + CANCEL_GRACE_MS;
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
          console.log('🚨 LOCAL SOS DATA:', {
            type: 'SOS_EMERGENCY_ALERT',
            status: 'local_test_only',
            sosId: created._id,

            guardId: guardProfile?._id ?? guardProfile?.id ?? created.guardId,
            guardName: guardProfile?.name,
            guardEmail: guardProfile?.email,
            guardPhone: guardProfile?.phone,
            guardAddress: guardProfile?.address,
            guardLicense: guardProfile?.license,

            shiftId: created.shiftId,
            location: fix,
            triggeredAt: created.triggeredAt,
            emergencyContact: created.emergencyContact,
            message: 'SOS triggered locally for testing only',
          });
          if (!active) return;
          setAlert(created);
          setSosId(created._id);
          setStatus(created.status);
          setTriggeredAt(created.triggeredAt);
          cancelDeadlineRef.current = new Date(created.triggeredAt).getTime() + CANCEL_GRACE_MS;
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

  const canQuickCancel =
    cancelRemainingMs > 0 &&
    (status === 'pending' || status === 'notifying' || status === 'notified');
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

  const contactLabel = alert?.emergencyContact?.name ?? initialContactName ?? 'Emergency Contact';
  const contactPhone = alert?.emergencyContact?.phone ?? initialContactPhone ?? '000';

  return {
    alert,
    coords,
    triggeredAt,
    status,
    bootstrapping,
    canQuickCancel,
    canConfirmCancel,
    cancelSecondsRemaining,
    contactLabel,
    contactPhone,
    noteVisible,
    setNoteVisible,
    noteDraft,
    setNoteDraft,
    noteSaving,
    errorState,
    closeError,
    handleCancelPress,
    handleCallEmergency,
    handleSaveNote,
  };
}
