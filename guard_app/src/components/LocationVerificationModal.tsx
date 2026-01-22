import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';

import { COLORS } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVerified: (loc: { latitude: number; longitude: number; timestamp: number }) => void;
};

export default function LocationVerificationModal({ visible, onClose, onVerified }: Props) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'checking' | 'failed' | 'denied'>(
    'idle',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      startCheck();
    } else {
      // reset on close
      setStatus('idle');
      setErrorMsg(null);
    }
  }, [visible]);

  const startCheck = async () => {
    try {
      setStatus('requesting');
      setErrorMsg(null);

      // 1. Request Permission
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setStatus('denied');
        return;
      }

      // 2. Get Location
      setStatus('checking');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // 3. Success
      onVerified({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
      });

      // Note: We don't close automatically here, we let the parent do it
      // or we can show a success state if needed. But usually parent calls API immediately.
    } catch (e: any) {
      console.error('Location error:', e);
      setStatus('failed');
      setErrorMsg(e.message || 'Failed to get location');
    }
  };

  const openSettings = () => {
    // Expo doesn't have a direct openSettings for Location but Linking can work.
    // For now, just alert user.
    Alert.alert(
      'Permission Required',
      'Please enable location permissions in your device settings.',
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Location Verification</Text>

          {status === 'requesting' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.text}>Requesting permission...</Text>
            </View>
          )}

          {status === 'checking' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.text}>Verifying your location...</Text>
            </View>
          )}

          {status === 'denied' && (
            <View style={s.center}>
              <Text style={s.errorText}>Location permission is required to check in/out.</Text>
              <Pressable style={s.btn} onPress={startCheck}>
                <Text style={s.btnText}>Try Again</Text>
              </Pressable>
              <Pressable style={[s.btn, s.btnSec]} onPress={openSettings}>
                <Text style={[s.btnText, s.btnTextSec]}>Open Settings</Text>
              </Pressable>
            </View>
          )}

          {status === 'failed' && (
            <View style={s.center}>
              <Text style={s.errorText}>Failed to get location.</Text>
              <Text style={s.muted}>{errorMsg}</Text>
              <Pressable style={s.btn} onPress={startCheck}>
                <Text style={s.btnText}>Retry</Text>
              </Pressable>
            </View>
          )}

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
    p: 20,
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
  errorText: { color: COLORS.status.rejected, textAlign: 'center', marginBottom: 12, fontSize: 15 },
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
