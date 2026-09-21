import { useCallback, useEffect, useRef, useState } from 'react';
import { getPendingGuards, getIncidents, getMessageStats } from '../service/adminAPI';

// AP-051 -- aggregates three existing endpoints into a single actionable-items
// feed for the notification bell. No dedicated backend endpoint exists yet
// (see ticket: "Optional future: GET /admin/notifications") -- this hook is
// the seam that call would replace later, without changing NotificationBell.

const POLL_INTERVAL_MS = 60000; // 60s -- deliberately not aggressive, per ticket's "should not hammer the API"

// Only count a guard as an actionable "pending verification" if their license
// is genuinely pending review -- not verified/rejected, and not expired
// (an expired license is surfaced separately, not as something to review).
function licenseOf(guard) {
  const docs = Array.isArray(guard.documents) ? guard.documents : [];
  const lic = docs.find((d) => d.type === 'license') || null;
  if (!lic) return null;
  if (lic.status !== 'pending' || lic.expired) return null;
  return lic;
}

export default function useNotificationFeed() {
  const [feed, setFeed] = useState({
    verifications: [],
    incidents: [],
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [guardsData, submittedData, inReviewData, messageStats] = await Promise.all([
        getPendingGuards({ status: 'pending' }),
        getIncidents({ status: 'SUBMITTED' }),
        getIncidents({ status: 'IN_REVIEW' }),
        getMessageStats(),
      ]);

      const guardsList = Array.isArray(guardsData)
        ? guardsData
        : guardsData.guards || guardsData.data || [];
      const verifications = guardsList.filter((g) => licenseOf(g));

      const submitted = Array.isArray(submittedData)
        ? submittedData
        : submittedData.data || submittedData.incidents || [];
      const inReview = Array.isArray(inReviewData)
        ? inReviewData
        : inReviewData.data || inReviewData.incidents || [];
      const incidents = [...submitted, ...inReview];

      setFeed({
        verifications,
        incidents,
        unreadMessages: messageStats?.unreadMessages ?? 0,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    function startPolling() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(load, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        load();
        startPolling();
      }
    }

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load]);

  const totalCount = feed.verifications.length + feed.incidents.length + feed.unreadMessages;

  return { feed, totalCount, loading, error, refresh: load };
}
