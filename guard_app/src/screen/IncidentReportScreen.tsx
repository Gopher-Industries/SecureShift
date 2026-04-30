import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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

const getNowDateTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

type ErrorState = {
  title: string;
  message: string;
} | null;

export default function IncidentReportScreen() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateTime] = useState(getNowDateTime());
  const [errorState, setErrorState] = useState<ErrorState>(null);

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
    if (!description.trim() || !severity) {
      setErrorState({
        title: 'Missing required fields',
        message:
          'Please complete the incident description and select a severity before submitting the report.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('severity', severity);
      formData.append('dateTime', new Date().toISOString());

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() ?? `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', { uri, name: filename, type } as unknown as Blob);
      });

      await http.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Incident report submitted successfully.');
      setDescription('');
      setSeverity(null);
      setImages([]);
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
      <ScrollView style={s.screen} contentContainerStyle={s.contentContainer}>
        <Text style={s.title}>Incident Report</Text>

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
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 16,
    },
    contentContainer: {
      paddingBottom: 32,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 16,
      color: colors.text,
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
