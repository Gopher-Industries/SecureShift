import { Platform, StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#1A0000',
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    banner: {
      backgroundColor: '#B00020',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: '#FF3B3B',
    },
    bannerTitle: {
      color: '#FFFFFF',
      fontSize: 26,
      fontWeight: '900',
      marginTop: 8,
      letterSpacing: 1,
    },
    bannerSubtitle: {
      color: '#FFD9DD',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    rowLabel: {
      marginLeft: 10,
      flex: 1,
      fontSize: 15,
      color: colors.muted,
      fontWeight: '600',
    },
    rowValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '700',
    },
    statusValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusValue: {
      color: '#B00020',
    },
    statusMessage: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 4,
    },
    locHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locHeaderText: {
      marginLeft: 8,
      color: '#B00020',
      fontWeight: '700',
      fontSize: 16,
    },
    coords: {
      color: colors.text,
      fontSize: 16,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    coordsHint: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 6,
    },
    actions: {
      marginTop: 4,
    },
    btn: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    callBtn: {
      backgroundColor: '#B00020',
    },
    noteBtn: {
      backgroundColor: '#244B7A',
    },
    cancelQuickBtn: {
      backgroundColor: '#9E9E9E',
    },
    cancelConfirmBtn: {
      backgroundColor: '#4B5563',
    },
    btnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    callHint: {
      color: '#FFD9DD',
      textAlign: 'center',
      marginTop: -6,
      marginBottom: 12,
    },
    graceHint: {
      color: '#FFD9DD',
      textAlign: 'center',
      fontSize: 13,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    modalInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      color: colors.text,
      fontSize: 15,
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalBtnSecondary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    modalBtnSecondaryText: {
      color: colors.muted,
      fontWeight: '600',
    },
    modalBtnPrimary: {
      backgroundColor: '#B00020',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    modalBtnDisabled: {
      opacity: 0.7,
    },
    modalBtnPrimaryText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
