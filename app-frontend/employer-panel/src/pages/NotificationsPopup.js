import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from '../components/NotificationIcon.svg';
import http from '../lib/http';

const POLL_INTERVAL_MS = 15_000;

export default function NotificationsPopup() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  // keyed by shiftId, tracks which applicant IDs we've already notified about
  const seenApplicants = useRef({});

  const loadNotifications = async () => {
    try {
      const res = await http.get('/notifications');
      const data = res.data.notifications || [];
      setNotifications(data);
      return data;
    } catch (err) {
      console.error('Failed to load notifications:', err);
      return [];
    }
  };

  // Seed seenApplicants from whatever's already in the DB so we don't
  // re-create notifications on every page load
  const seedSeen = (existing) => {
    for (const n of existing) {
      const { shiftId, applicantId } = n.data || {};
      if (!shiftId || !applicantId) continue;
      const key = String(shiftId);
      if (!seenApplicants.current[key]) seenApplicants.current[key] = [];
      const id = String(applicantId);
      if (!seenApplicants.current[key].includes(id)) {
        seenApplicants.current[key].push(id);
      }
    }
  };

  const pollShifts = async () => {
    try {
      const res = await http.get('/shifts?withApplicantsOnly=true');
      const shifts = (res.data.items || []).filter(s =>
        ['open', 'applied', 'assigned'].includes(s.status)
      );

      for (const shift of shifts) {
        const applicants = shift.applicants || [];
        const seen = seenApplicants.current[shift._id] || [];
        const newOnes = applicants.filter(a => !seen.includes(String(a._id)));

        for (const applicant of newOnes) {
          try {
            const date = new Date(shift.date).toLocaleDateString('en-AU', {
              weekday: 'short', day: 'numeric', month: 'short',
            });
            await http.post('/notifications', {
              userId: shift.createdBy._id || shift.createdBy,
              type: 'SHIFT_APPLIED',
              title: `New application — ${shift.title}`,
              message: `${applicant.name} has applied for your shift on ${date} (${shift.startTime} – ${shift.endTime})`,
              data: { shiftId: shift._id, applicantId: applicant._id },
            });
          } catch (err) {
            console.error('Failed to save notification:', err);
          }
        }

        // Update seen list regardless of whether the POST succeeded
        seenApplicants.current[shift._id] = applicants.map(a => String(a._id));
      }

      await loadNotifications();
    } catch (err) {
      console.error('Failed to poll shifts:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const existing = await loadNotifications();
      seedSeen(existing);
      await pollShifts();
    };
    init();
    const interval = setInterval(pollShifts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      try {
        await http.patch(`/notifications/${n._id}/read`);
        setNotifications(prev =>
          prev.map(item => item._id === n._id ? { ...item, isRead: true } : item)
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    navigate('/manage-shift');
    setOpen(false);
  };

  const unread = notifications.filter(n => !n.isRead);

  return (
    <div ref={popupRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div onClick={() => setOpen(prev => !prev)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <img src={NotificationIcon} alt="Notifications" style={{ height: '42px' }} />
        {unread.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unread.length > 99 ? '99+' : unread.length}
          </div>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '55px',
          right: '0px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          color: '#333',
        }}>
          <div style={{ padding: '14px 16px', fontWeight: '700', fontSize: '16px', borderBottom: '1px solid #e0e0e0' }}>
            Notifications
          </div>

          {unread.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
              No new notifications
            </div>
          ) : (
            unread.map(n => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#eef2ff',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>{n.message}</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                  {new Date(n.createdAt).toLocaleDateString('en-AU', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
