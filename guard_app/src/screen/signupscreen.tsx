// screens/SignupScreen.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker'; // added for license image picker
import { registerUser } from '../api/auth'; // added for user registration API

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false); // added for loading state
  const [licenseImage, setLicenseImage] = useState<any>(null); // added for storing selected image

  const validate = () => {
    const e = email.trim().toLowerCase(); // normalize email
    const n = fullName.trim();

    if (!e || !n || !password || !confirm) return 'Please fill all required fields.';

    const nameOk = /^[A-Za-z\s'-]+$/.test(n);
    if (!nameOk) return "Name can only contain letters, spaces, hyphens (-), and apostrophes (').";

    const emailOk = /^\S+@\S+\.\S+$/.test(e);
    if (!emailOk) return 'Please enter a valid email address.';

    const pwOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password); // enforce strong password
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
      Alert.alert('License required', 'Please upload your license image.'); // show alert if license missing
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const file = {
        uri: licenseImage.uri,
        name: licenseImage.fileName || 'license.jpg',
        type: licenseImage.mimeType || 'image/jpeg',
      };

      await registerUser({
        name: fullName.trim(),
        email: email.trim(),
        password: password,
        license: file, // send file in payload
      });

      Alert.alert('Success', 'Account created. Please log in.');
      navigation.replace('Login');
    } catch (e: any) {
      const apiMsg =
        e?.response?.data?.message || e?.message || 'Signup failed. Please try again.';
      setError(apiMsg);
      Alert.alert('Signup failed', apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const ctaDisabled = !email.trim() || !fullName.trim() || !password || !confirm || password.length < 6 || submitting;

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1 }]} // added flexGrow to make scroll work in emulator
        keyboardShouldPersistTaps="handled"
      >
        {/* Header: logo, title, subtitle */}
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
            onPress={() => setShowPass(p => !p)}
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
            onPress={() => setShowConfirm(p => !p)}
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

        {/* Upload License button */}
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

              const file = {
                uri: asset.uri,
                name: asset.fileName || 'license.jpg',
                type: asset.mimeType || 'image/jpeg',
              };

              setLicenseImage(file); // store image in state
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Upload your security license"
        >
          <Text style={styles.uploadText}>
            {licenseImage ? 'License uploaded' : 'Upload your security license'}
          </Text>
          <MaterialCommunityIcons name="upload" size={20} color="#111827" style={styles.uploadIcon} />
        </TouchableOpacity>

        {licenseImage && (
          <Image
            source={{ uri: licenseImage.uri }}
            style={styles.imagePreview} // preview uploaded image
          />
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, (ctaDisabled || submitting) && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={ctaDisabled || submitting}
        >
          <Text style={styles.ctaText}>
            {submitting ? 'Signing up...' : 'Sign Up'}
          </Text>
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
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  container: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 },

  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    resizeMode: 'contain',
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center'
  },

  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 18
  },

  error: {
    color: '#B00020',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600'
  },

  label: {
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
    fontWeight: '600'
  },

  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: { fontSize: 16, color: '#111827' },
  padRight: { paddingRight: 44 },
  iconRight: { position: 'absolute', right: 14, height: 56, justifyContent: 'center' },

  uploadBtn: {
    marginTop: 4,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#111827',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  uploadText: { color: '#111827', fontSize: 15 },
  uploadIcon: { marginLeft: 8 },

  cta: {
    marginTop: 24,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#274289',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  footerText: { textAlign: 'center', marginTop: 18, color: '#111827' },
  footerLink: { fontWeight: '700' },

  // style image(after upload)
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