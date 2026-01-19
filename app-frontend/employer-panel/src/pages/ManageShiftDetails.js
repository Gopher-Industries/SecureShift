import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ManageShiftDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // ======================
  // Fetch shift details
  // ======================
  useEffect(() => {
    const fetchShift = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');

        const res = await fetch(
          `http://localhost:5000/api/v1/shifts/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        setShift(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load shift details');
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [id]);

  // ======================
  // Fetch chat messages
  // ======================
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:5000/api/v1/shifts/${id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };

    fetchMessages();
  }, [id]);

  // ======================
  // Approve guard
  // ======================
  const approveGuard = async (guardId) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `http://localhost:5000/api/v1/shifts/${id}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ guardId }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      navigate('/manage-shift');
    } catch (err) {
      console.error(err);
      alert('Failed to approve applicant');
    }
  };

  // ======================
  // Send chat message
  // ======================
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `http://localhost:5000/api/v1/shifts/${id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (!res.ok) throw new Error('Failed to send message');

      const savedMessage = await res.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  if (loading) return <p>Loading shift…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Back
      </button>

      <h1>{shift.title}</h1>
      <p>
        <strong>Status:</strong> {shift.status}
      </p>

      <hr />

      {/* ================= Applicants ================= */}
      <h2>Applicants</h2>

      {shift.applicants && shift.applicants.length === 0 && (
        <p>No applicants yet.</p>
      )}

      {shift.applicants &&
        shift.applicants.map((applicant) => (
          <div
            key={applicant._id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {applicant.name}
              </p>
              <p style={{ margin: 0, color: '#666' }}>
                {applicant.email}
              </p>
            </div>

            <button onClick={() => approveGuard(applicant._id)}>
              Approve
            </button>
          </div>
        ))}

      <hr />

      {/* ================= Shift Chat ================= */}
      <h2>Shift Chat</h2>

      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && <p>No messages yet.</p>}

        {messages.map((msg) => (
          <div key={msg._id} style={{ marginBottom: '10px' }}>
            <strong>{msg.senderName || 'User'}:</strong>
            <p style={{ margin: '4px 0' }}>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ManageShiftDetails;
