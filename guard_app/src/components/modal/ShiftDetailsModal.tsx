// components/modal/ShiftDetailsModal.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ShiftRequestModal from './ShiftRequestModal';
import { formatAttendanceTime } from '../functions/formatAttendanceTime';

import type { AllShift, AppliedShift, CompletedShift } from '../../models/Shifts';
import type { AppColors } from '../../theme/colors';

type Props = {
  shift: AppliedShift | CompletedShift | AllShift | null;
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
  onApply?: () => void;
  applying?: boolean;
  onRate?: (rating: number) => Promise<void>;
};

function ShiftDetailsModal({
  shift,
  visible,
  onClose,
  colors,
  onApply,
  applying = false,
  onRate,
}: Props) {
  const s = getStyles(colors);
  const { t } = useTranslation();
  const [requestVisible, setRequestVisible] = useState<boolean>(false);
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string>('');

  const shiftId = shift?.id;

  // clear the stars when a different shift is opened
  useEffect(() => {
    setSelectedStars(0);
    setSubmitting(false);
    setRatingError('');
  }, [shiftId]);

  if (!shift) return null;

  const status = 'status' in shift ? shift.status : 'Completed';
  const statusColor =
    status === 'Confirmed'
      ? colors.status.confirmed
      : status === 'Pending'
        ? colors.link
        : status === 'Available'
          ? colors.primary
          : colors.muted;

  const hasAttendance = Boolean(shift.attendance?.checkInTime || shift.attendance?.checkOutTime);

  // only completed shifts carry the rating fields
  const completed = 'rated' in shift ? shift : null;
  const showRating = completed !== null && Boolean(onRate);
  const starsToShow = completed?.rated ? completed.rating : selectedStars;

  const submitRating = async () => {
    if (!onRate) return;

    if (selectedStars < 1) {
      setRatingError(t('shifts.selectRating'));
      return;
    }

    try {
      setSubmitting(true);
      setRatingError('');

      await onRate(selectedStars);
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setRatingError(apiError.response?.data?.message ?? t('shifts.ratingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('shifts.shiftDetails')}</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.modalBody}>
            <View style={s.modalTitleRow}>
              <Text style={s.modalShiftTitle}>{shift.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={s.statusBadgeText}>
                  {status ? t(`shifts.${status.toLowerCase()}`, status) : t('shifts.available')}
                </Text>
              </View>

              {status === 'Confirmed' && (
                <TouchableOpacity
                  style={[s.statusBadge, { backgroundColor: colors.link }]}
                  onPress={() => setRequestVisible(true)}
                >
                  <Text style={s.statusBadgeText}>{t('shifts.change')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.date')}</Text>
              <Text style={s.modalValue}>
                {new Date(shift.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.time')}</Text>
              <Text style={s.modalValue}>{shift.time}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.location')}</Text>
              <Text style={s.modalValue}>{shift.site}</Text>
            </View>

            <View style={s.modalDetail}>
              <Text style={s.modalLabel}>{t('shifts.payRate')}</Text>
              <Text style={s.modalValue}>{shift.rate}</Text>
            </View>

            <View style={s.modalRequirements}>
              <Text style={s.modalRequirementsTitle}>{t('shifts.requirements')}</Text>
              <View style={s.modalTags}>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>Security License</Text>
                </View>
                <View style={s.modalTag}>
                  <Text style={s.modalTagText}>First Aid</Text>
                </View>
              </View>
            </View>
            {status === 'Available' && onApply ? (
              <TouchableOpacity
                style={[s.applyButton, applying && s.applyButtonDisabled]}
                onPress={onApply}
                disabled={applying}
              >
                <Text style={s.applyButtonText}>
                  {applying ? 'Applying...' : 'Apply for Shift'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {hasAttendance ? (
              <View style={s.modalRequirements}>
                <Text style={s.modalRequirementsTitle}>Attendance History</Text>

                {shift.attendance?.checkInTime ? (
                  <View style={s.modalDetail}>
                    <Text style={s.modalLabel}>✅ Checked In</Text>
                    <Text style={s.modalValue}>
                      {formatAttendanceTime(shift.attendance.checkInTime)}
                    </Text>
                  </View>
                ) : null}

                {shift.attendance?.checkOutTime ? (
                  <View style={s.modalDetail}>
                    <Text style={s.modalLabel}>✅ Checked Out</Text>
                    <Text style={s.modalValue}>
                      {formatAttendanceTime(shift.attendance.checkOutTime)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {showRating ? (
              <View style={s.modalRequirements}>
                <Text style={s.modalRequirementsTitle}>{t('shifts.rateShift')}</Text>

                <View style={s.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        setSelectedStars(star);
                        setRatingError('');
                      }}
                      disabled={completed?.rated || submitting}
                      accessibilityRole="button"
                      accessibilityLabel={t('shifts.starLabel', { count: star })}
                    >
                      <Text style={[s.star, star <= starsToShow && s.starFilled]}>
                        {star <= starsToShow ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {completed?.rated ? (
                  <Text style={s.ratingNote}>{t('shifts.alreadyRated')}</Text>
                ) : (
                  <>
                    {ratingError ? <Text style={s.ratingError}>{ratingError}</Text> : null}

                    <TouchableOpacity
                      style={[s.applyButton, submitting && s.applyButtonDisabled]}
                      onPress={submitRating}
                      disabled={submitting}
                    >
                      <Text style={s.applyButtonText}>
                        {submitting ? t('shifts.submittingRating') : t('shifts.submitRating')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>

      <ShiftRequestModal
        visible={requestVisible}
        onClose={() => setRequestVisible(false)}
        colors={colors}
        shift={shift}
      />
    </Modal>
  );
}

export default ShiftDetailsModal;

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      width: '88%',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    modalCloseBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 20,
      color: colors.muted,
    },
    modalBody: {
      gap: 12,
    },
    modalTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalShiftTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginLeft: 6,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.white,
    },
    modalDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalLabel: {
      fontSize: 14,
      color: colors.muted,
    },
    modalValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      flexShrink: 1,
      textAlign: 'right',
    },
    modalRequirements: {
      marginTop: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalRequirementsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    modalTags: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    modalTag: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    modalTagText: {
      fontSize: 12,
      color: colors.text,
    },
    applyButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },

    applyButtonDisabled: {
      opacity: 0.6,
    },

    applyButtonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },

    starRow: {
      flexDirection: 'row',
      gap: 8,
    },

    star: {
      fontSize: 30,
      color: colors.muted,
    },

    starFilled: {
      color: colors.primary,
    },

    ratingNote: {
      marginTop: 10,
      fontSize: 13,
      color: colors.muted,
    },

    ratingError: {
      marginTop: 10,
      fontSize: 13,
      color: colors.status.rejected,
    },
  });
