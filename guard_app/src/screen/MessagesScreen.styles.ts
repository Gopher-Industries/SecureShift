import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    kav: { flex: 1 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.header,
      paddingVertical: 14,
      paddingHorizontal: 16,
      justifyContent: 'space-between',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: {
      color: colors.white,
      fontSize: 18,
      fontWeight: '700',
      marginLeft: 8,
    },
    contextToggle: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 16,
      padding: 2,
    },
    contextChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
    },
    contextChipActive: { backgroundColor: colors.white },
    contextChipText: { fontSize: 12, color: '#e5e7eb', fontWeight: '600' },
    contextChipTextActive: { color: colors.header },

    contextBanner: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contextBannerText: { fontSize: 14, fontWeight: '700', color: colors.text },
    contextBannerSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    errorText: { color: colors.status.rejected, paddingHorizontal: 16, paddingTop: 8 },

    chat: { padding: 12 },
    chatEmpty: { flexGrow: 1, justifyContent: 'center' },

    conversationListWrap: { flex: 1 },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    newConversationCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    newConversationTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
    newConversationInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 8,
      fontSize: 13,
      color: colors.text,
      backgroundColor: colors.bg,
    },
    newConversationBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    newConversationBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

    typingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    typingBubble: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typingText: { color: colors.text, fontSize: 12, fontWeight: '600' },
    typingToggle: { marginLeft: 8 },
    typingToggleText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

    inputBar: {
      flexDirection: 'row',
      padding: 8,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    input: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      backgroundColor: colors.primarySoft,
      color: colors.text,
    },
    inputDisabled: { opacity: 0.6 },
    sendBtn: {
      marginLeft: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
  });
