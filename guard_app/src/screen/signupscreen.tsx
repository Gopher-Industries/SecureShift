// src/screen/signupscreen.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import logo from '../../assets/logo.png';
import { registerUser } from '../api/auth';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

type SignupNav = { replace: (name: string) => void };

type LicenseFile = {
  uri: string;
  name?: string;
  type?: string;
};

type ErrorLike = {
  response?: { data?: { message?: string } };
  message?: string;
};

export default function SignupScreen({ navigation }: { navigation: SignupNav }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [licenseImage, setLicenseImage] = useState<LicenseFile | null>(null);

  const validate = () => {
    const e = email.trim().toLowerCase();
    const n = fullName.trim();

    if (!e || !n || !password || !confirm)
      return t('err.requiredFields', 'Please fill all required fields.');

    const nameOk = /^[A-Za-z\s'-]+$/.test(n);
    if (!nameOk)
      return t(
        'err.invalidName',
        "Name can only contain letters, spaces, hyphens (-), and apostrophes (').",
      );

    const emailOk = /^\S+@\S+\.\S+$/.test(e);
    if (!emailOk) return t('err.invalidEmail');

    const pwOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password);
    if (!pwOk) {
      return t(
        'err.weakPassword',
        'Password needs 6+ chars with uppercase, lowercase, number, and special character.',
      );
    }

    if (password !== confirm) return t('err.passwordMatch', 'Passwords do not match.');

    return null;
  };

  const onSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert(t('login.invalidInput', 'Invalid input'), msg);
      return;
    }

    if (!licenseImage) {
      Alert.alert(
        t('signup.licenseReq', 'License required'),
        t('signup.uploadLicense', 'Please upload your license image.'),
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await registerUser({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        license: {
          uri: licenseImage.uri,
          name: licenseImage.name || 'license.jpg',
          type: licenseImage.type || 'image/jpeg',
        } as unknown as File,
      });

      Alert.alert(
        t('signup.success', 'Success'),
        t('signup.created', 'Account created. Please log in.'),
      );
      navigation.replace('Login');
    } catch (e: unknown) {
      const err = e as ErrorLike;
      const apiMsg =
        err?.response?.data?.message ??
        err?.message ??
        t('err.tryAgain', 'Signup failed. Please try again.');
      setError(apiMsg);
      Alert.alert(t('signup.failed', 'Signup failed'), apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const ctaDisabled =
    !email.trim() || !fullName.trim() || !password || !confirm || password.length < 6 || submitting;

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, styles.containerGrow]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={logo} style={styles.logo} />
        <Text style={styles.subtitle}>
          {t('signup.subtitle', 'Create an account and start looking for your shift')}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{t('signup.email', 'Email*')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={t('login.emailPlaceholder', 'Enter your email')}
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>{t('signup.fullName', 'Full Name*')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={t('signup.fullNamePlaceholder', 'Enter your full name')}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            textContentType="name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <Text style={styles.label}>{t('signup.password', 'Password*')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.padRight]}
            placeholder={t('login.passwordPlaceholder', 'Enter your password')}
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPass}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPass((p) => !p)}
            style={styles.iconRight}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={showPass ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('signup.confirmPassword', 'Confirm Password*')}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.padRight]}
            placeholder={t('signup.confirmPasswordPlaceholder', 'Confirm your password')}
            placeholderTextColor={colors.muted}
            secureTextEntry={!showConfirm}
            textContentType="password"
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((p) => !p)}
            style={styles.iconRight}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });

            if (!result.canceled) {
              const asset = result.assets[0];
              setLicenseImage({
                uri: asset.uri,
                name: asset.fileName || 'license.jpg',
                type: asset.mimeType || 'image/jpeg',
              });
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('signup.uploadLicense', 'Upload your security license')}
        >
          <Text style={styles.uploadText}>
            {licenseImage
              ? t('signup.licenseUploaded', 'License uploaded')
              : t('signup.uploadLicense', 'Upload your security license')}
          </Text>
          <MaterialCommunityIcons
            name="upload"
            size={20}
            color={colors.text}
            style={styles.uploadIcon}
          />
        </TouchableOpacity>

        {licenseImage ? (
          <Image source={{ uri: licenseImage.uri }} style={styles.imagePreview} />
        ) : null}

        <TouchableOpacity
          style={[styles.cta, (ctaDisabled || submitting) && styles.ctaDisabled]}
          onPress={onSubmit}
          disabled={ctaDisabled || submitting}
        >
          <Text style={styles.ctaText}>
            {submitting ? t('signup.signingUp', 'Signing up...') : t('signup.button', 'Sign Up')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {t('signup.haveAccount', 'Already have an account?')}*?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.replace('Login')}>
            {t('signup.loginLink', 'Login')}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { paddingBottom: 24, paddingHorizontal: 24, paddingTop: 36 },
    containerGrow: { flexGrow: 1 },
    cta: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: 58,
      justifyContent: 'center',
      marginTop: 24,
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: colors.white, fontSize: 16, fontWeight: '600' },
    error: {
      color: colors.status.rejected,
      fontWeight: '600',
      marginBottom: 4,
      marginTop: 10,
      textAlign: 'center',
    },
    footerLink: { fontWeight: '700', color: colors.primary },
    footerText: { color: colors.text, marginTop: 18, textAlign: 'center' },
    iconRight: { height: 56, justifyContent: 'center', position: 'absolute', right: 14 },
    imagePreview: {
      alignSelf: 'center',
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      height: 120,
      marginTop: 12,
      width: 120,
    },
    input: { color: colors.text, fontSize: 16 },
    inputWrap: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 1,
      height: 56,
      justifyContent: 'center',
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    label: { color: colors.text, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    logo: { alignSelf: 'center', height: 150, resizeMode: 'contain', width: 150 },
    padRight: { paddingRight: 44 },
    safe: { backgroundColor: colors.bg, flex: 1 },
    subtitle: { color: colors.muted, marginBottom: 18, marginTop: 6, textAlign: 'center' },
    uploadBtn: {
      alignItems: 'center',
      borderColor: colors.text,
      borderRadius: 14,
      borderWidth: 1.5,
      flexDirection: 'row',
      height: 56,
      justifyContent: 'center',
      marginTop: 4,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
    },
    uploadIcon: { marginLeft: 8 },
    uploadText: { color: colors.text, fontSize: 15 },
  });
