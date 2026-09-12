import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorMessageBox from '../components/ErrorMessageBox';
import LoadingState from '../components/LoadingState';
import http from '../lib/http';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Severity = 'Low' | 'Medium' | 'High';

type Shift = {
  _id: string;
  title: string;
  date: string;
  status?: string;
};

type Attachment = {
  _id: string;
  originalName?: string;
  mimeType?: string;
  mediaType?: string;
};

type Incident = {
  _id: string;
  description: string;
  severity: string;
  status?: string;
  createdAt?: string;
  attachments?: Attachment[];
};

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

// same list the backend accepts, otherwise the upload comes back as a 400
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024;

// works with a mime type or with the mediaType the server sends back
function fileIcon(type?: string) {
  if (!type) return '📎';
  if (type.startsWith('image')) return '🖼️';
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('audio')) return '🎵';
  if (type.includes('pdf')) return '📄';
  return '📎';
}

type ApiResponse = Incident[] | { incidents?: Incident[]; data?: Incident[] };

// myshifts is paginated now, so the list comes back inside items
type ShiftsResponse = Shift[] | { items?: Shift[] };

const getNowDateTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

type ErrorState = {
  title: string;
  message: string;
} | null;

export default function IncidentReportScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftPicker, setShowShiftPicker] = useState(false);

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateTime] = useState(getNowDateTime());
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const fetchIncidents = async () => {
    try {
      setLoadingList(true);
      const { data } = await http.get<ApiResponse>('/incidents');
      const list = Array.isArray(data)
        ? data
        : ((data as { incidents?: Incident[]; data?: Incident[] }).incidents ??
          (data as { incidents?: Incident[]; data?: Incident[] }).data ??
          []);
      setIncidents(list);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : t('incidentReport.error'));
      setErrorState({ title: 'Failed to Load', message });
    } finally {
      setLoadingList(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const { data } = await http.get<ShiftsResponse>('/shifts/myshifts');
      const list = Array.isArray(data) ? data : (data.items ?? []);
      setShifts(list.filter((s) => s.status === 'assigned'));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to load shifts. Please try again.');
      setErrorState({ title: 'Failed to Load Shifts', message });
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
      fetchShifts();
    }, []),
  );

  // keeps out anything the server would reject anyway
  const addFiles = (picked: PickedFile[]) => {
    const accepted: PickedFile[] = [];
    const rejected: string[] = [];

    for (const file of picked) {
      if (!ALLOWED_TYPES.includes(file.mimeType)) {
        rejected.push(`${file.name} (${t('incidentReport.typeNotAllowed')})`);
      } else if (file.size && file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (${t('incidentReport.fileTooBig')})`);
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }

    if (rejected.length > 0) {
      setErrorState({
        title: t('incidentReport.fileNotAdded'),
        message: rejected.join('\n'),
      });
    }
  };

  const pickMedia = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (res.canceled) return;

    addFiles(
      res.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? (a.uri.split('/').pop() || 'attachment'),
        mimeType: a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: a.fileSize,
      })),
    );
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_TYPES,
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (res.canceled || !res.assets) return;

    addFiles(
      res.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? 'application/octet-stream',
        size: a.size ?? undefined,
      })),
    );
  };

  const removeFile = (uri: string) => {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  };

  const closeErrorBox = () => {
    setErrorState(null);
  };

  const uploadAttachments = async (incidentId: string): Promise<number> => {
    let failedCount = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
      try {
        await http.post(`/incidents/${incidentId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          // videos and audio are much bigger than photos, the default timeout is too short for them
          timeout: 120000,
        });
      } catch {
        failedCount += 1;
      }
    }
    return failedCount;
  };

  const submitReport = async () => {
    if (!selectedShift || !description.trim() || !severity) {
      setErrorState({
        title: 'Missing required fields',
        message:
          'Please select a shift, complete the incident description and select a severity before submitting the report.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: response } = await http.post<{ success: boolean; data: Incident }>(
        '/incidents',
        {
          shiftId: selectedShift._id,
          severity: severity.toLowerCase(),
          description: description.trim(),
        },
      );

      let failedUploads = 0;
      if (files.length > 0 && response.data?._id) {
        failedUploads = await uploadAttachments(response.data._id);
      }

      const successMessage =
        failedUploads > 0
          ? `${t('incidentReport.submitSuccess')}, but ${failedUploads} file(s) failed to upload.`
          : t('incidentReport.submitSuccess');

      Alert.alert('Success', successMessage);
      setSelectedShift(null);
      setDescription('');
      setSeverity(null);
      setFiles([]);
      fetchIncidents();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : t('incidentReport.submitFailed'));
      setErrorState({ title: 'Submission Failed', message });
    } finally {
      setSubmitting(false);
    }
  };

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
    </>
  );
}

const getStyles = (colors: AppColors) =>
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
