import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screen/ProfileScreen';
import ShiftScreen from '../screen/ShiftScreen';

type RootStackParamList = {
  Profile: undefined;
  Shifts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Profile">
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={({ navigation }) => ({
            headerTitle: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Shifts')}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Profile</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Shifts"
          component={ShiftScreen}
          options={({ navigation }) => ({
            headerTitle: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Shifts</Text>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
