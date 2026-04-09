import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from '../components/NotificationIcon.svg';
import http from '../lib/http';

const POLL_INTERVAL_MS = 30_000;

export default function NotificationsPopup() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  // Tracks applicant IDs we've already seen per shift,
  // so we only notify on genuinely new applications
  const prevApplicantsRef = useRef({});

  // ------------------------------------------------------------------
  // Polling — diffs current applicants against what we last saw
  // ------------------------------------------------------------------
  const fetchAndDiffShifts = async () => {
    try {
      const response = await http.get('/shifts?withApplicantsOnly=true');
      const shifts = (response.data.items || []).filter(
        (s) => s.status === 'open' || s.status === 'applied'
      );

      const newNotifications = [];

      shifts.forEach((shift) => {
        const applicants = shift.applicants || [];
        const prevIds = prevApplicantsRef.current[shift._id] || [];

        applicants
          .filter((a) => !prevIds.includes(a._id))
          .forEach((applicant) => {
            newNotifications.push({
              id: `${shift._id}-${applicant._id}`,
              shiftId: shift._id,
              shiftTitle: shift.title,
              shiftDate: shift.date,
              shiftStartTime: shift.startTime,
              shiftEndTime: shift.endTime,
              guardName: applicant.name,
              isRead: false,
              receivedAt: new Date().toISOString(),
            });
          });

        prevApplicantsRef.current[shift._id] = applicants.map((a) => a._id);
      });

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev]);
      }
    } catch (err) {
      console.error('NotificationsPopup: failed to fetch shifts', err);
    }
  };

  useEffect(() => {
    fetchAndDiffShifts();
    const interval = setInterval(fetchAndDiffShifts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

  const handleBellClick = () => {
    setShowPopup((prev) => !prev);
    // Mark as read when user opens the panel
    if (!showPopup && unreadCount > 0) markAllAsRead();
  };

  const handleNotificationClick = () => {
    navigate('/manage-shift');
    setShowPopup(false);
  };

  // ------------------------------------------------------------------
  // Styles (inline to preserve positioning behaviour with parent header)
  // ------------------------------------------------------------------
  const popupStyle = {
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
  };

  const notificationItemStyle = (isRead) => ({
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: isRead ? 'white' : '#eef2ff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  });

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div ref={popupRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div
        onClick={handleBellClick}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <img src={NotificationIcon} alt="Notifications" style={{ height: '42px' }} />

        {unreadCount > 0 && (
          <div
            style={{
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
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>

      {showPopup && (
        <div style={popupStyle}>
          <div
            style={{
              padding: '14px 16px',
              fontWeight: '700',
              fontSize: '16px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                style={{ fontSize: '12px', color: '#274B93', cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
              No new applications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={notificationItemStyle(n.isRead)}
                onClick={handleNotificationClick}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                  New application — {n.shiftTitle}
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>👤 {n.guardName}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>
                  📅{' '}
                  {new Date(n.shiftDate).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>
                  🕐 {n.shiftStartTime} – {n.shiftEndTime}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
