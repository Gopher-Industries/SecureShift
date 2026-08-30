import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from '../components/NotificationIcon.svg';
import http from '../lib/http';
import translations from '../i18n/translations';
import './NotificationsPopup.css';

const POLL_INTERVAL_MS = 15_000;

export default function NotificationsPopup({ language }) {
  const t = translations[language || 'en'] || translations.en;
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
      const shifts = (res.data.items || []).filter((s) =>
        ['open', 'applied', 'assigned'].includes(s.status)
      );

      for (const shift of shifts) {
        const applicants = shift.applicants || [];
        const seen = seenApplicants.current[shift._id] || [];
        const newOnes = applicants.filter((a) => !seen.includes(String(a._id)));

        for (const applicant of newOnes) {
          try {
            const date = new Date(shift.date).toLocaleDateString('en-AU', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
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
        seenApplicants.current[shift._id] = applicants.map((a) => String(a._id));
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
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    navigate('/manage-shift');
    setOpen(false);
  };

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div ref={popupRef} className="np-container">
      <div onClick={() => setOpen((prev) => !prev)} className="np-trigger">
        <img src={NotificationIcon} alt="Notifications" className="np-icon" />
        {unread.length > 0 && (
          <div className="np-badge">{unread.length > 99 ? '99+' : unread.length}</div>
        )}
      </div>

      {open && (
        <div className="np-popup">
          <div className="np-header">{t.notifications}</div>

          {unread.length === 0 ? (
            <div className="np-empty">No new notifications</div>
          ) : (
            unread.map((n) => (
              <div key={n._id} onClick={() => handleNotificationClick(n)} className="np-item">
                <div className="np-item-title">{n.title}</div>
                <div className="np-item-message">{n.message}</div>
                <div className="np-item-date">
                  {new Date(n.createdAt).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
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
