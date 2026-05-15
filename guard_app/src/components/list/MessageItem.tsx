// component/list/MessageItem.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../theme';

import type { AppColors } from '../../theme/colors';

export type MessageItemData = {
  id: string;
  from: 'guard' | 'employer';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isMe: boolean;
};

type Props = {
  message: MessageItemData;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageItem({ message }: Props) {
  const { colors } = useAppTheme();
  // Memoize so the stylesheet identity is stable across parent re-renders
  // when the theme hasn't changed.
  const s = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={[s.messageRow, message.isMe ? s.rowRight : s.rowLeft]}>
      <View style={[s.bubble, message.isMe ? s.bubbleGuard : s.bubbleEmployer]}>
        <Text style={s.msgSender}>
          {message.senderName} • {message.from === 'guard' ? 'Guard' : 'Employer'}
        </Text>
        <Text style={message.isMe ? s.msgTextLight : s.msgTextDark}>{message.text}</Text>
        <View style={s.metaRow}>
          <Text style={message.isMe ? s.msgTimeLight : s.msgTimeDark}>
            {formatTime(message.timestamp)}
          </Text>
          {message.isMe && message.status && <Text style={s.msgStatus}>• {message.status}</Text>}
        </View>
      </View>
    </View>
  );
}

export default React.memo(MessageItem);

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    messageRow: {
      marginBottom: 10,
      flexDirection: 'row',
    },
    rowRight: {
      justifyContent: 'flex-end',
    },
    rowLeft: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '75%',
      padding: 12,
      borderRadius: 16,
    },
    bubbleGuard: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderTopRightRadius: 4,
    },
    bubbleEmployer: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    msgSender: { fontSize: 11, color: colors.muted, marginBottom: 4, fontWeight: '600' },
    msgTextLight: { color: colors.white, fontSize: 15 },
    msgTextDark: { color: colors.text, fontSize: 15 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    msgTimeLight: { fontSize: 10, color: '#d1d5db' },
    msgTimeDark: { fontSize: 10, color: colors.muted },
    msgStatus: { marginLeft: 4, fontSize: 10, color: '#c7d2fe' },
  });
