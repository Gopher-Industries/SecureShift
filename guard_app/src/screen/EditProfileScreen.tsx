/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';
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
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

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

  useEffect(() => {
    if (route?.params?.userProfile) {
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
      Alert.alert(
        t('signup.success') || 'Success',
        t('editProfile.success') || 'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('AppTabs', { screen: 'Profile', params: { refresh: true } }),
          },
        ],
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? t('editProfile.saving') : t('editProfile.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editProfile.changeImage')}</Text>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handleImagePicker}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={60} color={colors.white} />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={20} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>{t('editProfile.uploadNew')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editProfile.personalInfo')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('editProfile.name')}</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder=""
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('editProfile.email')}</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder=""
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('editProfile.phone')}</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder=""
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('editProfile.address')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('editProfile.street')}</Text>
              <TextInput
                style={styles.input}
                value={formData.street}
                onChangeText={(value) => handleInputChange('street', value)}
                placeholder=""
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('editProfile.suburb')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.suburb}
                  onChangeText={(value) => handleInputChange('suburb', value)}
                  placeholder=""
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('editProfile.state')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder=""
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('editProfile.postcode')}</Text>
              <TextInput
                style={styles.input}
                value={formData.postcode}
                onChangeText={(value) => handleInputChange('postcode', value)}
                placeholder=""
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={4}
                autoCorrect={false}
              />
            </View>
          </View>

          {licenseImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('editProfile.licenseInfo')}</Text>
              <Image source={{ uri: licenseImage }} style={styles.imagePreview} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.bg,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    avatar: {
      backgroundColor: colors.primary,
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
      backgroundColor: colors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarHint: {
      fontSize: 12,
      color: colors.muted,
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
      borderColor: colors.border,
      borderWidth: 1,
    },
  });
