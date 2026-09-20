import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getStyles } from './IncidentReportScreen.styles';
import EmptyState from '../components/EmptyState';
import ErrorMessageBox from '../components/ErrorMessageBox';
import IncidentAssistantModal from '../components/IncidentAssistantModal';
import LoadingState from '../components/LoadingState';
import { useIncidentReport } from '../hooks/useIncidentReport';
import { useAppTheme } from '../theme';
import { fileIcon, type Severity } from '../utils/incident';

export default function IncidentReportScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const {
    incidents,
    loadingList,
    shifts,
    selectedShift,
    setSelectedShift,
    showShiftPicker,
    setShowShiftPicker,
    description,
    setDescription,
    severity,
    setSeverity,
    showAssistant,
    setShowAssistant,
    files,
    submitting,
    dateTime,
    errorState,
    pickMedia,
    pickDocument,
    removeFile,
    closeErrorBox,
    submitReport,
  } = useIncidentReport();

  return (
    <>
      <ScrollView contentContainerStyle={s.contentContainer} style={s.container}>
        {/* Incident List */}
        <Text style={s.title}>{t('incidentReport.title')}</Text>
        {loadingList ? (
          <LoadingState rows={2} />
        ) : incidents.length === 0 ? (
          <EmptyState icon="document-text-outline" title={t('incidentReport.noReports')} />
        ) : (
          incidents.map((item) => (
            <View key={item._id} style={s.incidentCard}>
              <View style={s.incidentRow}>
                <Text style={s.incidentDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={s.incidentSeverity}>{item.severity}</Text>
              </View>
              {!!item.status && (
                <Text style={s.incidentStatus}>
                  {t('incidentReport.status')} {item.status}
                </Text>
              )}
              {!!item.createdAt && (
                <Text style={s.incidentDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              )}
              {item.attachments && item.attachments.length > 0 && (
                <View style={s.attachmentList}>
                  <Text style={s.attachmentCount}>
                    {t('incidentReport.attachmentCount', { count: item.attachments.length })}
                  </Text>
                  {item.attachments.map((file) => (
                    <Text key={file._id} style={s.attachmentName} numberOfLines={1}>
                      {fileIcon(file.mediaType)} {file.originalName ?? file.mimeType}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* Submit Form */}
        <Text style={[s.title, s.formTitle]}>{t('incidentReport.newReport')}</Text>

        <Text style={s.label}>Shift *</Text>
        <TouchableOpacity style={s.dropdown} onPress={() => setShowShiftPicker(true)}>
          <Text style={selectedShift ? s.dropdownSelected : s.dropdownPlaceholder}>
            {selectedShift
              ? `${selectedShift.title} — ${new Date(selectedShift.date).toLocaleDateString()}`
              : 'Select a shift...'}
          </Text>
        </TouchableOpacity>

        <Text style={s.label}>{t('incidentReport.description')}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder=""
          placeholderTextColor={colors.muted}
          multiline
          style={s.textArea}
        />

        <TouchableOpacity
          style={s.assistantBtn}
          onPress={() => setShowAssistant(true)}
          accessibilityLabel={t('aiIncident.title')}
        >
          <Text style={s.assistantBtnText}>✨ {t('aiIncident.openButton')}</Text>
        </TouchableOpacity>

        <Text style={s.label}>
          {t('incidentReport.date')} &amp; {t('incidentReport.time')}
        </Text>
        <Text style={s.readOnly}>{dateTime}</Text>

        <Text style={s.label}>{t('incidentReport.severity')}</Text>
        <View style={s.row}>
          {(['Low', 'Medium', 'High'] as Severity[]).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[s.severityBtn, severity === lvl && s.severitySelected]}
              onPress={() => setSeverity(lvl)}
            >
              <Text
                style={[s.severityText, { color: severity === lvl ? colors.white : colors.text }]}
              >
                {t(`incidentReport.types.${lvl.toLowerCase()}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t('incidentReport.attachments')}</Text>
        <View style={s.row}>
          <TouchableOpacity style={s.photoBtn} onPress={pickMedia}>
            <Text style={s.photoBtnText}>{t('incidentReport.addMedia')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoBtn} onPress={pickDocument}>
            <Text style={s.photoBtnText}>{t('incidentReport.addFile')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.hint}>{t('incidentReport.attachmentHint')}</Text>

        <ScrollView horizontal style={s.previewRow} showsHorizontalScrollIndicator={false}>
          {files.map((file) => (
            <TouchableOpacity
              key={file.uri}
              onPress={() => removeFile(file.uri)}
              style={s.previewItem}
            >
              {file.mimeType.startsWith('image/') ? (
                <Image source={{ uri: file.uri }} style={s.preview} />
              ) : (
                <View style={[s.preview, s.filePreview]}>
                  <Text style={s.fileIcon}>{fileIcon(file.mimeType)}</Text>
                  <Text style={s.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                </View>
              )}
              <Text style={s.removeText}>{t('incidentReport.remove')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={s.submitBtn} onPress={submitReport} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={s.submitText}>{t('incidentReport.submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Shift Picker Modal */}
      <Modal visible={showShiftPicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Select Shift</Text>
            <ScrollView>
              {shifts.length === 0 ? (
                <EmptyState icon="calendar-outline" title="No assigned shifts found." />
              ) : (
                shifts.map((shift) => (
                  <TouchableOpacity
                    key={shift._id}
                    style={s.shiftItem}
                    onPress={() => {
                      setSelectedShift(shift);
                      setShowShiftPicker(false);
                    }}
                  >
                    <Text style={s.shiftTitle}>{shift.title}</Text>
                    <Text style={s.shiftDate}>{new Date(shift.date).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setShowShiftPicker(false)}>
              <Text style={s.modalCloseText}>{t('incidentReport.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ErrorMessageBox
        visible={Boolean(errorState)}
        title={errorState?.title}
        message={errorState?.message}
        onClose={closeErrorBox}
      />

      <IncidentAssistantModal
        visible={showAssistant}
        description={description}
        shiftTitle={selectedShift?.title}
        dateTime={dateTime}
        onApplyDraft={(text) => setDescription(text)}
        onApplySeverity={(sev) => setSeverity(sev)}
        onClose={() => setShowAssistant(false)}
      />
    </>
  );
}
