import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ErrorMessageBox from './ErrorMessageBox';
import { useAppTheme } from '../theme';

type LocationPayload = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onVerified: (loc: LocationPayload) => void;
};

type Status = 'idle' | 'requesting' | 'checking';

type ErrorState = {
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
} | null;

export default function LocationVerificationModal({ visible, onClose, onVerified }: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [status, setStatus] = useState<Status>('idle');
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const retryRequestedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    setStatus('idle');
    setErrorState(null);
  }, []);

  const closeErrorBox = useCallback(() => {
    setErrorState(null);
  }, []);

  const showErrorBox = useCallback((next: ErrorState) => {
    setErrorState(next);
  }, []);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      showErrorBox({
        title: 'Open Settings manually',
        message:
          Platform.OS === 'ios'
            ? 'Please open Settings > Privacy & Security > Location Services and enable permission for the app.'
            : 'Please open Settings > Location and enable permission for the app.',
        primaryLabel: 'OK',
        onPrimaryPress: closeErrorBox,
      });
    }
  }, [closeErrorBox, showErrorBox]);

  const startCheck = useCallback(async () => {
    try {
      retryRequestedRef.current = false;
      setStatus('requesting');
      setErrorState(null);
      clearTimer();

      timerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;

        setStatus('idle');
        showErrorBox({
          title: 'Location check timed out',
          message: 'We could not get your location in time. Please try again.',
          primaryLabel: 'Retry',
          onPrimaryPress: () => {
            closeErrorBox();
            retryRequestedRef.current = true;
          },
          secondaryLabel: 'Cancel',
          onSecondaryPress: () => {
            closeErrorBox();
            onClose();
          },
        });
      }, 30000);

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        clearTimer();
        setStatus('idle');
        showErrorBox({
          title: 'Turn on location services',
          message:
            'Location services are turned off on this device. Please enable them and try again.',
          primaryLabel: 'Open Settings',
          onPrimaryPress: () => {
            closeErrorBox();
            void openSettings();
          },
          secondaryLabel: 'Cancel',
          onSecondaryPress: () => {
            closeErrorBox();
            onClose();
          },
        });
        return;
      }

      let perm = await Location.getForegroundPermissionsAsync();

      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }

      if (perm.status !== 'granted') {
        clearTimer();
        setStatus('idle');

        if (perm.canAskAgain === false) {
          showErrorBox({
            title: 'Location access needed',
            message:
              'Location permission has been turned off for this app. Please enable it in Settings to continue.',
            primaryLabel: 'Open Settings',
            onPrimaryPress: () => {
              closeErrorBox();
              void openSettings();
            },
            secondaryLabel: 'Cancel',
            onSecondaryPress: () => {
              closeErrorBox();
              onClose();
            },
          });
        } else {
          showErrorBox({
            title: 'Location permission required',
            message: 'You need to allow location access before you can check in or check out.',
            primaryLabel: 'Try Again',
            onPrimaryPress: () => {
              closeErrorBox();
              retryRequestedRef.current = true;
            },
            secondaryLabel: 'Cancel',
            onSecondaryPress: () => {
              closeErrorBox();
              onClose();
            },
          });
        }
        return;
      }

      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // no-op
        }
      }

      setStatus('checking');

      let loc: Location.LocationObject | null = null;

      try {
        loc = await Promise.race<Location.LocationObject>([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }),
          new Promise<Location.LocationObject>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Location request exceeded internal timeout'));
            }, 20000);
          }),
        ]);
      } catch {
        // fall back to last known position
      }

      if (!loc) {
        const lastKnown = await Location.getLastKnownPositionAsync();

        if (lastKnown) {
          loc = {
            coords: lastKnown.coords,
            timestamp: lastKnown.timestamp,
          } as Location.LocationObject;
        }
      }

      clearTimer();

      if (!loc) {
        setStatus('idle');
        showErrorBox({
          title: 'Unable to get your location',
          message: 'We could not determine your current location. Please try again.',
          primaryLabel: 'Retry',
          onPrimaryPress: () => {
            closeErrorBox();
            retryRequestedRef.current = true;
          },
          secondaryLabel: 'Cancel',
          onSecondaryPress: () => {
            closeErrorBox();
            onClose();
          },
        });
        return;
      }

      if (cancelledRef.current) return;

      setStatus('idle');

      const resolvedTimestamp = typeof loc.timestamp === 'number' ? loc.timestamp : 0;

      onVerified({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: resolvedTimestamp,
      });
    } catch (e: unknown) {
      clearTimer();

      const msg = e instanceof Error ? e.message : 'Failed to get location';
      setStatus('idle');

      showErrorBox({
        title: 'Unable to get your location',
        message: msg,
        primaryLabel: 'Retry',
        onPrimaryPress: () => {
          closeErrorBox();
          retryRequestedRef.current = true;
        },
        secondaryLabel: 'Cancel',
        onSecondaryPress: () => {
          closeErrorBox();
          onClose();
        },
      });
    }
  }, [clearTimer, closeErrorBox, onClose, onVerified, openSettings, showErrorBox]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      cancelledRef.current = false;
      timeoutId = setTimeout(() => {
        void startCheck();
      }, 0);
    } else {
      cancelledRef.current = true;
      clearTimer();
      timeoutId = setTimeout(() => {
        resetState();
      }, 0);
    }

    return () => {
      cancelledRef.current = true;
      clearTimer();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clearTimer, resetState, startCheck, visible]);

  useEffect(() => {
    if (!visible || !retryRequestedRef.current) return;

    const timeoutId = setTimeout(() => {
      retryRequestedRef.current = false;
      void startCheck();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [startCheck, visible, errorState]);

  const renderContent = () => {
    if (status === 'requesting') {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.text}>Requesting permission...</Text>
        </View>
      );
    }

    if (status === 'checking') {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.text}>Verifying your location...</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.card}>
            <Text style={s.title}>Location Verification</Text>
            {renderContent()}
            <Pressable style={s.close} onPress={onClose}>
              <Text style={s.closeText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        primaryLabel={errorState?.primaryLabel}
        onPrimaryPress={errorState?.onPrimaryPress ?? closeErrorBox}
        secondaryLabel={errorState?.secondaryLabel}
        onSecondaryPress={errorState?.onSecondaryPress}
        onClose={closeErrorBox}
      />
    </>
  );
}

const getStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '85%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 20,
      color: colors.text,
    },
    center: {
      alignItems: 'center',
      width: '100%',
    },
    text: {
      marginTop: 12,
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
    },
    close: {
      marginTop: 24,
    },
    closeText: {
      color: colors.muted,
      fontWeight: '500',
    },
  });
