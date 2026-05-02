// src/components/FloatingSOSButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, Vibration } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';

const HOLD_DURATION_MS = 2000;
const SIZE = 64;

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  /** Optional override for hold-to-trigger duration */
  holdDurationMs?: number;
  /** Optional bottom offset (e.g. to clear a tab bar) */
  bottomOffset?: number;
  /** Optional right offset */
  rightOffset?: number;
};

export default function FloatingSOSButton({
  holdDurationMs = HOLD_DURATION_MS,
  bottomOffset = 90,
  rightOffset = 20,
}: Props) {
  const navigation = useNavigation<Nav>();

  const [holding, setHolding] = useState(false);

  // Animated values are created lazily once and remain stable across renders.
  // Using useState (rather than useRef + .current) keeps the new
  // react-hooks/refs lint rule happy.
  const [progress] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const triggeredRef = useRef(false);

  const reset = useCallback(() => {
    progress.stopAnimation();
    scale.stopAnimation();
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
    setHolding(false);
    triggeredRef.current = false;
  }, [progress, scale]);

  const startHold = useCallback(() => {
    triggeredRef.current = false;
    setHolding(true);

    Animated.spring(scale, {
      toValue: 1.1,
      useNativeDriver: false,
    }).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: holdDurationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !triggeredRef.current) {
        triggeredRef.current = true;
        Vibration.vibrate(200);
        reset();
        navigation.navigate('ActiveSOS');
      }
    });
  }, [holdDurationMs, navigation, progress, reset, scale]);

  const cancelHold = useCallback(() => {
    if (triggeredRef.current) return;
    reset();
  }, [reset]);

  // Cleanup if the component unmounts mid-hold
  useEffect(() => {
    return () => {
      progress.stopAnimation();
      scale.stopAnimation();
    };
  }, [progress, scale]);

  const ringRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringOpacity = progress.interpolate({
    inputRange: [0, 0.05, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset, right: rightOffset }]}
      pointerEvents="box-none"
    >
      {holding ? <Text style={styles.hint}>Hold to send SOS</Text> : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityLabel="Trigger SOS"
          accessibilityHint="Press and hold for 2 seconds to send an emergency SOS"
          onPressIn={startHold}
          onPressOut={cancelHold}
          style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: ringOpacity,
                transform: [{ rotate: ringRotation }],
              },
            ]}
          />
          <Ionicons name="warning" size={26} color="#C62034" />
          <Text style={styles.label}>SOS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 1000,
    elevation: 12,
  },
  hint: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(198, 32, 52, 0.85)',
  },
  buttonPressed: {
    backgroundColor: 'rgba(198, 32, 52, 0.92)',
  },
  ring: {
    position: 'absolute',
    width: SIZE + 12,
    height: SIZE + 12,
    borderRadius: (SIZE + 12) / 2,
    borderWidth: 3,
    borderColor: '#C62034',
    borderTopColor: 'transparent',
  },
  label: {
    color: '#C62034',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
});
