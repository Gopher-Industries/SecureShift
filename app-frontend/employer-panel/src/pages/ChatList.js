import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await fetch(
          'http://localhost:5000/api/v1/chats',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to load chats');

        const data = await res.json();
        setChats(data.chats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (loading) return <p>Loading chats…</p>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Chats</h1>

      {chats.length === 0 && <p>No chats available.</p>}

      {chats.map((chat) => (
        <div
          key={chat.shiftId}
          onClick={() => navigate(`/manage-shift/${chat.shiftId}`)}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '12px',
            cursor: 'pointer',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            {chat.shiftTitle}
          </p>
          <p style={{ margin: '4px 0', color: '#666' }}>
            {chat.lastMessage || 'No messages yet'}
          </p>
          <small style={{ color: '#999' }}>
            {chat.updatedAt
              ? new Date(chat.updatedAt).toLocaleString()
              : ''}
          </small>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
