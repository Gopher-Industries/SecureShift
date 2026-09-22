import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flex: 1,
      padding: 16,
    },

    infoCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },

    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 24,
    },
    dropdownTextPlaceholder: {
      fontSize: 15,
      color: colors.muted,
    },
    dropdownTextSelected: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    dropdownIcon: {
      fontSize: 12,
      color: colors.muted,
    },
    dropdownMenu: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      maxHeight: 340,
    },
    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },

    uploadArea: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      marginBottom: 32,
    },
    uploadAreaDisabled: {
      opacity: 0.5,
    },
    uploadIconContainer: {
      width: 64,
      height: 64,
      backgroundColor: colors.primarySoft,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    uploadIcon: {
      fontSize: 28,
      color: colors.muted,
    },
    uploadText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    uploadSubtext: {
      fontSize: 13,
      color: colors.muted,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    documentsList: {
      gap: 12,
      paddingBottom: 20,
    },
    documentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    documentIconContainer: {
      width: 48,
      height: 48,
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    documentIcon: {
      fontSize: 24,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    documentType: {
      fontSize: 13,
      color: colors.primary,
      marginBottom: 4,
    },
    documentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentMetaText: {
      fontSize: 12,
      color: colors.muted,
    },
    documentMetaDot: {
      fontSize: 12,
      color: colors.muted,
      marginHorizontal: 6,
    },

    localBadge: {
      backgroundColor: colors.yellowSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    localBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.status.pending,
    },

    deleteButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      fontSize: 20,
      color: colors.muted,
    },
  });
