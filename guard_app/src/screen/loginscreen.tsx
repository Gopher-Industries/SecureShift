import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import {
  login as apiLogin,
  verifyOtp as apiVerifyOtp,
  getMe, // Added to fetch current user's profile
} from '../api/auth';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = email.trim().toLowerCase();
    const emailOk = /^\S+@\S+\.\S+$/.test(e);
    if (!emailOk) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const goToApp = async () => {
    navigation.reset({ index: 0, routes: [{ name: 'AppTabs' as never }] });
  };

  const handleLogin = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert('Invalid input', msg);
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiLogin({ email: email.trim(), password });

      if (res.token) {
        await AsyncStorage.setItem('auth_token', res.token); // Save token
        await goToApp(); // Direct login
      } else {
        setOtpMode(true); // Switch to OTP input
        Alert.alert('OTP required', 'Please enter the code sent to your email.');
      }
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message ?? e?.message ?? 'Try again';
      setError(apiMsg);
      Alert.alert('Login failed', apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // OTP verification logic with license status check
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('OTP required', 'Enter your OTP code.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiVerifyOtp({ email: email.trim(), otp: otp.trim() });

      const token = res.token;
      if (!token) throw new Error('No token returned');

      // Save token
      await AsyncStorage.setItem('auth_token', token);

      // Fetch user profile to check license status
      const user = await getMe();
      const license = user?.license;

      if (!license) {
        Alert.alert('Error', 'License info not found.');
        return;
      }

      const status = license.status;
      const reason = license.rejectionReason;

      if (status === 'verified') {
        // If verified, go to app
        await goToApp();
      } else if (status === 'pending') {
        // If pending, show info message
        Alert.alert(
          'License Pending',
          'Your license is currently under review. You will be notified once it is verified.',
        );
      } else if (status === 'rejected') {
        // If rejected, show rejection reason
        Alert.alert(
          'License Rejected',
          `Your license was rejected.\n\nReason: ${reason || 'No reason provided'}.\n\nPlease check your email for more details.`,
        );
      } else {
        Alert.alert('Unknown License Status', `Status: ${status}`);
      }
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message ?? e?.message ?? 'Invalid or expired code';
      setError(apiMsg);
      Alert.alert('OTP verification failed', apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Login with your email and password</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Email input */}
        <Text style={styles.label}>Email*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#B9BDC7"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (otpMode) {
                setOtpMode(false);
                setOtp('');
              }
              if (error) setError(null);
            }}
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        {/* Password input */}
        <Text style={[styles.label, styles.mt16]}>Password*</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.padRight]}
            placeholder="Enter your password"
            placeholderTextColor="#B9BDC7"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError(null);
            }}
            textContentType="password"
          />
          <TouchableOpacity
            onPress={() => setShowPass((s) => !s)}
            style={styles.eye}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        {/* OTP input */}
        {otpMode && (
          <>
            <Text style={styles.label}>Enter OTP*</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#B9BDC7"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { marginTop: 16 }, submitting && { opacity: 0.6 }]}
              onPress={handleVerifyOtp}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{submitting ? 'Verifying...' : 'Verify OTP'}</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('Signup')}>
            Sign Up
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#274289',
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  error: { color: '#B00020', fontWeight: '600', marginTop: 12, textAlign: 'center' },
  eye: { height: 56, justifyContent: 'center', position: 'absolute', right: 14 },
  footerLink: { fontWeight: '700' },
  footerText: { color: '#111827', marginTop: 22, textAlign: 'center' },
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
  label: { color: '#111827', fontWeight: '600', marginBottom: 8, marginTop: 24 },
  logo: { alignSelf: 'center', height: 150, resizeMode: 'contain', width: 150 },
  mt16: { marginTop: 16 },
  padRight: { paddingRight: 44 },
  safe: { backgroundColor: '#F5F6FA', flex: 1 },
  subtitle: { color: '#6B7280', marginTop: 6, textAlign: 'center' },
});
