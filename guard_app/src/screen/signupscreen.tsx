// screens/SignupScreen.tsx
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SignupScreen({ navigation }: any) {


  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const validate = () => {
    const e = email.trim();
    const n = fullName.trim();
    if (!e || !n || !password || !confirm) return 'Please fill all required fields.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!emailOk) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const onSubmit = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert('Invalid input', msg);
      return;
    }
    setError(null);
    navigation.replace('Login');
  };

  const ctaDisabled =
    !email.trim() || !fullName.trim() || !password || !confirm || password.length < 6;



  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header: logo, title, subtitle */}
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Secure Shift</Text>
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

        {/* Upload License button (UI only) */}
        <Text style={styles.label}>Upload License*</Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Upload your security license"
        >
          <Text style={styles.uploadText}>Upload your security license</Text>
          <MaterialCommunityIcons name="upload" size={20} color="#111827" style={styles.uploadIcon} />
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, ctaDisabled && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={ctaDisabled}
        >
          <Text style={styles.ctaText}>Sign Up</Text>
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


  logo: { width: 150, height: 150, alignSelf: 'center', resizeMode: 'contain', marginBottom: 12 },

  title: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { marginTop: 6, textAlign: 'center', color: '#6B7280', marginBottom: 18 },

  error: { color: '#B00020', textAlign: 'center', marginTop: 10, marginBottom: 4, fontWeight: '600' },

  label: { marginTop: 16, marginBottom: 8, color: '#111827', fontWeight: '600' },

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
});