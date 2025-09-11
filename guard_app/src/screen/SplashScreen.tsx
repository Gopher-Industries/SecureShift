import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import the app's navigation param list from the App entry to keep types aligned
// Note: We import type-only to avoid circular runtime deps

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    height: 80,
    marginBottom: 10,
    width: 80,
  },
  title: {
    color: '#1E1E1E',
    fontSize: 24,
    fontWeight: '600',
  },
});
