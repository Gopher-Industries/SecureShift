import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import http from '../lib/http';
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  getNowDateTime,
  type ApiResponse,
  type ErrorState,
  type Incident,
  type PickedFile,
  type Severity,
  type Shift,
  type ShiftsResponse,
} from '../utils/incident';

// GA-021 — all IncidentReportScreen state + data/file/submit logic, extracted
// from the screen unchanged so the screen is render-only.
export function useIncidentReport() {
  const { t } = useTranslation();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftPicker, setShowShiftPicker] = useState(false);

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
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

  return {
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
  };
}
