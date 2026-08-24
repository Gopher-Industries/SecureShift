import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ManageShiftDetails.css';

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

        const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
      if (!shift) return; // wait for shift to load

      const guardId =
        shift.acceptedBy?._id ||
        shift.acceptedBy ||
        shift.assignedGuard?._id ||
        shift.assignedGuard;

      if (!guardId || guardId === 'null') {
        console.log('no guard assigned yet, skipping message fetch');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/v1/messages/conversation/${guardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.data?.conversation?.messages || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };

    fetchMessages();
  }, [shift]); // ← shift, not id

  // ======================
  // Approve guard
  // ======================
  const approveGuard = async (guardId) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guardId }),
      });

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

    const guardId =
      shift?.acceptedBy?._id ||
      shift?.acceptedBy ||
      shift?.assignedGuard?._id ||
      shift?.assignedGuard;

    if (!guardId || guardId === 'null') {
      alert('No guard assigned to this shift yet.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: guardId,
          content: newMessage,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          _id: data.data?.messageId,
          content: data.data?.content || newMessage,
          senderName: 'You',
          timestamp: data.data?.timestamp || new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  if (loading) return <p>Loading shift…</p>;
  if (error) return <p className="msd-error">{error}</p>;

  return (
    <div className="msd-container">
      <button onClick={() => navigate(-1)} className="msd-back-button">
        ← Back
      </button>

      <h1 className="msd-title">{shift.title}</h1>
      <p className="msd-status">
        <strong>Status:</strong> {shift.status}
      </p>

      <hr className="msd-divider" />

      {/* ================= Applicants ================= */}
      <h2 className="msd-section-heading">Applicants</h2>

      {shift.applicants && shift.applicants.length === 0 && (
        <p className="msd-empty-text">No applicants yet.</p>
      )}

      {shift.applicants &&
        shift.applicants.map((applicant) => (
          <div key={applicant._id} className="msd-applicant-card">
            <div>
              <p className="msd-applicant-name">{applicant.name}</p>
              <p className="msd-applicant-email">{applicant.email}</p>
            </div>

            <button className="msd-approve-button" onClick={() => approveGuard(applicant._id)}>
              Approve
            </button>
          </div>
        ))}

      <hr className="msd-divider" />

      {/* ================= Shift Chat ================= */}
      <h2 className="msd-section-heading">Shift Chat</h2>

      <div className="msd-chat-box">
        {messages.length === 0 && <p className="msd-empty-text">No messages yet.</p>}

        {messages.map((msg) => (
          <div key={msg._id} className="msd-message">
            <strong className="msd-message-sender">{msg.senderName || 'User'}:</strong>
            <p className="msd-message-content">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="msd-input-row">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="msd-input"
        />
        <button className="msd-send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ManageShiftDetails;
