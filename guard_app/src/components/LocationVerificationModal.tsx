import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking,
  Platform,
} from 'react-native';

import { COLORS } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVerified: (loc: { latitude: number; longitude: number; timestamp: number }) => void;
};

type Status = 'idle' | 'requesting' | 'checking' | 'failed' | 'denied' | 'permanentDenied';

export default function LocationVerificationModal({ visible, onClose, onVerified }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) startCheck();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startCheck = async () => {
    try {
      setStatus('requesting');
      setErrorMsg(null);

      // timeout after 15s
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setStatus('failed');
        setErrorMsg('Timed out while getting your location. Please try again.');
      }, 15000);

      // 1) permission
      const perm = await Location.requestForegroundPermissionsAsync();

      if (perm.status !== 'granted') {
        if (perm.canAskAgain === false) setStatus('permanentDenied');
        else setStatus('denied');
        return;
      }

      // 2) location
      setStatus('checking');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // clear timeout
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      // 3) success
      onVerified({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp ?? Date.now(),
      });
    } catch (e: any) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      setStatus('failed');
      setErrorMsg(e?.message || 'Failed to get location');
    }
  };

  const openSettings = async () => {
    try {
      // Works in most modern RN/Expo setups
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Open Settings',
        Platform.select({
          ios: 'Please open Settings > Privacy & Security > Location Services and enable permission.',
          android: 'Please open Settings > Location and enable permission for the app.',
          default: 'Please open device settings and enable location permission.',
        }) as string,
      );
    }
  };

  const content = () => {
    if (status === 'requesting') {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.text}>Requesting permission...</Text>
        </View>
      );
    }

    if (status === 'checking') {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.text}>Verifying your location...</Text>
        </View>
      );
    }

    if (status === 'denied') {
      return (
        <View style={s.center}>
          <Text style={s.errorText}>Location permission is required to check in/out.</Text>
          <Pressable style={s.btn} onPress={startCheck}>
            <Text style={s.btnText}>Try Again</Text>
          </Pressable>
          <Pressable style={[s.btn, s.btnSec]} onPress={openSettings}>
            <Text style={[s.btnText, s.btnTextSec]}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'permanentDenied') {
      return (
        <View style={s.center}>
          <Text style={s.errorText}>
            Location permission is permanently denied. Please enable it in Settings to continue.
          </Text>
          <Pressable style={s.btn} onPress={openSettings}>
            <Text style={s.btnText}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={s.center}>
          <Text style={s.errorText}>Failed to get location.</Text>
          {!!errorMsg && <Text style={s.muted}>{errorMsg}</Text>}
          <Pressable style={s.btn} onPress={startCheck}>
            <Text style={s.btnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        // Prevent accidental Android back dismiss (parent controls closing)
      }}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Location Verification</Text>

          {content()}

          <Pressable style={s.close} onPress={onClose}>
            <Text style={s.closeText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // ✅ fixed (was p: 20)
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#111' },
  center: { alignItems: 'center', width: '100%' },
  text: { marginTop: 12, fontSize: 16, color: '#444' },
  errorText: {
    color: COLORS.status.rejected,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 15,
  },
  muted: { color: '#666', fontSize: 13, marginBottom: 12, textAlign: 'center' },

  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  btnSec: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ccc', marginTop: 12 },
  btnTextSec: { color: '#555' },

  close: { marginTop: 24 },
  closeText: { color: '#888', fontWeight: '500' },
});
