/* eslint-disable react-native/no-inline-styles */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Props = {
  rows?: number;
};

export default function LoadingState({ rows = 3 }: Props) {
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const fade = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [fade]);

  return (
    <View style={s.wrap}>
      {Array.from({ length: rows }).map((_, index) => (
        <Animated.View key={index} style={[s.card, { opacity: fade }]}>
          <View style={s.lineTitle} />
          <View style={s.line} />
          <View style={s.lineShort} />
        </Animated.View>
      ))}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
    },
    line: {
      backgroundColor: colors.border,
      borderRadius: 6,
      height: 12,
      marginBottom: 8,
      width: '90%',
    },
    lineShort: {
      backgroundColor: colors.border,
      borderRadius: 6,
      height: 12,
      width: '55%',
    },
    lineTitle: {
      backgroundColor: colors.border,
      borderRadius: 6,
      height: 16,
      marginBottom: 12,
      width: '70%',
    },
    wrap: {
      padding: 16,
    },
  });
