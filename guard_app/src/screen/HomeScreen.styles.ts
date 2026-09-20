import { Dimensions, StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

const DEVICE_W = Dimensions.get('window').width;
const CANVAS = Math.min(390, DEVICE_W);
const P = 24;

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { alignItems: 'center' },
    canvas: { width: CANVAS },

    heading: { alignItems: 'center', paddingHorizontal: P, paddingTop: 18 },
    h1: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    h2: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 6,
      textAlign: 'center',
    },

    grid: {
      paddingHorizontal: P,
      marginTop: 18,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (CANVAS - P * 2 - 12) / 2,
      borderRadius: 22,
      padding: 16,
      marginBottom: 12,
    },
    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      marginTop: 10,
      fontSize: 12,
      color: colors.muted,
    },
    tintBlue: { backgroundColor: colors.primarySoft },
    tintYellow: { backgroundColor: colors.yellowSoft },
    tintGreen: { backgroundColor: colors.greenSoft },
    tintPurple: { backgroundColor: colors.purpleSoft },

    card: {
      marginHorizontal: P,
      marginTop: 18,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    },
    cardHead: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardHeadLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardHeadTxt: {
      marginLeft: 8,
      fontSize: 16,
      color: colors.muted,
      fontWeight: '700',
    },

    rowItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
      backgroundColor: colors.card,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowItemHL: {
      backgroundColor: colors.rowHighlight,
      borderColor: colors.rowHighlightBorder,
    },
    rowLeft: { flex: 1 },
    rowTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    rowSub: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 6,
    },
    rowAmt: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.success,
      paddingLeft: 10,
    },

    viewAll: {
      fontSize: 15,
      color: colors.link,
      fontWeight: '700',
    },

    spacer: { height: 88 },
  });
