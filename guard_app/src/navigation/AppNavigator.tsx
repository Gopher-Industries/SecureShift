import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppTabs from './AppTabs';
import EditProfileScreen from '../screen/EditProfileScreen';
import LoginScreen from '../screen/loginscreen';
import MessagesScreen from '../screen/MessagesScreen';
import NotificationsScreen from '../screen/notifications';
import SettingsScreen from '../screen/SettingsScreen';
import ShiftDetailsScreen from '../screen/ShiftDetailsScreen';
import SignupScreen from '../screen/signupscreen';
import SplashScreen from '../screen/SplashScreen';
export type RootStackParamList = {
  AppTabs: undefined;
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Messages:
    | {
        context?: 'shift' | 'general';
        shiftParticipantId?: string;
        shiftParticipantName?: string;
        shiftTitle?: string;
        generalParticipantId?: string;
        generalParticipantName?: string;
      }
    | undefined;

  Notifications: undefined;
  ShiftDetails: { shift: any; refresh?: () => void };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShiftDetails"
        component={ShiftDetailsScreen}
        options={{ headerShown: true, title: 'Shift Details' }}
      />
    </Stack.Navigator>
  );
}
