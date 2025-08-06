import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Button,
} from 'react-native';

export default function ProfileScreen() {
  const [phone, setPhone] = useState('0412 345 678');
  const [email, setEmail] = useState('john.guard@example.com');
  const [bio, setBio] = useState('Experienced crowd control guard. Works well under pressure.');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar */}
      <Image
        source={{ uri: 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />

      {/* Static Info */}
      <Text style={styles.name}>John Smith</Text>
      <Text style={styles.label}>License: LIC-987654</Text>
      <Text style={styles.label}>Rating: ★ 4.7</Text>
      <Text style={styles.label}>Shifts Completed: 32</Text>

      {/* Editable Fields */}
      <Text style={styles.sectionHeader}>Contact Info</Text>

      <TextInput
        style={styles.input}
        value={phone}
        editable={false} // set to true later when implementing editing
        onChangeText={setPhone}
        placeholder="Phone Number"
      />

      <TextInput
        style={styles.input}
        value={email}
        editable={false}
        onChangeText={setEmail}
        placeholder="Email"
      />

      <Text style={styles.sectionHeader}>About You</Text>

      <TextInput
        style={[styles.input, styles.textarea]}
        value={bio}
        editable={false}
        onChangeText={setBio}
        placeholder="Bio"
        multiline
      />

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <Button title="Edit Profile" onPress={() => {}} />
        <Button title="Logout" color="red" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  sectionHeader: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    fontSize: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    width: '100%',
    marginTop: 30,
    gap: 12,
  },
});
