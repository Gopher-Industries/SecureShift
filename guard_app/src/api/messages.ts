import http from '../lib/http';

export type MessageUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: 'guard' | 'employer' | 'admin';
};

export type MessageDto = {
  _id?: string;
  sender: MessageUser;
  receiver: MessageUser;
  content: string;
  timestamp: string;
  isRead: boolean;
};

type InboxResponse = {
  data?: {
    messages?: MessageDto[];
  };
  messages?: MessageDto[];
};

type SentResponse = {
  data?: {
    messages?: MessageDto[];
  };
  messages?: MessageDto[];
};

type ConversationResponse = {
  data?: {
    conversation?: {
      participant?: {
        id?: string;
        _id?: string;
        name?: string;
        email?: string;
        role?: 'guard' | 'employer' | 'admin';
      };
      messages?: MessageDto[];
    };
  };
};

type SendMessageResponse = {
  data?: {
    messageId?: string;
    sender?: MessageUser;
    receiver?: MessageUser;
    content?: string;
    timestamp?: string;
    isRead?: boolean;
  };
};

export async function getInboxMessages() {
  const { data } = await http.get<InboxResponse>('/messages/inbox');
  return data?.data?.messages ?? data?.messages ?? [];
}

export async function getSentMessages() {
  const { data } = await http.get<SentResponse>('/messages/sent');
  return data?.data?.messages ?? data?.messages ?? [];
}

export async function getConversation(userId: string) {
  const { data } = await http.get<ConversationResponse>(`/messages/conversation/${userId}`);
  return data?.data?.conversation ?? { participant: undefined, messages: [] };
}

export async function sendMessage(payload: { receiverId: string; content: string }) {
  const { data } = await http.post<SendMessageResponse>('/messages', payload);
  return data?.data ?? {};
}

export async function markMessageAsRead(messageId: string) {
  const { data } = await http.patch(`/messages/${messageId}/read`);
  return data;
}
