import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AllShift } from '../../models/Shifts';
import type { AppColors } from '../../theme/colors';

type Props = {
  visible: boolean;
  shift: AllShift | null;
  colors: AppColors;
  applying?: boolean;
  onClose: () => void;
  onConfirm: (signature?: string) => void;
};

type Point = {
  x: number;
  y: number;
};

export default function ShiftAcknowledgementModal({
  visible,
  shift,
  colors,
  applying = false,
  onClose,
  onConfirm,
}: Props) {
  const s = getStyles(colors);
  const [acknowledged, setAcknowledged] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    if (!visible) {
      setAcknowledged(false);
      setPoints([]);
    }
  }, [visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setPoints([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setPoints((current) => [...current, { x: locationX, y: locationY }]);
        },
      }),
    [],
  );

  if (!shift) return null;

  const signature = points.length > 0 ? JSON.stringify(points) : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={(event) => event.stopPropagation()}>
          <View style={s.header}>
            <Text style={s.title}>Shift Acknowledgement</Text>

            <TouchableOpacity onPress={onClose} disabled={applying}>
              <Text style={s.close}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.shiftTitle}>{shift.title}</Text>
          <Text style={s.site}>{shift.site}</Text>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Site Instructions</Text>
            <Text style={s.instructions}>
              {shift.detailedInstructions?.trim() || 'No additional site instructions provided.'}
            </Text>
          </View>

          <TouchableOpacity
            style={s.checkboxRow}
            onPress={() => setAcknowledged((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            accessibilityLabel="I acknowledge the shift terms and site instructions"
          >
            <View style={[s.checkbox, acknowledged && s.checkboxChecked]}>
              {acknowledged ? <Text style={s.checkmark}>✓</Text> : null}
            </View>

            <Text style={s.checkboxText}>
              I have read and acknowledge the shift terms and site instructions.
            </Text>
          </TouchableOpacity>

          <View style={s.section}>
            <View style={s.signatureHeader}>
              <Text style={s.sectionTitle}>Signature (optional)</Text>

              {points.length > 0 ? (
                <TouchableOpacity onPress={() => setPoints([])}>
                  <Text style={s.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View
              style={s.signatureBox}
              {...panResponder.panHandlers}
              accessible
              accessibilityLabel="Optional signature area"
            >
              {points.map((point, index) => (
                <View
                  key={`${point.x}-${point.y}-${index}`}
                  style={[
                    s.signaturePoint,
                    {
                      left: point.x - 2,
                      top: point.y - 2,
                    },
                  ]}
                />
              ))}

              {points.length === 0 ? (
                <Text style={s.signatureHint}>
                  Draw your signature here if you want to add one.
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={[s.confirmButton, (!acknowledged || applying) && s.confirmButtonDisabled]}
            disabled={!acknowledged || applying}
            onPress={() => onConfirm(signature)}
            accessibilityRole="button"
            accessibilityState={{ disabled: !acknowledged || applying }}
          >
            <Text style={s.confirmButtonText}>
              {applying ? 'Applying...' : 'Acknowledge & Apply'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    close: {
      fontSize: 26,
      color: colors.muted,
    },
    shiftTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    site: {
      marginTop: 4,
      fontSize: 13,
      color: colors.muted,
    },
    section: {
      marginTop: 18,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    instructions: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      backgroundColor: colors.primarySoft,
      padding: 12,
      borderRadius: 10,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 18,
      gap: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
    checkboxText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    signatureHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    clearText: {
      color: colors.link,
      fontSize: 13,
      fontWeight: '600',
    },
    signatureBox: {
      height: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.bg,
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signaturePoint: {
      position: 'absolute',
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text,
    },
    signatureHint: {
      color: colors.muted,
      fontSize: 13,
      paddingHorizontal: 20,
      textAlign: 'center',
    },
    confirmButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
    confirmButtonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
