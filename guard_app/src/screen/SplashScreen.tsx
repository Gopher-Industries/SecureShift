import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

import splashIcon from '../../assets/splash-icon.png';
import { LocalStorage } from '../lib/localStorage';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    let isMounted = true;

    const checkTokenAndRedirect = async () => {
      try {
        // get stored token
        const token = await LocalStorage.getToken();

        // delay for splash screen effect
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (!isMounted) return;

        // if no token, go to Login, otherwise go to AppTabs
        if (!token) {
          navigation.replace('Login');
        } else {
          navigation.replace('AppTabs');
        }
      } catch (error) {
        console.error('Error checking token:', error);
        // In case of any error, navigate to Login
        if (isMounted) {
          navigation.replace('Login');
        }
      }
    };

    void checkTokenAndRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={splashIcon} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Secure Shift</Text>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.bg,
      flex: 1,
      justifyContent: 'center',
    },
    logo: {
      height: 80,
      marginBottom: 10,
      width: 80,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '600',
    },
  });
