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
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/Auth';

const USER_KEY = 'DEMO_USER';

export default function LoginScreen({ navigation }: any) {

  const { login } = useAuth();

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

  const handleLogin = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      Alert.alert('Invalid input', msg);
      return;
    }

    setError(null);

    try {
      if (Platform.OS === 'web') {
        const jwt = 'demo.jwt.token';
        await login(jwt);
        navigation.replace('AppTabs');
        return;
      }

      const saved = await SecureStore.getItemAsync(USER_KEY);

      if (!saved) {
        Alert.alert('Error', 'No account found. Please sign up first.');
        return;
      }

      const { email: savedEmail, password: savedPass } = JSON.parse(saved);

      if (email.trim() !== savedEmail || password !== savedPass) {
        Alert.alert('Error', 'Email or password is incorrect.');
        return;
      }

      const jwt = 'demo.jwt.token';
      await login(jwt);
      console.log("Login success on native, JWT stored:", jwt);
      navigation.replace('AppTabs');
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Login failed. Please try again.');
    }
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
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
  },
  error: {
    color: '#B00020',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  label: {
    marginTop: 24,
    marginBottom: 8,
    color: '#111827',
    fontWeight: '600',
  },
  mt16: { marginTop: 16 },
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
  input: {
    fontSize: 16,
    color: '#111827',
  },
  padRight: { paddingRight: 44 },
  eye: {
    position: 'absolute',
    right: 14,
    height: 56,
    justifyContent: 'center',
  },
  button: {
    marginTop: 28,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#274289',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footerText: {
    textAlign: 'center',
    marginTop: 22,
    color: '#111827',
  },
  footerLink: {
    fontWeight: '700',
  },
});