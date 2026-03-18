import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

import splashIcon from '../../assets/splash-icon.png';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LocalStorage } from '../lib/localStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const checkTokenAndRedirect = async () => {
      try {
        const token = await LocalStorage.getToken();

        setTimeout(() => {
          if (!token) {
            navigation.replace('Login');
          } else {
            navigation.replace('AppTabs');
          }
        }, 1500);
      } catch (error) {
        console.error('Error checking token:', error);
        navigation.replace('Login');
      }
    };

    checkTokenAndRedirect();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={splashIcon} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Secure Shift</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flex: 1,
    justifyContent: 'center',
  },
  logo: { height: 80, marginBottom: 10, width: 80 },
  title: { color: '#1E1E1E', fontSize: 24, fontWeight: '600' },
});
