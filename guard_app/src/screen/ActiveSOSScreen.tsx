// src/screen/ActiveSOSScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getStyles } from './ActiveSOSScreen.styles';
import ErrorMessageBox from '../components/ErrorMessageBox';
import { useActiveSOS } from '../hooks/useActiveSOS';
import { useAppTheme } from '../theme';
import { formatCoord, formatTime, LOCATION_PUSH_INTERVAL_MS, STATUS_LABELS } from '../utils/sos';

export default function ActiveSOSScreen() {
  const { colors } = useAppTheme();
  const s = React.useMemo(() => getStyles(colors), [colors]);

  const {
    alert,
    coords,
    triggeredAt,
    status,
    bootstrapping,
    canQuickCancel,
    canConfirmCancel,
    cancelSecondsRemaining,
    contactLabel,
    contactPhone,
    noteVisible,
    setNoteVisible,
    noteDraft,
    setNoteDraft,
    noteSaving,
    errorState,
    closeError,
    handleCancelPress,
    handleCallEmergency,
    handleSaveNote,
  } = useActiveSOS();

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.banner}>
          <Ionicons name="warning" size={42} color="#FFFFFF" />
          <Text style={s.bannerTitle}>EMERGENCY ACTIVE</Text>
          <Text style={s.bannerSubtitle}>SOS Sent</Text>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="time-outline" size={20} color={colors.muted} />
            <Text style={s.rowLabel}>Triggered</Text>
            <Text style={s.rowValue}>{formatTime(triggeredAt ?? alert?.triggeredAt)}</Text>
          </View>

          <View style={s.row}>
            <Ionicons name="pulse-outline" size={20} color={colors.muted} />
            <Text style={s.rowLabel}>Status</Text>
            <View style={s.statusValueWrap}>
              {bootstrapping ? <ActivityIndicator size="small" color="#B00020" /> : null}
              <Text style={[s.rowValue, s.statusValue]}>{STATUS_LABELS[status]}</Text>
            </View>
          </View>

          {alert?.statusMessage ? <Text style={s.statusMessage}>{alert.statusMessage}</Text> : null}
        </View>

        <View style={s.card}>
          <View style={s.locHeader}>
            <Ionicons name="location" size={20} color="#B00020" />
            <Text style={s.locHeaderText}>Sharing live location</Text>
          </View>
          <Text style={s.coords}>
            {formatCoord(coords?.latitude)}, {formatCoord(coords?.longitude)}
          </Text>
          <Text style={s.coordsHint}>
            Updates every {Math.round(LOCATION_PUSH_INTERVAL_MS / 1000)}s while SOS is active.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.callBtn]} onPress={handleCallEmergency}>
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text style={s.btnText}>Call {contactLabel}</Text>
          </TouchableOpacity>
          <Text style={s.callHint}>{contactPhone}</Text>

          <TouchableOpacity
            style={[s.btn, s.noteBtn]}
            onPress={() => {
              setNoteDraft(alert?.note ?? '');
              setNoteVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            <Text style={s.btnText}>{alert?.note ? 'Update Note' : 'Add Note'}</Text>
          </TouchableOpacity>

          {canQuickCancel || canConfirmCancel ? (
            <TouchableOpacity
              style={[s.btn, canQuickCancel ? s.cancelQuickBtn : s.cancelConfirmBtn]}
              onPress={handleCancelPress}
            >
              <Text style={s.btnText}>
                {canQuickCancel ? `Cancel SOS (${cancelSecondsRemaining}s)` : 'Cancel SOS'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!canQuickCancel && status !== 'cancelled' && status !== 'resolved' ? (
            <Text style={s.graceHint}>
              Quick cancel window has ended. Tap Cancel SOS to confirm.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={noteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Update situation</Text>
            <TextInput
              style={s.modalInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Describe what's happening..."
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
            />
            <View style={s.modalActions}>
              <Pressable style={s.modalBtnSecondary} onPress={() => setNoteVisible(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnPrimary, noteSaving ? s.modalBtnDisabled : null]}
                disabled={noteSaving}
                onPress={() => void handleSaveNote()}
              >
                {noteSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.modalBtnPrimaryText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        onClose={closeError}
      />
    </View>
  );
}
