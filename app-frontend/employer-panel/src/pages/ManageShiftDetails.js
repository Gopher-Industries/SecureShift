import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ManageShiftDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    const [applicantAction, setApplicantAction] = useState({}); // { [guardId]: 'approving'|'rejecting'|'approved'|'rejected' }
    const [actionFeedback, setActionFeedback] = useState('');
    const chatEndRef = useRef(null);

    // Fetch shift
    useEffect(() => {
        const fetchShift = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No auth token found');
                const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
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

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                setMessages(data.messages || []);
            } catch (err) {
                console.error('Failed to load messages', err);
            }
        };
        fetchMessages();
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Approve guard
    const approveGuard = async (guardId) => {
        setApplicantAction((prev) => ({ ...prev, [guardId]: 'approving' }));
        setActionFeedback('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ guardId }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            // Update local shift state
            setShift((prev) => ({
                ...prev,
                status: 'inprogress',
                assignedGuard: data.shift?.assignedGuard || guardId,
                ...(data.shift || {}),
            }));
            setApplicantAction((prev) => ({ ...prev, [guardId]: 'approved' }));
            setActionFeedback('Guard approved! The shift is now In Progress and the guard has been notified.');
        } catch (err) {
            console.error(err);
            setActionFeedback('Failed to approve guard. Please try again.');
            setApplicantAction((prev) => ({ ...prev, [guardId]: undefined }));
        }
    };

    // Complete shift
    const completeShift = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}/complete`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setShift((prev) => ({ ...prev, status: 'completed', ...(data.shift || {}) }));
            setActionFeedback('Shift has been marked as Completed.');
        } catch (err) {
            console.error(err);
            setActionFeedback('Failed to complete shift.');
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        setSendingMsg(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/v1/shifts/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: newMessage }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            const savedMessage = await res.json();
            setMessages((prev) => [...prev, savedMessage]);
            setNewMessage('');
        } catch (err) {
            console.error(err);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatStatus = (s) => {
        const map = { inprogress: 'In Progress', completed: 'Completed', pending: 'Pending', open: 'Open' };
        return map[s?.toLowerCase()] || s || 'Open';
    };

    const getStatusStyle = (s) => {
        const label = formatStatus(s);
        return {
            display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            color: label === "Completed" ? "#2E7D32" : label === "In Progress" ? "#7B1FA2" : label === "Pending" ? "#F57C00" : "#1565C0",
            backgroundColor: label === "Completed" ? "#EAFAE7" : label === "In Progress" ? "#F6EFFF" : label === "Pending" ? "#FBFAE2" : "#E3F2FD",
        };
    };

    if (loading) return <div style={loadingStyle}><div style={spinnerStyle} /></div>;
    if (error) return <p style={{ color: 'red', padding: '40px' }}>{error}</p>;

    const applicants = shift?.applicants || [];
    const assignedGuardId = shift?.assignedGuard?._id || shift?.assignedGuard;

    return (
        <div style={pageStyle}>
            {/* ── Back + header ── */}
            <button style={backButtonStyle} onClick={() => navigate(-1)}>
                ← Back to Shifts
            </button>

            <div style={pageHeaderStyle}>
                <div>
                    <p style={overlineStyle}>Secure Shift · Shift Details</p>
                    <h1 style={pageTitleStyle}>{shift?.title || 'Untitled Shift'}</h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={getStatusStyle(shift?.status)}>{formatStatus(shift?.status)}</span>
                        {shift?.field && <span style={fieldBadgeStyle}>{shift.field}</span>}
                        {shift?.urgency && shift.urgency !== 'normal' && (
                            <span style={urgencyBadgeStyle(shift.urgency)}>{shift.urgency}</span>
                        )}
                    </div>
                </div>
            </div>

            <div style={twoColLayout}>
                {/* ── Left: Applicants ── */}
                <div style={leftColumn}>
                    <div style={sectionCard}>
                        <div style={sectionHeaderStyle}>
                            <h2 style={sectionTitleStyle}>Applicants</h2>
                            <span style={countBadgeStyle}>{applicants.length}</span>
                        </div>

                        {actionFeedback && (
                            <div style={actionFeedback.includes('Completed') || actionFeedback.includes('approved') ? successBannerStyle : infoBannerStyle}>
                                {actionFeedback}
                            </div>
                        )}

                        {assignedGuardId && shift?.status !== 'completed' && (
                            <div style={assignedBannerStyle}>
                                ✅ A guard has been assigned. Shift is now In Progress.
                            </div>
                        )}
                        {shift?.status === 'completed' && (
                            <div style={{ ...assignedBannerStyle, background: '#EAFAE7', borderColor: '#a7f3d0', color: '#065f46' }}>
                                🏁 This shift has been completed.
                            </div>
                        )}

                        {applicants.length === 0 ? (
                            <div style={emptyStyle}>
                                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                                <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>No applicants yet</p>
                                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Guards who apply will appear here for review.</p>
                            </div>
                        ) : (
                            <div style={applicantListStyle}>
                                {applicants.map((applicant) => {
                                    const gid = applicant._id || applicant.id;
                                    const action = applicantAction[gid];
                                    const isAssigned = assignedGuardId === gid || action === 'approved';
                                    const isCompleted = shift?.status === 'completed';

                                    return (
                                        <div key={gid} style={{
                                            ...applicantRowStyle,
                                            ...(isAssigned ? approvedRowStyle : {}),
                                        }}>
                                            <div style={avatarStyle}>
                                                {(applicant.name || applicant.email || 'G').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={guardNameStyle}>{applicant.name || 'Unknown Guard'}</p>
                                                <p style={guardEmailStyle}>{applicant.email || '--'}</p>
                                                {applicant.licenseType && (
                                                    <span style={licensePill}>{applicant.licenseType}</span>
                                                )}
                                            </div>
                                            <div style={rowActionsStyle}>
                                                {isAssigned ? (
                                                    <span style={approvedPill}>✓ Approved</span>
                                                ) : assignedGuardId || isCompleted ? (
                                                    <span style={filledPill}>Shift filled</span>
                                                ) : (
                                                    <button style={approveBtnStyle} onClick={() => approveGuard(gid)} disabled={action === 'approving'}>
                                                        {action === 'approving' ? 'Approving…' : 'Approve'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Complete shift button */}
                                {assignedGuardId && shift?.status !== 'completed' && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6b7280' }}>
                                            Once the shift is done, mark it as complete to finalise the booking.
                                        </p>
                                        <button style={completeBtnStyle} onClick={completeShift}>
                                            🏁 Mark Shift as Complete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Chat ── */}
                <div style={rightColumn}>
                    <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={sectionHeaderStyle}>
                            <h2 style={sectionTitleStyle}>Shift Chat</h2>
                        </div>

                        <div style={chatWindowStyle}>
                            {messages.length === 0 ? (
                                <div style={emptyChatStyle}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={msg._id || i} style={messageBubbleWrapStyle}>
                                        <span style={messageSenderStyle}>{msg.senderName || 'User'}</span>
                                        <div style={messageBubbleStyle}>{msg.content}</div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={chatInputRowStyle}>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message… (Enter to send)"
                                style={chatInputStyle}
                            />
                            <button onClick={sendMessage} disabled={sendingMsg || !newMessage.trim()} style={sendButtonStyle}>
                                {sendingMsg ? '…' : '→'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageShiftDetails;

// Styles 

const pageStyle = { padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Poppins, sans-serif' };
const loadingStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' };
const spinnerStyle = { width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#274b93', animation: 'spin 0.8s linear infinite' };
const backButtonStyle = { background: 'none', border: 'none', color: '#274b93', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '0 0 20px', display: 'block' };
const pageHeaderStyle = { marginBottom: '28px' };
const overlineStyle = { margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.4px' };
const pageTitleStyle = { margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: '#1d1f2e' };
const fieldBadgeStyle = { display: 'inline-block', padding: '3px 12px', borderRadius: '20px', background: '#EFF4FF', color: '#274b93', fontSize: '12px', fontWeight: 600 };
const urgencyBadgeStyle = (u) => ({ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: u === 'last-minute' ? '#FFF3E0' : '#FFF8E1', color: u === 'last-minute' ? '#E65100' : '#F57C00' });
const twoColLayout = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' };
const leftColumn = {};
const rightColumn = { minHeight: '500px' };
const sectionCard = { background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' };
const sectionTitleStyle = { margin: 0, fontSize: '17px', fontWeight: 700, color: '#1d1f2e' };
const countBadgeStyle = { background: '#EFF4FF', color: '#274b93', borderRadius: '10px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 };
const emptyStyle = { textAlign: 'center', padding: '32px 16px', color: '#9ca3af' };
const applicantListStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const applicantRowStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fafafa' };
const approvedRowStyle = { borderColor: '#bbf7d0', background: '#f0fdf4' };
const avatarStyle = { width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #274b93, #4a72d4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 };
const guardNameStyle = { margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const guardEmailStyle = { margin: 0, fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const licensePill = { display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '8px', background: '#EFF4FF', color: '#274b93', fontSize: '11px', fontWeight: 600 };
const rowActionsStyle = { display: 'flex', gap: '8px', flexShrink: 0 };
const approveBtnStyle = { padding: '7px 16px', borderRadius: '20px', border: 'none', background: '#274b93', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const completeBtnStyle = { width: '100%', padding: '11px', borderRadius: '12px', border: 'none', background: '#1d4a2e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const approvedPill = { padding: '6px 12px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: 600 };
const filledPill = { padding: '6px 12px', borderRadius: '20px', background: '#f3f4f6', color: '#9ca3af', fontSize: '12px', fontWeight: 500 };
const assignedBannerStyle = { padding: '10px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', fontWeight: 500, marginBottom: '12px' };
const successBannerStyle = { padding: '10px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', marginBottom: '12px' };
const infoBannerStyle = { padding: '10px 14px', borderRadius: '10px', background: '#fff3cd', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px', marginBottom: '12px' };
const chatWindowStyle = { flex: 1, minHeight: '300px', maxHeight: '360px', overflowY: 'auto', padding: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: '12px' };
const emptyChatStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#9ca3af', textAlign: 'center' };
const messageBubbleWrapStyle = { display: 'flex', flexDirection: 'column', gap: '2px' };
const messageSenderStyle = { fontSize: '11px', fontWeight: 600, color: '#9ca3af', paddingLeft: '2px' };
const messageBubbleStyle = { background: '#EFF4FF', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', fontSize: '14px', color: '#111827', maxWidth: '90%', wordBreak: 'break-word' };
const chatInputRowStyle = { display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' };
const chatInputStyle = { flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '14px', outline: 'none', fontFamily: 'Poppins, sans-serif' };
const sendButtonStyle = { padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#274b93', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer' };