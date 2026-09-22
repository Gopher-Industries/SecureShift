import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getStyles, stylesInline } from './ShiftDetailsScreen.styles';
import ErrorMessageBox from '../components/ErrorMessageBox';
import LocationVerificationModal from '../components/modal/LocationVerificationModal';
import { useShiftDetails } from '../hooks/useShiftDetails';
import { useAppTheme } from '../theme';
import { formatDate } from '../utils/date';

function StatusBadge({ status, color }: { status: string; color: string }) {
  return <Text style={[stylesInline.statusBadge, { color }]}>{status.toUpperCase()}</Text>;
}

export default function ShiftDetailsScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const s = getStyles(colors);

  const {
    shift,
    statusColor,
    canDoAttendance,
    hasCheckedIn,
    hasCheckedOut,
    showCheckIn,
    showCheckOut,
    shouldShowAttendanceHistory,
    attendanceHistory,
    handoverText,
    setHandoverText,
    handoverNotes,
    savingHandover,
    modalVisible,
    setModalVisible,
    errorState,
    closeErrorBox,
    openModalFor,
    handleSaveHandoverNote,
    handleVerificationSuccess,
    handleMessageEmployer,
    handleStartPatrol,
  } = useShiftDetails();

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.title}>{shift.title}</Text>
          <Text style={s.company}>{shift.createdBy?.company ?? 'Company N/A'}</Text>

          <View style={s.divider} />

          <View style={s.row}>
            <Ionicons name="location-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>
              {shift.location
                ? `${shift.location.street ?? ''}, ${shift.location.suburb ?? ''}`
                : 'Location N/A'}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>{formatDate(shift.date)}</Text>
          </View>

          <View style={s.row}>
            <Ionicons name="time-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>
              {shift.startTime} - {shift.endTime}
            </Text>
          </View>

          <View style={s.row}>
            <Ionicons name="cash-outline" size={20} color={colors.muted} />
            <Text style={s.rowText}>${shift.payRate ?? 0} / hr</Text>
          </View>

          <View style={[s.row, s.statusRow]}>
            <Text style={s.label}>Status: </Text>
            <StatusBadge status={shift.status ?? 'open'} color={statusColor} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Location Details</Text>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Street</Text>
              <Text style={s.infoValue}>{shift.location?.street ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Suburb</Text>
              <Text style={s.infoValue}>{shift.location?.suburb ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>State</Text>
              <Text style={s.infoValue}>{shift.location?.state ?? 'N/A'}</Text>
            </View>

            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Postcode</Text>
              <Text style={s.infoValue}>{shift.location?.postcode ?? 'N/A'}</Text>
            </View>
          </View>

          {shouldShowAttendanceHistory && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Attendance History</Text>

              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((item, index) => (
                  <View key={index} style={s.historyItem}>
                    <Text style={s.historyLabel}>{item.label}</Text>
                    <Text style={s.historyValue}>{item.value}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.emptyHistory}>No attendance history available</Text>
              )}
            </View>
          )}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.messageBtn]} onPress={handleMessageEmployer}>
            <Text style={s.btnText}>Message Employer</Text>
          </TouchableOpacity>

          {showCheckIn ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.confirmed }]}
              onPress={() => openModalFor('check-in')}
            >
              <Text style={s.btnText}>Check In</Text>
            </TouchableOpacity>
          ) : null}

          {showCheckOut ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.status.rejected }]}
              onPress={() => openModalFor('check-out')}
            >
              <Text style={s.btnText}>Check Out</Text>
            </TouchableOpacity>
          ) : null}

          {hasCheckedIn && !hasCheckedOut ? (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.primary }]}
              onPress={handleStartPatrol}
            >
              <Text style={s.btnText}>{t('patrol.startButton')}</Text>
            </TouchableOpacity>
          ) : null}

          {hasCheckedIn && !hasCheckedOut ? (
            <View style={s.handoverSection}>
              <Text style={s.handoverTitle}>Handover Note</Text>

              <TextInput
                value={handoverText}
                onChangeText={setHandoverText}
                placeholder="Add a short note for the next guard..."
                placeholderTextColor={colors.muted}
                multiline
                maxLength={300}
                style={[
                  s.handoverInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary }]}
                onPress={handleSaveHandoverNote}
                disabled={savingHandover}
              >
                <Text style={s.btnText}>{savingHandover ? 'Saving...' : 'Save Handover Note'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {handoverNotes.length > 0 ? (
            <View style={s.handoverSection}>
              <Text style={s.handoverTitle}>Recent Handover Notes</Text>

              {handoverNotes.map((note) => (
                <View key={note.id} style={s.handoverNote}>
                  <Text style={s.handoverNoteText}>{note.text}</Text>

                  <Text style={s.handoverNoteMeta}>
                    {note.author} • {new Date(note.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {shift.status === 'completed' ? (
            <View style={s.completedBox}>
              <Text style={s.completedText}>Shift Completed ✅</Text>
            </View>
          ) : null}

          {!canDoAttendance ? (
            <Text style={s.hint}>
              You can only check in/out when the shift is <Text style={s.hintStrong}>ASSIGNED</Text>
              .
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <LocationVerificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onVerified={handleVerificationSuccess}
      />

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        onClose={closeErrorBox}
      />
    </View>
  );
}
