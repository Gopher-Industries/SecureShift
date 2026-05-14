// component/list/ConversationItem.tsx
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../theme';

import type { AppColors } from '../../theme/colors';

export type ConversationItemData = {
  id: string;
  name: string;
  role?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
};

type Props = {
  conversation: ConversationItemData;
  onPress: (conversation: ConversationItemData) => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ConversationItem({ conversation, onPress }: Props) {
  const { colors } = useAppTheme();
  const s = useMemo(() => getStyles(colors), [colors]);

  // Wrap so the inner TouchableOpacity gets a stable arg signature without
  // letting the parent recreate a closure per item.
  const handlePress = useCallback(() => onPress(conversation), [onPress, conversation]);

  return (
    <TouchableOpacity style={s.conversationRow} onPress={handlePress}>
      <View style={s.conversationInfo}>
        <View style={s.conversationHeader}>
          <Text style={s.conversationName}>{conversation.name}</Text>
          <Text style={s.conversationTime}>{formatTime(conversation.lastTimestamp)}</Text>
        </View>
        <Text style={s.conversationPreview} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>
      {conversation.unreadCount > 0 && (
        <View style={s.unreadBadge}>
          <Text style={s.unreadText}>{conversation.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(ConversationItem);

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    conversationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    conversationInfo: { flex: 1 },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    conversationName: { fontSize: 14, fontWeight: '700', color: colors.text },
    conversationTime: { fontSize: 11, color: colors.muted },
    conversationPreview: { fontSize: 12, color: colors.muted },
    unreadBadge: {
      minWidth: 20,
      paddingHorizontal: 6,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  });
