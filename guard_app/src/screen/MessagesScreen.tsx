// Put vector-icons first, then React (to satisfy your import/order rule)
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const NAVY = '#274b93';

type Message = {
  id: string;
  from: 'guard' | 'employer';
  text: string;
  time: string;
};

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'employer',
      text: 'Hi Alex, can you confirm shift for tomorrow?',
      time: '10:00 AM',
    },
    {
      id: '2',
      from: 'guard',
      text: 'Yes, I’ll be there at 9 AM sharp.',
      time: '10:02 AM',
    },
    {
      id: '3',
      from: 'employer',
      text: 'Great, see you then!',
      time: '10:05 AM',
    },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      from: 'guard',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[styles.bubble, item.from === 'guard' ? styles.bubbleGuard : styles.bubbleEmployer]}
    >
      <Text style={styles.msgText}>{item.text}</Text>
      <Text style={styles.msgTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chat}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  kav: { flex: 1 }, // <- replaces inline { flex: 1 }

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },

  chat: { padding: 12 },

  bubble: {
    maxWidth: '75%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
  },
  bubbleGuard: {
    alignSelf: 'flex-end',
    backgroundColor: NAVY,
    borderTopRightRadius: 4,
  },
  bubbleEmployer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderTopLeftRadius: 4,
  },
  msgText: { color: '#fff', fontSize: 15 },
  msgTime: { fontSize: 10, color: '#d1d5db', marginTop: 4, textAlign: 'right' },

  inputBar: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: '#f3f4f6',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
