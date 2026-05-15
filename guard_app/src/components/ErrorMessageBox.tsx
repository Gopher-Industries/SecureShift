import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme';

type Props = {
  visible: boolean;

  title?: string;

  message?: string;

  onClose?: () => void;

  primaryLabel?: string;

  onPrimaryPress?: () => void;

  secondaryLabel?: string;

  onSecondaryPress?: () => void;
};

export default function ErrorMessageBox({
  visible,

  title = 'Something went wrong',

  message = 'Please try again.',

  onClose,

  primaryLabel = 'OK',

  onPrimaryPress,

  secondaryLabel,

  onSecondaryPress,
}: Props) {
  const { colors } = useAppTheme();

  const s = getStyles(colors);

  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();

      return;
    }

    if (onClose) {
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();

      return;
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handlePrimaryPress}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>!</Text>
          </View>

          <Text style={s.title}>{title}</Text>

          <Text style={s.message}>{message}</Text>

          <View style={s.actions}>
            <Pressable style={[s.button, s.primaryButton]} onPress={handlePrimaryPress}>
              <Text style={s.buttonText}>{primaryLabel}</Text>
            </Pressable>

            {secondaryLabel ? (
              <Pressable style={[s.button, s.secondaryButton]} onPress={handleSecondaryPress}>
                <Text style={[s.buttonText, s.secondaryButtonText]}>{secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,

      backgroundColor: 'rgba(0, 0, 0, 0.5)',

      justifyContent: 'center',

      alignItems: 'center',

      padding: 20,
    },

    card: {
      width: '100%',

      maxWidth: 380,

      backgroundColor: colors.card,

      borderRadius: 16,

      padding: 20,

      borderWidth: 1,

      borderColor: colors.border,

      elevation: 4,

      shadowColor: '#000',

      shadowOpacity: 0.12,

      shadowRadius: 10,
    },

    iconWrap: {
      width: 48,

      height: 48,

      borderRadius: 24,

      alignSelf: 'center',

      justifyContent: 'center',

      alignItems: 'center',

      marginBottom: 14,

      backgroundColor: colors.status.rejected,
    },

    icon: {
      color: colors.white,

      fontSize: 26,

      fontWeight: '800',
    },

    title: {
      fontSize: 20,

      fontWeight: '800',

      color: colors.text,

      textAlign: 'center',

      marginBottom: 10,
    },

    message: {
      fontSize: 15,

      lineHeight: 22,

      color: colors.muted,

      textAlign: 'center',

      marginBottom: 20,
    },

    actions: {
      gap: 10,
    },

    button: {
      paddingVertical: 12,

      borderRadius: 10,

      alignItems: 'center',
    },

    primaryButton: {
      backgroundColor: colors.primary,
    },

    secondaryButton: {
      backgroundColor: colors.primarySoft,

      borderWidth: 1,

      borderColor: colors.border,
    },

    buttonText: {
      color: colors.white,

      fontWeight: '700',

      fontSize: 15,
    },

    secondaryButtonText: {
      color: colors.text,
    },
  });
