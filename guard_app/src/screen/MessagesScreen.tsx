import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { getStyles } from './MessagesScreen.styles';
import EmptyState from '../components/EmptyState';
import ConversationItemComponent, {
  type ConversationItemData,
} from '../components/list/ConversationItem';
import MessageItem from '../components/list/MessageItem';
import LoadingState from '../components/LoadingState';
import { useMessages, type ConversationItem, type Message } from '../hooks/useMessages';
import { useAppTheme } from '../theme';

export default function MessagesScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const {
    shiftTitle,
    activeContext,
    setActiveContext,
    activeParticipant,
    contextMessages,
    conversations,
    input,
    setInput,
    isTyping,
    setIsTyping,
    loading,
    error,
    newRecipientId,
    setNewRecipientId,
    newRecipientName,
    setNewRecipientName,
    messagesListRef,
    sendMessage,
    handleConversationPress,
    handleStartConversation,
  } = useMessages();

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageItem message={item} />,
    [],
  );

  const renderConversation = useCallback(
    ({ item }: { item: ConversationItem }) => (
      <ConversationItemComponent conversation={item} onPress={handleConversationPress} />
    ),
    [handleConversationPress],
  );

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.white} />
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.contextToggle}>
            <TouchableOpacity
              style={[styles.contextChip, activeContext === 'shift' && styles.contextChipActive]}
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
              style={[styles.contextChip, activeContext === 'general' && styles.contextChipActive]}
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

        {activeContext === 'general' && !activeParticipant?.id ? (
          <View style={styles.conversationListWrap}>
            <Text style={styles.sectionTitle}>Conversations</Text>
            <View style={styles.newConversationCard}>
              <Text style={styles.newConversationTitle}>Start a new conversation</Text>
              <TextInput
                style={styles.newConversationInput}
                placeholder="Recipient user ID"
                placeholderTextColor={colors.muted}
                value={newRecipientId}
                onChangeText={setNewRecipientId}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.newConversationInput}
                placeholder="Recipient name (optional)"
                placeholderTextColor={colors.muted}
                value={newRecipientName}
                onChangeText={setNewRecipientName}
              />
              <TouchableOpacity style={styles.newConversationBtn} onPress={handleStartConversation}>
                <Text style={styles.newConversationBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={conversations}
              keyExtractor={keyExtractor}
              renderItem={renderConversation}
              initialNumToRender={12}
              maxToRenderPerBatch={8}
              windowSize={10}
              removeClippedSubviews={Platform.OS === 'android'}
              contentContainerStyle={[styles.chat, conversations.length === 0 && styles.chatEmpty]}
              ListEmptyComponent={
                loading ? (
                  <LoadingState rows={2} />
                ) : (
                  <EmptyState
                    icon="chatbubble-ellipses-outline"
                    title="No conversations yet"
                    message="Start a new chat from a shift or by selecting a contact."
                  />
                )
              }
            />
          </View>
        ) : (
          <FlatList
            ref={messagesListRef}
            data={contextMessages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews={Platform.OS === 'android'}
            // Pin the view to the newest message whenever content grows or shrinks.
            // Fires on initial mount (jumps to bottom), on every sent message
            // (optimistic insert grows the list), and on every polled-in message.
            onContentSizeChange={() => messagesListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={[styles.chat, contextMessages.length === 0 && styles.chatEmpty]}
            ListEmptyComponent={
              loading ? (
                <LoadingState rows={2} />
              ) : (
                <EmptyState
                  icon="chatbubble-ellipses-outline"
                  title="No messages yet"
                  message="Start the conversation to coordinate shifts or share updates."
                />
              )
            }
          />
        )}

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Employer is typing…</Text>
            </View>
            <TouchableOpacity style={styles.typingToggle} onPress={() => setIsTyping(false)}>
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
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            editable={Boolean(activeParticipant?.id)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !activeParticipant?.id && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!activeParticipant?.id}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
