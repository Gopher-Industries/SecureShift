// src/screen/signupscreen.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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

import { registerUser } from '../api/auth';

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

    if (!e || !n || !password || !confirm) return 'Please fill all required fields.';

    const nameOk = /^[A-Za-z\s'-]+$/.test(n);
    if (!nameOk) return "Name can only contain letters, spaces, hyphens (-), and apostrophes (').";

    const emailOk = /^\S+@\S+\.\S+$/.test(e);
    if (!emailOk) return 'Please enter a valid email address.';

    const pwOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password);
    if (!pwOk) {
      return 'Password needs 6+ chars with uppercase, lowercase, number, and special character.';
    }

    if (password !== confirm) return 'Passwords do not match.';

    return null;
  };

  const onSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert('Invalid input', msg);
      return;
    }

    if (!licenseImage) {
      Alert.alert('License required', 'Please upload your license image.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await registerUser({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        // RN FormData file shape — cast kept local to the callsite
        license: {
          uri: licenseImage.uri,
          name: licenseImage.name || 'license.jpg',
          type: licenseImage.type || 'image/jpeg',
        } as unknown as File,
      });

      Alert.alert('Success', 'Account created. Please log in.');
      navigation.replace('Login');
    } catch (e: unknown) {
      const err = e as ErrorLike;
      const apiMsg =
        err?.response?.data?.message ?? err?.message ?? 'Signup failed. Please try again.';
      setError(apiMsg);
      Alert.alert('Signup failed', apiMsg);
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
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Create an account and start looking for your shift</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Email */}
        <Text style={styles.label}>Email*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#B9BDC7"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Full Name */}
        <Text style={styles.label}>Full Name*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#B9BDC7"
            autoCorrect={false}
            textContentType="name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Password*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.padRight]}
            placeholder="Enter your password"
            placeholderTextColor="#B9BDC7"
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
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm Password*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.padRight]}
            placeholder="Confirm your password"
            placeholderTextColor="#B9BDC7"
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
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Upload License */}
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
          accessibilityLabel="Upload your security license"
        >
          <Text style={styles.uploadText}>
            {licenseImage ? 'License uploaded' : 'Upload your security license'}
          </Text>
          <MaterialCommunityIcons
            name="upload"
            size={20}
            color="#111827"
            style={styles.uploadIcon}
          />
        </TouchableOpacity>

        {licenseImage ? (
          <Image source={{ uri: licenseImage.uri }} style={styles.imagePreview} />
        ) : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, (ctaDisabled || submitting) && styles.ctaDisabled]}
          onPress={onSubmit}
          disabled={ctaDisabled || submitting}
        >
          <Text style={styles.ctaText}>{submitting ? 'Signing up...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.replace('Login')}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24, paddingHorizontal: 24, paddingTop: 36 },
  containerGrow: { flexGrow: 1 },
  cta: {
    alignItems: 'center',
    backgroundColor: '#274289',
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    marginTop: 24,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  error: {
    color: '#B00020',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
    textAlign: 'center',
  },
  footerLink: { fontWeight: '700' },
  footerText: { color: '#111827', marginTop: 18, textAlign: 'center' },
  iconRight: { height: 56, justifyContent: 'center', position: 'absolute', right: 14 },
  imagePreview: {
    alignSelf: 'center',
    borderColor: '#ccc',
    borderRadius: 12,
    borderWidth: 1,
    height: 120,
    marginTop: 12,
    width: 120,
  },
  input: { color: '#111827', fontSize: 16 },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
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
  label: { color: '#111827', fontWeight: '600', marginBottom: 8, marginTop: 16 },
  logo: { alignSelf: 'center', height: 150, resizeMode: 'contain', width: 150 },
  padRight: { paddingRight: 44 },
  safe: { backgroundColor: '#F5F6FA', flex: 1 },
  subtitle: { color: '#6B7280', marginBottom: 18, marginTop: 6, textAlign: 'center' },
  uploadBtn: {
    alignItems: 'center',
    borderColor: '#111827',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  uploadIcon: { marginLeft: 8 },
  uploadText: { color: '#111827', fontSize: 15 },
});
