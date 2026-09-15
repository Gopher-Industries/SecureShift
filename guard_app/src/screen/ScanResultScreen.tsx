import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppTheme } from '../theme';
import { checkIn } from '../api/attendance';
import LocationVerificationModal from '../components/modal/LocationVerificationModal';

type ResultRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanResult'>;

export default function ScanResultScreen() {
  const route = useRoute<ResultRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data } = route.params;

  const shiftId = useMemo(() => {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed?.shiftId === 'string' ? parsed.shiftId.trim() : '';
    } catch {
      return '';
    }
  }, [data]);
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

  const isExpired = useMemo(() => {
    try {
      const parsed = JSON.parse(data);

      if (!parsed?.expiresAt) return false;

      const expiresAt = new Date(parsed.expiresAt).getTime();

      return Number.isFinite(expiresAt) && expiresAt < Date.now();
    } catch {
      return false;
    }
  }, [data]);

  const handleLocationVerified = async (loc: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => {
    setLocationModalVisible(false);

    if (submitting) return;

    try {
      setSubmitting(true);

      const res = await checkIn(shiftId, loc);

      Alert.alert(
        'Check-in Successful',
        res.message || 'Your QR check-in was recorded successfully.',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to complete QR check-in.';

      Alert.alert('Check-in Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const { formattedData, isJson } = useMemo(() => {
    try {
      const parsed = JSON.parse(data);
      return {
        formattedData: JSON.stringify(parsed, null, 2),
        isJson: true,
      };
    } catch {
      return {
        formattedData: data,
        isJson: false,
      };
    }
  }, [data]);

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
