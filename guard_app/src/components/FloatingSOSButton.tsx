// src/components/FloatingSOSButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import SOSConfirmSheet from './sos/SOSConfirmSheet';

import type { RootStackParamList } from '../navigation/AppNavigator';

const SIZE = 64;

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  /** Optional bottom offset (e.g. to clear a tab bar) */
  bottomOffset?: number;
  /** Optional right offset */
  rightOffset?: number;
};

export default function FloatingSOSButton({ bottomOffset = 90, rightOffset = 20 }: Props) {
  const navigation = useNavigation<Nav>();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Subtle pulse animation on the FAB to draw attention
  const [pulseScale] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0));
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnim.current?.stop();
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.6);
    pulseAnim.current = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.55,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnim.current.start();
  }, [pulseScale, pulseOpacity]);

  const stopPulse = useCallback(() => {
    pulseAnim.current?.stop();
    pulseScale.setValue(1);
    pulseOpacity.setValue(0);
  }, [pulseScale, pulseOpacity]);

  const handlePress = useCallback(() => {
    startPulse();
    setSheetVisible(true);
  }, [startPulse]);

  const handleDismiss = useCallback(() => {
    stopPulse();
    setSheetVisible(false);
  }, [stopPulse]);

  const handleConfirm = useCallback(() => {
    stopPulse();
    setSheetVisible(false);
    // Navigate immediately – speed is critical in an emergency
    navigation.navigate('ActiveSOS');
  }, [navigation, stopPulse]);

  return (
    <>
      {/* Floating SOS button */}
      <View
        style={[styles.wrapper, { bottom: bottomOffset, right: rightOffset }]}
        pointerEvents="box-none"
      >
        {/* Pulse ring (visible while sheet is open) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />

        <Pressable
          accessibilityLabel="Trigger SOS"
          accessibilityHint="Tap to open emergency SOS confirmation"
          accessibilityRole="button"
          onPress={handlePress}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Ionicons name="warning" size={26} color="#FFFFFF" />
          <Text style={styles.label}>SOS</Text>
        </Pressable>
      </View>

      {/* Confirmation sheet */}
      <SOSConfirmSheet visible={sheetVisible} onConfirm={handleConfirm} onDismiss={handleDismiss} />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(198,32,52,0.45)',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#C62034',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C62034',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 2,
  },
  buttonPressed: {
    backgroundColor: '#9B0018',
    shadowOpacity: 0.3,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
