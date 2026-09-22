import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

export const stylesInline = StyleSheet.create({
  statusBadge: {
    fontWeight: '700',
  },
});

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    company: {
      fontSize: 16,
      color: colors.muted,
      marginBottom: 12,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusRow: {
      marginTop: 20,
    },
    rowText: {
      marginLeft: 10,
      fontSize: 16,
      color: colors.text,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    metaText: {
      marginTop: 6,
      color: colors.muted,
    },
    actions: {
      marginTop: 24,
    },
    btn: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      elevation: 2,
    },
    messageBtn: {
      backgroundColor: colors.primary,
    },
    btnText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    completedBox: {
      backgroundColor: colors.greenSoft,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.rowHighlightBorder,
    },
    completedText: {
      color: colors.status.confirmed,
      fontWeight: 'bold',
      fontSize: 16,
    },
    hint: {
      marginTop: 8,
      color: colors.muted,
      textAlign: 'center',
    },
    hintStrong: {
      fontWeight: '700',
    },
    section: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      maxWidth: '65%',
      textAlign: 'right',
    },
    historyItem: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    historyLabel: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 4,
    },
    historyValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    emptyHistory: {
      fontSize: 14,
      color: colors.muted,
    },
    handoverSection: {
      marginTop: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    handoverTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },

    handoverInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      minHeight: 90,
      color: colors.text,
      textAlignVertical: 'top',
      marginBottom: 10,
    },

    handoverNote: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    handoverNoteText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },

    handoverNoteMeta: {
      fontSize: 12,
      color: colors.muted,
    },
  });
