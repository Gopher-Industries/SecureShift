// guard_app/src/screen/DocumentsScreen.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

// Document types available for guards
const DOCUMENT_TYPES = [
  { id: 'security_license', label: 'Security License' },
  { id: 'first_aid', label: 'First Aid Certificate' },
  { id: 'id_proof', label: 'ID Proof (Passport/Driver License)' },
  { id: 'police_check', label: 'Police Check' },
  { id: 'working_rights', label: 'Working Rights' },
  { id: 'resume', label: 'Resume/CV' },
  { id: 'other', label: 'Other Document' },
];

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

const STORAGE_KEY = 'uploaded_documents';

export default function DocumentsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

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
      Alert.alert('Error', 'Failed to load documents');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments]),
  );

  const pickAndUploadDocument = async () => {
    if (!selectedDocType) {
      Alert.alert('Document Type Required', 'Please select a document type first');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        const maxSize = 10 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        setUploading(true);

        const documentTypeInfo = DOCUMENT_TYPES.find((dt) => dt.id === selectedDocType);

        const newDocument: UploadedDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          documentType: selectedDocType,
          documentTypeLabel: documentTypeInfo?.label || 'Unknown',
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

        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (doc: UploadedDocument) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedDocs = documents.filter((d) => d.id !== doc.id);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));

            setDocuments(updatedDocs);

            Alert.alert('Success', 'Document deleted');
          } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert('Error', 'Failed to delete document');
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

  const selectedDocTypeLabel = DOCUMENT_TYPES.find((dt) => dt.id === selectedDocType)?.label;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Keep your documents organized. Upload your licenses and certifications. All documents
            are stored locally on your device.
          </Text>
        </View>

        <Text style={styles.label}>Document Type</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
          disabled={uploading}
        >
          <Text
            style={selectedDocType ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}
          >
            {selectedDocTypeLabel || 'Select document type'}
          </Text>
          <Text style={styles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownMenu}>
            {DOCUMENT_TYPES.map((docType) => (
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
              ? 'Uploading...'
              : selectedDocType
                ? 'Tap to upload'
                : 'Select a document type first'}
          </Text>
          <Text style={styles.uploadSubtext}>PDF, JPG, or PNG up to 10MB</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Uploaded Documents ({documents.length})</Text>

        {documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📄</Text>
            <Text style={styles.emptyStateText}>No documents uploaded yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Select a document type above and tap to upload
            </Text>
          </View>
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
                  <Text style={styles.localBadgeText}>Local</Text>
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

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flex: 1,
      padding: 16,
    },

    infoCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },

    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 14,
      marginBottom: 24,
    },
    dropdownTextPlaceholder: {
      fontSize: 15,
      color: colors.muted,
    },
    dropdownTextSelected: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    dropdownIcon: {
      fontSize: 12,
      color: colors.muted,
    },
    dropdownMenu: {
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: -20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      maxHeight: 340,
    },
    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primarySoft,
    },
    dropdownItemText: {
      fontSize: 15,
      color: colors.text,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },

    uploadArea: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      marginBottom: 32,
    },
    uploadAreaDisabled: {
      opacity: 0.5,
    },
    uploadIconContainer: {
      width: 64,
      height: 64,
      backgroundColor: colors.primarySoft,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    uploadIcon: {
      fontSize: 28,
      color: colors.muted,
    },
    uploadText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    uploadSubtext: {
      fontSize: 13,
      color: colors.muted,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    documentsList: {
      gap: 12,
      paddingBottom: 20,
    },
    documentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    documentIconContainer: {
      width: 48,
      height: 48,
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    documentIcon: {
      fontSize: 24,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    documentType: {
      fontSize: 13,
      color: colors.primary,
      marginBottom: 4,
    },
    documentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentMetaText: {
      fontSize: 12,
      color: colors.muted,
    },
    documentMetaDot: {
      fontSize: 12,
      color: colors.muted,
      marginHorizontal: 6,
    },

    localBadge: {
      backgroundColor: colors.yellowSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    localBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.status.pending,
    },

    deleteButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      fontSize: 20,
      color: colors.muted,
    },

    emptyState: {
      padding: 40,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
    },
  });
