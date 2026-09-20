import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { checkIn } from '../api/attendance';
import LocationVerificationModal from '../components/modal/LocationVerificationModal';
import { enqueueAttendance } from '../lib/attendanceQueue';
import { setAttendanceForShift } from '../lib/attendancestore';
import { getIsConnected } from '../lib/networkStatus';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppTheme } from '../theme';

type ResultRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanResult'>;

export default function ScanResultScreen() {
  const route = useRoute<ResultRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data } = route.params;
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }, [data]);
  const shiftId = useMemo(
    () => (typeof parsedData?.shiftId === 'string' ? parsedData.shiftId.trim() : ''),
    [parsedData],
  );
  const isExpired = useMemo(() => {
    if (!parsedData?.expiresAt) return false;

    const expiresAt = new Date(parsedData.expiresAt).getTime();

    return Number.isFinite(expiresAt) && expiresAt < Date.now();
  }, [parsedData]);
  const handleTriggerAction = () => {
    if (!shiftId) {
      Alert.alert('Invalid QR Code', 'This QR code does not contain a valid shift ID.');
      return;
    }
    if (isExpired) {
      Alert.alert('Expired QR Code', 'This QR code has expired. Please scan a valid code.');
      return;
    }
    setLocationModalVisible(true);
  };
  const saveCheckInOffline = async (loc: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => {
    await enqueueAttendance({
      shiftId,
      type: 'check-in',
      location: loc,
    });

    const next = {
      checkInTime: new Date(loc.timestamp).toISOString(),
      checkOutTime: undefined,
    };

    await setAttendanceForShift(shiftId, next);

    Alert.alert(
      'Saved offline',
      'Your check-in was saved and will sync automatically when you are back online.',
    );
  };
  const handleLocationVerified = async (loc: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => {
    setLocationModalVisible(false);

    if (submitting) return;

    try {
      setSubmitting(true);
      if (!(await getIsConnected())) {
        await saveCheckInOffline(loc);
        return;
      }
      const res = await checkIn(shiftId, loc);
      const next = {
        checkInTime: res.attendance?.checkInTime ?? new Date().toISOString(),
        checkOutTime: res.attendance?.checkOutTime ?? undefined,
      };

      await setAttendanceForShift(shiftId, next);
      Alert.alert(
        'Check-in Successful',
        res.message || 'Your QR check-in was recorded successfully.',
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError && !error.response) {
        await saveCheckInOffline(loc);
        return;
      }

      const message = error instanceof Error ? error.message : 'Unable to complete QR check-in.';

      Alert.alert('Check-in Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const { formattedData, isJson } = useMemo(() => {
    if (parsedData !== null) {
      return {
        formattedData: JSON.stringify(parsedData, null, 2),
        isJson: true,
      };
    }

    return {
      formattedData: data,
      isJson: false,
    };
  }, [data, parsedData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Scanned Content</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.content, { color: colors.text }]}>{formattedData}</Text>
        </View>
        {!isJson && (
          <Text style={[styles.warning, { color: colors.status.rejected }]}>
            Note: The scanned content is not a valid JSON.
          </Text>
        )}
      </ScrollView>
      <View
        style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleTriggerAction}
        >
          <Text style={styles.buttonText}>Trigger Action</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.muted }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.closeButton,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
      <LocationVerificationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onVerified={handleLocationVerified}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 150,
  },
  content: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  warning: {
    marginTop: 10,
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  closeButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});
