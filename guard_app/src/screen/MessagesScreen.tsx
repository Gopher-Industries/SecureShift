// Put vector-icons first, then React (to satisfy your import/order rule)
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { getMe } from '../api/auth';
import {
  getConversation,
  getInboxMessages,
  getSentMessages,
  sendMessage as sendMessageApi,
  type MessageDto,
  type MessageUser,
} from '../api/messages';
import type { RootStackParamList } from '../navigation/AppNavigator';

const NAVY = '#274b93';
const SLATE = '#111827';

type Message = {
  id: string;
  from: 'guard' | 'employer';
  senderName: string;
  text: string;
  timestamp: string;
  context: 'shift' | 'general';
  shiftTitle?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
};

export default function MessagesScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Messages'>>();
  const initialContext =
    route.params?.context ?? (route.params?.shiftParticipantId ? 'shift' : 'general');
  const shiftTitle = route.params?.shiftTitle ?? 'Shift conversation';

  const [messagesByContext, setMessagesByContext] = useState<{
    shift: Message[];
    general: Message[];
  }>({ shift: [], general: [] });
  const [input, setInput] = useState('');
  const [activeContext, setActiveContext] = useState<'shift' | 'general'>(initialContext);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; role?: string } | null>(
    null,
  );
  const [shiftParticipant, setShiftParticipant] = useState<{
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [generalParticipant, setGeneralParticipant] = useState<{
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null>(null);

  const contextMessages = useMemo(
    () => messagesByContext[activeContext],
    [messagesByContext, activeContext],
  );
  const activeParticipant = activeContext === 'shift' ? shiftParticipant : generalParticipant;

  const getUserId = (user?: MessageUser) => user?._id ?? user?.id;

  const mapDtoToMessage = (dto: MessageDto, context: 'shift' | 'general'): Message => {
    const senderId = getUserId(dto.sender);
    const isCurrentUser = senderId && senderId === currentUser?.id;
    const inferredRole =
      dto.sender?.role ?? (isCurrentUser ? currentUser?.role : undefined);
    const role = inferredRole === 'employer' ? 'employer' : 'guard';
    return {
      id: dto._id ?? `${dto.timestamp}-${senderId ?? 'unknown'}`,
      from: role,
      senderName: dto.sender?.name ?? dto.sender?.email ?? 'Unknown',
      text: dto.content,
      timestamp: dto.timestamp,
      context,
      shiftTitle: context === 'shift' ? shiftTitle : undefined,
      status: isCurrentUser ? (dto.isRead ? 'read' : 'sent') : undefined,
    };
  };

  const buildParticipantFromMessage = (msg: MessageDto, meId: string) => {
    const senderId = getUserId(msg.sender);
    const receiverId = getUserId(msg.receiver);
    const isSenderMe = senderId && senderId === meId;
    const otherUser = isSenderMe ? msg.receiver : msg.sender;
    const otherId = getUserId(otherUser);
    if (!otherId) return null;
    return {
      id: otherId,
      name: otherUser?.name ?? otherUser?.email ?? 'Participant',
      email: otherUser?.email,
      role: otherUser?.role,
    };
  };

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await getMe();
        const meId = me?._id ?? me?.id;
        if (!meId) throw new Error('Unable to determine user');
        setCurrentUser({ id: meId, name: me?.name, role: me?.role });

        if (route.params?.shiftParticipantId) {
          setShiftParticipant({
            id: route.params.shiftParticipantId,
            name: route.params.shiftParticipantName ?? 'Shift participant',
          });
        }

        if (route.params?.generalParticipantId) {
          setGeneralParticipant({
            id: route.params.generalParticipantId,
            name: route.params.generalParticipantName ?? 'Conversation',
          });
          return;
        }

        const [inbox, sent] = await Promise.all([getInboxMessages(), getSentMessages()]);
        const combined = [...inbox, ...sent].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        const first = combined[0];
        const participant = first ? buildParticipantFromMessage(first, meId) : null;
        if (participant) {
          setGeneralParticipant(participant);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    void loadParticipants();
  }, [route.params?.generalParticipantId, route.params?.generalParticipantName, route.params?.shiftParticipantId, route.params?.shiftParticipantName]);

  useEffect(() => {
    const loadConversation = async () => {
      const participant = activeContext === 'shift' ? shiftParticipant : generalParticipant;
      if (!participant?.id) {
        setMessagesByContext((prev) => ({ ...prev, [activeContext]: [] }));
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const conversation = await getConversation(participant.id);
        if (conversation?.participant) {
          const { id, _id, name, email, role } = conversation.participant;
          const normalizedParticipant = {
            id: id ?? _id ?? participant.id,
            name: name ?? email ?? participant.name,
            email,
            role,
          };
          if (activeContext === 'shift') {
            setShiftParticipant(normalizedParticipant);
          } else {
            setGeneralParticipant(normalizedParticipant);
          }
        }
        const mapped = (conversation?.messages ?? []).map((msg) => mapDtoToMessage(msg, activeContext));
        setMessagesByContext((prev) => ({ ...prev, [activeContext]: mapped }));
      } catch (e) {
        console.error(e);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    void loadConversation();
  }, [activeContext, generalParticipant?.id, shiftParticipant?.id, currentUser?.id]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async () => {
    if (!input.trim()) return;
    const participant = activeContext === 'shift' ? shiftParticipant : generalParticipant;
    if (!participant?.id) {
      Alert.alert('No recipient', 'Select a conversation before sending.');
      return;
    }

    const newId = Date.now().toString();
    const newMsg: Message = {
      id: newId,
      from: currentUser?.role === 'employer' ? 'employer' : 'guard',
      senderName: currentUser?.name ?? 'You',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      context: activeContext,
      shiftTitle: activeContext === 'shift' ? shiftTitle : undefined,
      status: 'sending',
    };
    setMessagesByContext((prev) => ({ ...prev, [activeContext]: [...prev[activeContext], newMsg] }));
    setInput('');

    try {
      const sent = await sendMessageApi({ receiverId: participant.id, content: newMsg.text });
      setMessagesByContext((prev) => ({
        ...prev,
        [activeContext]: prev[activeContext].map((msg) =>
          msg.id === newId
            ? {
                ...msg,
                id: sent.messageId ?? msg.id,
                timestamp: sent.timestamp ?? msg.timestamp,
                status: sent.isRead ? 'read' : 'sent',
              }
            : msg,
        ),
      }));
    } catch (e) {
      console.error(e);
      setMessagesByContext((prev) => ({
        ...prev,
        [activeContext]: prev[activeContext].filter((msg) => msg.id !== newId),
      }));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageRow}>
      <View
        style={[styles.bubble, item.from === 'guard' ? styles.bubbleGuard : styles.bubbleEmployer]}
      >
        <Text style={styles.msgSender}>
          {item.senderName} • {item.from === 'guard' ? 'Guard' : 'Employer'}
        </Text>
        <Text style={item.from === 'guard' ? styles.msgTextLight : styles.msgTextDark}>
          {item.text}
        </Text>
        <View style={styles.metaRow}>
          <Text style={item.from === 'guard' ? styles.msgTimeLight : styles.msgTimeDark}>
            {formatTime(item.timestamp)}
          </Text>
          {item.from === 'guard' && item.status && (
            <Text style={styles.msgStatus}>• {item.status}</Text>
          )}
        </View>
      </View>
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
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.contextToggle}>
            <TouchableOpacity
              style={[
                styles.contextChip,
                activeContext === 'shift' && styles.contextChipActive,
              ]}
              onPress={() => setActiveContext('shift')}
            >
              <Text
                style={[
                  styles.contextChipText,
                  activeContext === 'shift' && styles.contextChipTextActive,
                ]}
              >
                Shift
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.contextChip,
                activeContext === 'general' && styles.contextChipActive,
              ]}
              onPress={() => setActiveContext('general')}
            >
              <Text
                style={[
                  styles.contextChipText,
                  activeContext === 'general' && styles.contextChipTextActive,
                ]}
              >
                General
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contextBanner}>
          <Text style={styles.contextBannerText}>
            {activeContext === 'shift' ? shiftTitle : 'General conversation'}
          </Text>
          <Text style={styles.contextBannerSub}>
            {activeParticipant?.name ? `With ${activeParticipant.name}` : 'No participant selected'}
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <FlatList
          data={contextMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.chat,
            contextMessages.length === 0 && styles.chatEmpty,
          ]}
          ListEmptyComponent={
            loading ? (
              <View style={styles.placeholder}>
                <ActivityIndicator />
                <Text style={styles.placeholderTitle}>Loading messages…</Text>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color="#9ca3af" />
                <Text style={styles.placeholderTitle}>No messages yet</Text>
                <Text style={styles.placeholderText}>
                  Start the conversation to coordinate shifts or share updates.
                </Text>
              </View>
            )
          }
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Employer is typing…</Text>
            </View>
            <TouchableOpacity
              style={styles.typingToggle}
              onPress={() => setIsTyping(false)}
            >
              <Text style={styles.typingToggleText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, !activeParticipant?.id && styles.inputDisabled]}
            placeholder={
              activeParticipant?.id ? 'Type your message...' : 'Select a conversation to start'
            }
            value={input}
            onChangeText={setInput}
            editable={Boolean(activeParticipant?.id)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !activeParticipant?.id && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!activeParticipant?.id}
          >
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
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  contextToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 2,
  },
  contextChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  contextChipActive: { backgroundColor: '#ffffff' },
  contextChipText: { fontSize: 12, color: '#e5e7eb', fontWeight: '600' },
  contextChipTextActive: { color: NAVY },

  contextBanner: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contextBannerText: { fontSize: 14, fontWeight: '700', color: SLATE },
  contextBannerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  errorText: { color: '#b91c1c', paddingHorizontal: 16, paddingTop: 8 },

  chat: { padding: 12 },
  chatEmpty: { flexGrow: 1, justifyContent: 'center' },
  placeholder: { alignItems: 'center', paddingHorizontal: 24 },
  placeholderTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: SLATE },
  placeholderText: { marginTop: 4, textAlign: 'center', color: '#6b7280' },

  messageRow: { marginBottom: 10 },
  bubble: {
    maxWidth: '75%',
    padding: 12,
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
  msgSender: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '600' },
  msgTextLight: { color: '#fff', fontSize: 15 },
  msgTextDark: { color: SLATE, fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  msgTimeLight: { fontSize: 10, color: '#d1d5db' },
  msgTimeDark: { fontSize: 10, color: '#6b7280' },
  msgStatus: { marginLeft: 4, fontSize: 10, color: '#c7d2fe' },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: { color: SLATE, fontSize: 12, fontWeight: '600' },
  typingToggle: { marginLeft: 8 },
  typingToggleText: { color: NAVY, fontSize: 12, fontWeight: '600' },

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
  inputDisabled: { opacity: 0.6 },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
