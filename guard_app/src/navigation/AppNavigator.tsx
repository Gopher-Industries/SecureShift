import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppTabs from './AppTabs';
import EditProfileScreen from '../screen/EditProfileScreen';
import LoginScreen from '../screen/loginscreen';
import MessagesScreen from '../screen/MessagesScreen';
import NotificationsScreen from '../screen/notifications';
import SettingsScreen from '../screen/SettingsScreen';
import SignupScreen from '../screen/signupscreen';
import SplashScreen from '../screen/SplashScreen';

export type RootStackParamList = {
  AppTabs: undefined;
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Messages: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // TEMP (Dev Only): bypass auth screens so you can complete UI tasks without backend
  const DEV_BYPASS_AUTH = __DEV__ && true;

  return (
    <Stack.Navigator
      initialRouteName={DEV_BYPASS_AUTH ? 'AppTabs' : 'Splash'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Messages' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: true, title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
}
