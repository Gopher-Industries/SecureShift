// guard_app/src/screen/DocumentsScreen.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import { useAppTheme } from '../theme';
import { getStyles } from './DocumentsScreen.styles';
import { AppColors } from '../theme/colors';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  documentType: string;
  documentTypeLabel: string;
  size: number;
  uri: string;
  uploadedAt: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const STORAGE_KEY = 'uploaded_documents';

export default function DocumentsScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const documentTypes = [
    { id: 'security_license', label: t('docs.types.security_license') },
    { id: 'first_aid', label: t('docs.types.first_aid') },
    { id: 'id_proof', label: t('docs.types.id_proof') },
    { id: 'police_check', label: t('docs.types.police_check') },
    { id: 'working_rights', label: t('docs.types.working_rights') },
    { id: 'resume', label: t('docs.types.resume') },
    { id: 'other', label: t('docs.types.other') },
  ];

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const storedDocs = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedDocs) {
        const docs: UploadedDocument[] = JSON.parse(storedDocs);
        docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setDocuments(docs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert(t('docs.error'), t('docs.failedToLoad'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments]),
  );

  const pickAndUploadDocument = async () => {
    if (!selectedDocType) {
      Alert.alert(t('docs.docTypeRequired'), t('docs.selectDocTypeFirstMsg'));
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (!file.mimeType || !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
          Alert.alert('Invalid File Type', 'Please select a PDF, JPG, or PNG file.');
          return;
        }

        if (file.size && file.size > MAX_FILE_SIZE) {
          Alert.alert(t('docs.fileTooLarge'), t('docs.selectFileSmaller'));
          return;
        }

        setUploading(true);

        const documentTypeInfo = documentTypes.find((dt) => dt.id === selectedDocType);

        const newDocument: UploadedDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          documentType: selectedDocType,
          documentTypeLabel: documentTypeInfo?.label || t('docs.unknown'),
          size: file.size || 0,
          uri: file.uri,
          uploadedAt: new Date().toISOString(),
        };

        const storedDocs = await AsyncStorage.getItem(STORAGE_KEY);
        const allDocs: UploadedDocument[] = storedDocs ? JSON.parse(storedDocs) : [];

        allDocs.push(newDocument);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allDocs));

        const sortedDocs = allDocs.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        setDocuments(sortedDocs);

        setSelectedDocType('');
        setShowDropdown(false);

        Alert.alert(
          'Document Saved',
          'Document saved locally. Documentation API upload is not available yet.',
        );
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (doc: UploadedDocument) => {
    Alert.alert(t('docs.deleteDocument'), t('docs.deleteConfirm'), [
      { text: t('docs.cancel'), style: 'cancel' },
      {
        text: t('docs.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedDocs = documents.filter((d) => d.id !== doc.id);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));

            setDocuments(updatedDocs);

            Alert.alert(t('docs.success'), t('docs.deleteSuccess'));
          } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert(t('docs.error'), t('docs.deleteFailed'));
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedDocTypeLabel = documentTypes.find((dt) => dt.id === selectedDocType)?.label;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>{t('docs.infoText')}</Text>
        </View>

        <Text style={styles.label}>{t('docs.documentType')}</Text>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={t('docs.selectDocumentType')}
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
          disabled={uploading}
        >
          <Text
            style={selectedDocType ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}
          >
            {selectedDocTypeLabel || t('docs.selectDocumentType')}
          </Text>
          <Text style={styles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownMenu}>
            {documentTypes.map((docType) => (
              <TouchableOpacity
                key={docType.id}
                style={[
                  styles.dropdownItem,
                  selectedDocType === docType.id && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedDocType(docType.id);
                  setShowDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedDocType === docType.id && styles.dropdownItemTextSelected,
                  ]}
                >
                  {docType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          accessible={true}
          accessibilityLabel={t('docs.addDocument')}
          style={[styles.uploadArea, !selectedDocType && styles.uploadAreaDisabled]}
          onPress={pickAndUploadDocument}
          disabled={!selectedDocType || uploading}
        >
          <View style={styles.uploadIconContainer}>
            <Text style={styles.uploadIcon}>↑</Text>
          </View>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.muted} style={{ marginBottom: 8 }} />
          ) : null}
          <Text style={styles.uploadText}>
            {uploading
              ? t('docs.uploading')
              : selectedDocType
                ? t('docs.tapToUpload')
                : t('docs.selectTypeFirst')}
          </Text>
          <Text style={styles.uploadSubtext}>{t('docs.uploadSubtext')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          {t('docs.uploadedDocuments')} ({documents.length})
        </Text>

        {documents.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title={t('docs.noDocumentsUploaded')}
            message={t('docs.noDocumentsSubtext')}
          />
        ) : (
          <View style={styles.documentsList}>
            {documents.map((doc) => (
              <View key={doc.id} style={styles.documentCard}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>{doc.type.includes('pdf') ? '📄' : '🖼️'}</Text>
                </View>

                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.documentType}>{doc.documentTypeLabel}</Text>
                  <View style={styles.documentMeta}>
                    <Text style={styles.documentMetaText}>{formatFileSize(doc.size)}</Text>
                    <Text style={styles.documentMetaDot}>•</Text>
                    <Text style={styles.documentMetaText}>{formatDate(doc.uploadedAt)}</Text>
                  </View>
                </View>

                <View style={styles.localBadge}>
                  <Text style={styles.localBadgeText}>{t('docs.local')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteDocument(doc)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
