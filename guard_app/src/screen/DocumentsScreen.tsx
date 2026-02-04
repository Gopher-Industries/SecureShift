// guard_app/src/screen/DocumentsScreen.tsx

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
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load documents from local storage
  const loadDocuments = useCallback(async () => {
    try {
      const storedDocs = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedDocs) {
        const docs: UploadedDocument[] = JSON.parse(storedDocs);
        // Sort by upload date (newest first)
        docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    }
  }, []);

  // Load documents when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments]),
  );

  // Pick and save document
  const pickAndUploadDocument = async () => {
    if (!selectedDocType) {
      Alert.alert('Document Type Required', 'Please select a document type first');
      return;
    }

    try {
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        setUploading(true);

        // Get document type label
        const documentTypeInfo = DOCUMENT_TYPES.find((dt) => dt.id === selectedDocType);

        // Create new document object
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

        // Load existing documents
        const storedDocs = await AsyncStorage.getItem(STORAGE_KEY);
        const allDocs: UploadedDocument[] = storedDocs ? JSON.parse(storedDocs) : [];

        // Add new document
        allDocs.push(newDocument);

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allDocs));

        // Update state (sort by newest first)
        const sortedDocs = allDocs.sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        setDocuments(sortedDocs);

        // Reset selection
        setSelectedDocType('');

        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = (doc: UploadedDocument) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Remove from array
            const updatedDocs = documents.filter((d) => d.id !== doc.id);

            // Save to AsyncStorage
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));

            // Update state
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
  };

  // Format date
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
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Keep your documents organized. Upload your licenses and certifications. All documents
            are stored locally on your device.
          </Text>
        </View>

        {/* Document Type Selector */}
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

        {/* Dropdown Menu */}
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

        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, !selectedDocType && styles.uploadAreaDisabled]}
          onPress={pickAndUploadDocument}
          disabled={!selectedDocType || uploading}
        >
          <View style={styles.uploadIconContainer}>
            <Text style={styles.uploadIcon}>↑</Text>
          </View>
          {uploading ? (
            <ActivityIndicator size="small" color="#6B7280" style={{ marginBottom: 8 }} />
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

        {/* Documents List */}
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
                {/* Icon */}
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>
                    {doc.type.includes('pdf') ? '📄' : '🖼️'}
                  </Text>
                </View>

                {/* Info */}
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

                {/* Local Storage Badge */}
                <View style={styles.localBadge}>
                  <Text style={styles.localBadgeText}>Local</Text>
                </View>

                {/* Delete Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#E8EEF7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Document Type Selector
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  dropdownTextPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dropdownTextSelected: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: -20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 250,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111827',
  },
  dropdownItemTextSelected: {
    color: '#003f88',
    fontWeight: '600',
  },

  // Upload Area
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
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
    backgroundColor: '#E5E7EB',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 28,
    color: '#6B7280',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Documents List
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  documentsList: {
    gap: 12,
    paddingBottom: 20,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 13,
    color: '#003f88',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentMetaDot: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 6,
  },

  // Local Badge
  localBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  localBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },

  // Delete Button
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#9CA3AF',
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
