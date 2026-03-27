/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

import { updateUserProfile, UpdateProfilePayload } from '../api/profile';
import { API_BASE_URL } from '../lib/http';
import { LocalStorage } from '../lib/localStorage';
import { UserProfile } from '../models/UserProfile';
import { showImagePickerOptions, ImagePickerResult } from '../utils/imagePicker';

interface EditProfileScreenProps {
  navigation: any;
  route?: {
    params?: {
      userProfile?: UserProfile;
    };
  };
}

export default function EditProfileScreen({ navigation, route }: EditProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
  });

  // Load initial data from route params or set defaults
  useEffect(() => {
    if (route?.params?.userProfile) {
      // Set form data
      const profile = route.params.userProfile;
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        street: profile.address?.street || '',
        suburb: profile.address?.suburb || '',
        state: profile.address?.state || '',
        postcode: profile.address?.postcode || '',
      });

      // Set license image if available
      if (profile.license?.imageUrl) {
        setLicenseImage(API_BASE_URL + profile.license.imageUrl);
      }

      loadProfileImage();
    }
  }, [route?.params?.userProfile]);

  const loadProfileImage = async () => {
    try {
      const savedUri = await LocalStorage.getProfileImage();
      setProfileImage(savedUri);
    } catch (error) {
      setProfileImage(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = async () => {
    try {
      const result: ImagePickerResult | null = await showImagePickerOptions({
        title: 'Select Profile Picture',
        message: 'Choose how you want to add a profile picture',
      });

      if (result) {
        await LocalStorage.saveProfileImage(result.uri);
        setProfileImage(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.phone && !/^(\+?\d{8,15})$/.test(formData.phone)) {
      Alert.alert('Validation Error', 'Phone number must be between 8 to 15 digits');
      return false;
    }
    if (formData.postcode && !/^\d{4}$/.test(formData.postcode)) {
      Alert.alert('Validation Error', 'Postcode must be a 4-digit number');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updatePayload: UpdateProfilePayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: {
          street: formData.street.trim() || undefined,
          suburb: formData.suburb.trim() || undefined,
          state: formData.state.trim() || undefined,
          postcode: formData.postcode.trim() || undefined,
        },
      };

      // Remove undefined values
      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key as keyof UpdateProfilePayload] === undefined) {
          delete updatePayload[key as keyof UpdateProfilePayload];
        }
      });

      if (updatePayload.address) {
        Object.keys(updatePayload.address).forEach((key) => {
          if (updatePayload.address![key as keyof typeof updatePayload.address] === undefined) {
            delete updatePayload.address![key as keyof typeof updatePayload.address];
          }
        });
      }

      await updateUserProfile(updatePayload);
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('AppTabs', { screen: 'Profile', params: { refresh: true } }),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes', 'Are you sure you want to discard your changes?', [
      { text: 'Keep Editing' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handleImagePicker}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={60} color="#fff" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to change profile picture</Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor="#B9BDC7"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#B9BDC7"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor="#B9BDC7"
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={formData.street}
                onChangeText={(value) => handleInputChange('street', value)}
                placeholder="Enter street address"
                placeholderTextColor="#B9BDC7"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Suburb</Text>
                <TextInput
                  style={styles.input}
                  value={formData.suburb}
                  onChangeText={(value) => handleInputChange('suburb', value)}
                  placeholder="Suburb"
                  placeholderTextColor="#B9BDC7"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder="State"
                  placeholderTextColor="#B9BDC7"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postcode</Text>
              <TextInput
                style={styles.input}
                value={formData.postcode}
                onChangeText={(value) => handleInputChange('postcode', value)}
                placeholder="Enter 4-digit postcode"
                placeholderTextColor="#B9BDC7"
                keyboardType="numeric"
                maxLength={4}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* License Information - Only show if license image exists */}
          {licenseImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>License Information</Text>
              <Image source={{ uri: licenseImage }} style={styles.imagePreview} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#1E3A8A',
    height: 100,
    width: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E3A8A',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
  },
});
