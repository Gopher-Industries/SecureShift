// screens/LoginScreen.tsx
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleLogin = () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert('Invalid input', msg);
      return;
    }
    setError(null);
    // Go to the bottom tabs after successful login
    navigation.replace('AppTabs');
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Logo */}
        <Image source={require('../../assets/logo.png')} style={styles.logo} />

        {/* Title + subtitle */}
        <Text style={styles.subtitle}>Login with your email and password</Text>

        {/* Email */}
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
              if (error) setError(null);
            }}
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>

        {/* Password */}
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

        {/* Login button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Sign up prompt */}
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  error: {
    color: '#B00020',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  eye: {
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
  },
  footerLink: {
    fontWeight: '700',
  },
  footerText: {
    color: '#111827',
    marginTop: 22,
    textAlign: 'center',
  },
  input: {
    color: '#111827',
    fontSize: 16,
  },
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
  label: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 24,
  },
  logo: {
    alignSelf: 'center',
    height: 150,
    resizeMode: 'contain',
    width: 150,
  },
  mt16: { marginTop: 16 },
  padRight: { paddingRight: 44 },
  safe: {
    backgroundColor: '#F5F6FA',
    flex: 1,
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: '#1F2937',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
});
