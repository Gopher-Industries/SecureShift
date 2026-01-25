import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../theme/colors';

type Severity = 'Low' | 'Medium' | 'High';

export default function IncidentReportScreen() {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /* Pick image */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!res.canceled) {
      setImages(prev => [...prev, ...res.assets.map(a => a.uri)]);
    }
  };

  /* Submit (mocked) */
  const submitReport = async () => {
    if (!description.trim() || !severity) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);

    // simulate API call
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Success', 'Incident report submitted successfully.');

      // reset form
      setDescription('');
      setSeverity(null);
      setImages([]);
      setDate(new Date());
    }, 1200);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={s.title}>Incident Report</Text>

      {/* Description */}
      <Text style={s.label}>Incident Description *</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what happened..."
        multiline
        style={s.textArea}
      />

      {/* Date & Time */}
      <Text style={s.label}>Date & Time *</Text>
      <TouchableOpacity
        style={s.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{date.toLocaleString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      {/* Severity */}
      <Text style={s.label}>Severity *</Text>
      <View style={s.row}>
        {(['Low', 'Medium', 'High'] as Severity[]).map(lvl => (
          <TouchableOpacity
            key={lvl}
            style={[
              s.severityBtn,
              severity === lvl && s.severitySelected,
            ]}
            onPress={() => setSeverity(lvl)}
          >
            <Text
              style={{
                color: severity === lvl ? '#fff' : COLORS.text,
                fontWeight: '600',
              }}
            >
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Photos */}
      <Text style={s.label}>Photos (optional)</Text>
      <TouchableOpacity style={s.photoBtn} onPress={pickImage}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>
          Add Photos
        </Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ marginTop: 10 }}>
        {images.map(uri => (
          <Image key={uri} source={{ uri }} style={s.preview} />
        ))}
      </ScrollView>

      {/* Submit */}
      <TouchableOpacity
        style={s.submitBtn}
        onPress={submitReport}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: COLORS.text,
  },
  textArea: {
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  severitySelected: {
    backgroundColor: COLORS.primary,
  },
  photoBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  preview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
