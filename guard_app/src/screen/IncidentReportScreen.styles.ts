import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme/colors';

export const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 16,
    },
    contentContainer: {
      paddingBottom: 32,
    },
    incidentCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    incidentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    incidentDesc: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    incidentSeverity: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    incidentStatus: {
      marginTop: 4,
      fontSize: 12,
      color: colors.muted,
      fontStyle: 'italic',
    },
    incidentDate: {
      marginTop: 4,
      fontSize: 11,
      color: colors.muted,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 16,
      color: colors.text,
    },
    formTitle: {
      marginTop: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 6,
      color: colors.text,
    },
    dropdown: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownSelected: {
      color: colors.text,
      fontSize: 14,
    },
    dropdownPlaceholder: {
      color: colors.muted,
      fontSize: 14,
    },
    textArea: {
      height: 140,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      textAlignVertical: 'top',
      color: colors.text,
    },
    assistantBtn: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      marginTop: 10,
      paddingVertical: 12,
    },
    assistantBtnText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    readOnly: {
      backgroundColor: colors.primarySoft,
      padding: 12,
      borderRadius: 12,
      color: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    severityBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    severitySelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    severityText: {
      fontWeight: '600',
    },
    photoBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: 'center',
    },
    photoBtnText: {
      color: colors.white,
      fontWeight: '600',
      fontSize: 13,
    },
    previewRow: {
      marginTop: 10,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
    },
    previewItem: {
      marginRight: 10,
      alignItems: 'center',
    },
    filePreview: {
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
    },
    fileIcon: {
      fontSize: 22,
    },
    fileName: {
      fontSize: 10,
      color: colors.text,
      textAlign: 'center',
    },
    removeText: {
      fontSize: 11,
      color: colors.status.rejected,
      marginTop: 4,
    },
    attachmentList: {
      marginTop: 8,
    },
    attachmentCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    attachmentName: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    preview: {
      width: 70,
      height: 70,
      borderRadius: 8,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitBtn: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    submitText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 16,
    },
    shiftItem: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    shiftTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    shiftDate: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    modalClose: {
      marginTop: 16,
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalCloseText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
  });
