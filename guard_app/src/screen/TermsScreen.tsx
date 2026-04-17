import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const TermsScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>

      <Text style={styles.sectionTitle}>Usage Rules</Text>
      <Text style={styles.text}>
        - Use the app responsibly{'\n'}- Do not misuse the platform{'\n'}- Follow all guidelines
        provided
      </Text>

      <Text style={styles.sectionTitle}>User Responsibilities</Text>
      <Text style={styles.text}>
        - Keep your account secure{'\n'}- Provide accurate information{'\n'}- Respect other users
      </Text>

      <Text style={styles.sectionTitle}>Account Restrictions</Text>
      <Text style={styles.text}>
        - Accounts may be suspended for violations{'\n'}- Multiple fake accounts are not allowed
        {'\n'}- Any suspicious activity may lead to termination
      </Text>
    </ScrollView>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  text: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },
});
