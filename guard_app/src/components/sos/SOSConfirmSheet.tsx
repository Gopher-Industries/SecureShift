// src/components/sos/SOSConfirmSheet.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';

const TRACK_HEIGHT = 72;
const THUMB_SIZE = 56;
const TRACK_PADDING = 8;
const THUMB_TRAVEL_PADDING = TRACK_PADDING;
const LABEL_FADE_START = 0.25;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type SlideToSendProps = {
  onConfirm: () => void;
  trackWidth: number;
};

function SlideToSend({ onConfirm, trackWidth }: SlideToSendProps) {
  const maxTravel = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PADDING * 2);
  const triggeredRef = useRef(false);
  const thumbXValue = useRef(THUMB_TRAVEL_PADDING);

  const thumbX = useMemo(() => new Animated.Value(THUMB_TRAVEL_PADDING), []);
  const progress = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const id = thumbX.addListener(({ value }) => {
      thumbXValue.current = value;

      const p = maxTravel > 0 ? clamp((value - THUMB_TRAVEL_PADDING) / maxTravel, 0, 1) : 0;

      progress.setValue(p);
    });

    return () => thumbX.removeListener(id);
  }, [maxTravel, progress, thumbX]);

  useEffect(() => {
    triggeredRef.current = false;
    thumbX.setValue(THUMB_TRAVEL_PADDING);
    progress.setValue(0);
    thumbXValue.current = THUMB_TRAVEL_PADDING;
  }, [progress, thumbX, trackWidth]);

  const snapBack = useCallback(() => {
    triggeredRef.current = false;

    Animated.parallel([
      Animated.spring(thumbX, {
        toValue: THUMB_TRAVEL_PADDING,
        useNativeDriver: false,
        friction: 6,
        tension: 80,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      thumbXValue.current = THUMB_TRAVEL_PADDING;
    });
  }, [progress, thumbX]);

  const handleFinishSlide = useCallback(() => {
    if (triggeredRef.current) return;

    const p =
      maxTravel > 0 ? clamp((thumbXValue.current - THUMB_TRAVEL_PADDING) / maxTravel, 0, 1) : 0;

    if (p >= 0.85) {
      triggeredRef.current = true;

      Animated.timing(thumbX, {
        toValue: THUMB_TRAVEL_PADDING + maxTravel,
        duration: 100,
        useNativeDriver: false,
      }).start(() => {
        Vibration.vibrate(200);
        onConfirm();

        setTimeout(() => {
          triggeredRef.current = false;
          thumbX.setValue(THUMB_TRAVEL_PADDING);
          progress.setValue(0);
          thumbXValue.current = THUMB_TRAVEL_PADDING;
        }, 300);
      });
    } else {
      snapBack();
    }
  }, [maxTravel, onConfirm, progress, snapBack, thumbX]);

  /* eslint-disable */
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: () => {
          thumbX.stopAnimation();
        },

        onPanResponderMove: (_evt, gestureState) => {
          if (triggeredRef.current) return;

          const next = clamp(
            THUMB_TRAVEL_PADDING + gestureState.dx,
            THUMB_TRAVEL_PADDING,
            THUMB_TRAVEL_PADDING + maxTravel,
          );

          thumbX.setValue(next);
        },

        onPanResponderRelease: handleFinishSlide,
        onPanResponderTerminate: snapBack,
      }).panHandlers,
    [handleFinishSlide, maxTravel, snapBack, thumbX],
  );
  /* eslint-enable */
  const fillWidth = thumbX.interpolate({
    inputRange: [THUMB_TRAVEL_PADDING, THUMB_TRAVEL_PADDING + Math.max(maxTravel, 1)],
    outputRange: [THUMB_SIZE + TRACK_PADDING, trackWidth - TRACK_PADDING],
    extrapolate: 'clamp',
  });

  const labelOpacity = progress.interpolate({
    inputRange: [0, LABEL_FADE_START],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const arrowsOpacity = progress.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0.4, 0.7, 0],
    extrapolate: 'clamp',
  });

  const thumbGlow = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.trackOuter}>
      <Animated.View style={[styles.fill, { width: fillWidth }]} />

      <Animated.Text style={[styles.trackLabel, { opacity: labelOpacity }]}>
        Slide to send SOS
      </Animated.Text>

      <Animated.View style={[styles.arrows, { opacity: arrowsOpacity }]}>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
      </Animated.View>

      <Animated.View
        {...panHandlers}
        style={[styles.thumb, { transform: [{ translateX: thumbX }], shadowRadius: thumbGlow }]}
      >
        <Ionicons name="warning" size={24} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

export type SOSConfirmSheetProps = {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export default function SOSConfirmSheet({ visible, onConfirm, onDismiss }: SOSConfirmSheetProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const slideAnim = useMemo(() => new Animated.Value(300), []);
  const backdropAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [backdropAnim, slideAnim, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sosBadge}>
            <Ionicons name="warning" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetTitle}>Emergency SOS</Text>
            <Text style={styles.sheetSubtitle}>
              This will alert your supervisor and share your live GPS location.
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#B00020" />
          <Text style={styles.infoText}>Live location will be sent immediately</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#B00020" />
          <Text style={styles.infoText}>Your guard ID and shift details are included</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#B00020" />
          <Text style={styles.infoText}>Emergency contact will be notified</Text>
        </View>

        <View
          style={styles.trackContainer}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          {trackWidth > 0 ? <SlideToSend trackWidth={trackWidth} onConfirm={onConfirm} /> : null}
        </View>

        <Pressable style={styles.cancelLink} onPress={onDismiss}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C0305',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 40, android: 24, default: 24 }),
    borderTopWidth: 1,
    borderColor: 'rgba(176,0,32,0.4)',
    // Shadow for the sheet itself
    shadowColor: '#B00020',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  sosBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B00020',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,80,80,0.6)',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: 'rgba(255,217,221,0.8)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
  },
  trackContainer: {
    marginTop: 20,
    marginBottom: 16,
    height: TRACK_HEIGHT,
  },
  /* ── SlideToSend styles ── */
  trackOuter: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(176,0,32,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(176,0,32,0.55)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(176,0,32,0.65)',
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackLabel: {
    position: 'absolute',
    // Centre the label in the track, offset right of thumb start
    left: THUMB_SIZE + TRACK_PADDING * 3,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,217,221,0.9)',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  arrows: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    left: -4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#B00020',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow / glow — radius animated
    shadowColor: '#FF0000',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelLinkText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontWeight: '600',
  },
});
