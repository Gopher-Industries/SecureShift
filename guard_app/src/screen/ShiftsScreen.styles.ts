import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

// Shared styles for the Shifts tabs (All / Applied / Completed). Extracted from
// ShiftsScreen.tsx (GA-021) — unchanged, just co-located.
export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingTop: 12,
    },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },

    requestsButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 5,
      marginBottom: 12,
      alignSelf: 'center',
    },
    requestsText: {
      color: colors.white,
      fontSize: 14,
      margin: 8,
      alignSelf: 'center',
    },

    controlsRow: {
      gap: 8,
      paddingBottom: 10,
    },

    controlButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    controlButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    controlButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },

    controlButtonTextActive: {
      color: colors.white,
    },

    errorContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },

    errorText: {
      color: '#B00020',
      textAlign: 'center',
      marginBottom: 10,
    },

    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    retryButtonText: {
      color: colors.white,
      fontWeight: '700',
    },
    recommendedSection: {
      marginBottom: 16,
    },

    recommendedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },

    recommendedRow: {
      gap: 12,
      paddingBottom: 10,
    },

    recommendedCard: {
      width: 300,
    },

    recommendationReason: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 6,
    },

    allShiftsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 10,
    },
    pageButtonsView: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    pageButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
      marginVertical: 4,
      marginHorizontal: 4,
    },
    pageButtonText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: 'bold',
      marginVertical: 9,
      marginHorizontal: 12,
      alignSelf: 'center',
    },
  });
