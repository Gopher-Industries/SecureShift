import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getNextIndex,
  getPrevIndex,
  isFirstStep,
  isLastStep,
  TOUR_STEP_COUNT,
  TOUR_STEPS,
} from '../lib/onboarding';
import { useAppTheme } from '../theme';
import type { AppColors } from '../theme/colors';

type Props = {
  visible: boolean;
  /** Called when the user finishes the last step or skips. */
  onFinish: () => void;
};

// Approximate anchor rectangles for the coach-mark spotlights. These mirror the
// fixed layout of FloatingSOSButton (bottom: 90, right: 20, size: 64) and the
// bottom tab bar, so we can highlight them without brittle ref measuring.
const SOS_SIZE = 64;
const SOS_BOTTOM = 90;
const SOS_RIGHT = 20;
const SPOTLIGHT_PAD = 10;
const TABBAR_HEIGHT = 64;

function anchorRect(anchor: 'sos' | 'tabbar' | undefined) {
  const { width, height } = Dimensions.get('window');

  if (anchor === 'sos') {
    return {
      left: width - SOS_RIGHT - SOS_SIZE - SPOTLIGHT_PAD,
      top: height - SOS_BOTTOM - SOS_SIZE - SPOTLIGHT_PAD,
      width: SOS_SIZE + SPOTLIGHT_PAD * 2,
      height: SOS_SIZE + SPOTLIGHT_PAD * 2,
    };
  }

  // tab bar: a full-width strip along the very bottom.
  return {
    left: 0,
    top: height - TABBAR_HEIGHT,
    width,
    height: TABBAR_HEIGHT,
  };
}

export default function OnboardingTour({ visible, onFinish }: Props) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [index, setIndex] = useState(0);

  // Restart from the first step every time the tour opens (fresh + replay).
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  if (!visible) return null;

  const step = TOUR_STEPS[index];
  const last = isLastStep(index);
  const first = isFirstStep(index);

  const handleNext = () => {
    if (last) onFinish();
    else setIndex((i) => getNextIndex(i));
  };

  const handleBack = () => setIndex((i) => getPrevIndex(i));

  const rect = step.kind === 'spotlight' ? anchorRect(step.anchor) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onFinish}
    >
      <View style={styles.root} testID="onboarding-tour">
        {rect ? (
          <>
            {/* Transparent catcher so taps on the highlighted control don't fire it. */}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />
            {/* Four dim panels around the anchor create a spotlight "hole". */}
            <View style={[styles.dim, { top: 0, left: 0, right: 0, height: rect.top }]} />
            <View
              style={[
                styles.dim,
                { top: rect.top, left: 0, width: rect.left, height: rect.height },
              ]}
            />
            <View
              style={[
                styles.dim,
                {
                  top: rect.top,
                  left: rect.left + rect.width,
                  right: 0,
                  height: rect.height,
                },
              ]}
            />
            <View
              style={[styles.dim, { top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }]}
            />
            {/* Highlight ring around the anchor. */}
            <View
              pointerEvents="none"
              style={[
                styles.ring,
                { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
              ]}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.dimFull]} />
        )}

        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.card}>
            <Pressable
              style={styles.skip}
              onPress={onFinish}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.skip')}
              testID="onboarding-skip"
            >
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </Pressable>

            <View style={styles.iconCircle}>
              <Ionicons name={step.icon} size={30} color={colors.primary} />
            </View>

            <Text style={styles.title}>{t(step.titleKey)}</Text>
            <Text style={styles.body}>{t(step.bodyKey)}</Text>

            <View style={styles.dots}>
              {TOUR_STEPS.map((s, i) => (
                <View
                  key={s.id}
                  style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
                />
              ))}
            </View>

            <View style={styles.controls}>
              <Pressable
                onPress={handleBack}
                disabled={first}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.back')}
                testID="onboarding-back"
                style={[styles.backBtn, first && styles.backBtnHidden]}
              >
                <Text style={styles.backText}>{t('onboarding.back')}</Text>
              </Pressable>

              <Text style={styles.counter}>
                {index + 1}/{TOUR_STEP_COUNT}
              </Text>

              <Pressable
                onPress={handleNext}
                accessibilityRole="button"
                accessibilityLabel={last ? t('onboarding.done') : t('onboarding.next')}
                testID="onboarding-next"
                style={styles.nextBtn}
              >
                <Text style={styles.nextText}>
                  {last ? t('onboarding.done') : t('onboarding.next')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1 },
    dim: { backgroundColor: 'rgba(0,0,0,0.72)', position: 'absolute' },
    dimFull: { backgroundColor: 'rgba(0,0,0,0.72)' },
    ring: {
      borderColor: colors.primary,
      borderRadius: 16,
      borderWidth: 3,
      position: 'absolute',
    },
    centerWrap: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 28,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      elevation: 8,
      maxWidth: 420,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      width: '100%',
    },
    skip: { alignSelf: 'flex-end', padding: 4 },
    skipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    iconCircle: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 32,
      height: 64,
      justifyContent: 'center',
      marginBottom: 14,
      marginTop: 4,
      width: 64,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 10,
      textAlign: 'center',
    },
    body: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    dots: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 18,
    },
    dot: { borderRadius: 4, height: 8, marginHorizontal: 4, width: 8 },
    dotActive: { backgroundColor: colors.primary },
    dotInactive: { backgroundColor: colors.border },
    controls: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    backBtn: { paddingHorizontal: 8, paddingVertical: 10 },
    backBtnHidden: { opacity: 0 },
    backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
    counter: { color: colors.muted, fontSize: 13 },
    nextBtn: {
      backgroundColor: colors.primary,
      borderRadius: 9999,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    nextText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  });
