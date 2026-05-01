import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ErrorMessageBox from '../components/ErrorMessageBox';
import http from '../lib/http';
import { useAppTheme } from '../theme';

import type { AppColors } from '../theme/colors';

type Severity = 'Low' | 'Medium' | 'High';

type Incident = {
  _id: string;
  description: string;
  severity: string;
  status?: string;
  createdAt?: string;
};

type ApiResponse = Incident[] | { incidents?: Incident[]; data?: Incident[] };

const getNowDateTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

type ErrorState = {
  title: string;
  message: string;
} | null;

export default function IncidentReportScreen() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [shiftId, setShiftId] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [images, setImages] = useState<string[]>([]);
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
    } catch {
      // show empty state silently
    } finally {
      setLoadingList(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
    }, []),
  );

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!res.canceled) {
      setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  const closeErrorBox = () => {
    setErrorState(null);
  };

  const submitReport = async () => {
    if (!shiftId.trim() || !description.trim() || !severity) {
      setErrorState({
        title: 'Missing required fields',
        message:
          'Please complete the shift ID, incident description and select a severity before submitting the report.',
      });
      return;
    }

    setSubmitting(true);

    try {
      await http.post('/incidents', {
        shiftId: shiftId.trim(),
        severity: severity.toLowerCase(),
        description: description.trim(),
      });

      Alert.alert('Success', 'Incident report submitted successfully.');
      setShiftId('');
      setDescription('');
      setSeverity(null);
      setImages([]);
      fetchIncidents();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not submit the incident report. Please try again.';
      setErrorState({ title: 'Submission Failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.contentContainer} style={s.container}>
        {/* Incident List */}
        <Text style={s.title}>My Reports</Text>
        {loadingList ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : incidents.length === 0 ? (
          <Text style={s.emptyText}>No incidents reported yet.</Text>
        ) : (
          incidents.map((item) => (
            <View key={item._id} style={s.incidentCard}>
              <View style={s.incidentRow}>
                <Text style={s.incidentDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={s.incidentSeverity}>{item.severity}</Text>
              </View>
              {!!item.status && <Text style={s.incidentStatus}>Status: {item.status}</Text>}
              {!!item.createdAt && (
                <Text style={s.incidentDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              )}
            </View>
          ))
        )}

        {/* Submit Form */}
        <Text style={[s.title, s.formTitle]}>Incident Report</Text>

        <Text style={s.label}>Shift ID *</Text>
        <TextInput
          value={shiftId}
          onChangeText={setShiftId}
          placeholder="Enter shift ID..."
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <Text style={s.label}>Incident Description *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened..."
          placeholderTextColor={colors.muted}
          multiline
          style={s.textArea}
        />

        <Text style={s.label}>Date &amp; Time *</Text>
        <Text style={s.readOnly}>{dateTime}</Text>

        <Text style={s.label}>Severity *</Text>
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
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Photos (optional)</Text>
        <TouchableOpacity style={s.photoBtn} onPress={pickImage}>
          <Text style={s.photoBtnText}>Add Photos</Text>
        </TouchableOpacity>

        <ScrollView horizontal style={s.previewRow} showsHorizontalScrollIndicator={false}>
          {images.map((uri) => (
            <Image key={uri} source={{ uri }} style={s.preview} />
          ))}
        </ScrollView>

        <TouchableOpacity style={s.submitBtn} onPress={submitReport} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={s.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
    loader: {
      marginVertical: 12,
    },
    emptyText: {
      color: colors.muted,
      fontSize: 13,
      marginBottom: 8,
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
    input: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    photoBtnText: {
      color: colors.white,
      fontWeight: '600',
    },
    previewRow: {
      marginTop: 10,
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
  });
