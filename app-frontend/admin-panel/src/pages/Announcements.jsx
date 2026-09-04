import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField from '../components/FormField';
import colors from '../theme/colors';

const STORAGE_KEY = 'broadcastAnnouncementHistory';

const AUDIENCES = [
  { value: 'all', label: 'All Guards' },
  { value: 'active', label: 'Active Guards Only' },
  { value: 'pending_verification', label: 'Pending Verification' },
];

export default function Announcements() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [history, setHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // ignore malformed stored value
      }
    }
  }, []);

  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label || audience;

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!title.trim() || !body.trim()) {
      setFeedback('Please fill in both a title and a message body.');
      return;
    }
    // Guard against accidental mass sends — always confirm before "sending"
    setShowConfirm(true);
  };

  const handleConfirmedSend = () => {
    setSending(true);
    // Mock send — no backend endpoint yet (AP-043 scope). Simulated delay
    // so the flow reads the same way a real send would.
    setTimeout(() => {
      const entry = {
        id: Date.now(),
        title: title.trim(),
        body: body.trim(),
        audience,
        audienceLabel,
        sentAt: new Date().toISOString(),
      };
      const updated = [entry, ...history];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setTitle('');
      setBody('');
      setShowConfirm(false);
      setSending(false);
      setFeedback(`Announcement sent to ${entry.audienceLabel} (mock — not yet delivered).`);
    }, 400);
  };

  return (
    <div>
      <h1>Announcements</h1>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Compose Announcement</h3>
        <p style={{ color: colors.muted, fontSize: 13 }}>
          This is a mock send — no backend broadcast endpoint is wired up yet, so guards will not
          actually receive this.It&apos;s recorded in the history below for now.
        </p>

        <form onSubmit={handleComposeSubmit}>
          <FormField
            id="announcement-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance this weekend"
            required
          />
          <FormField
            id="announcement-body"
            label="Message"
            as="textarea"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the announcement content…"
            required
          />
          <FormField
            id="announcement-audience"
            label="Audience"
            as="select"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            hint={`This will be sent to: ${audienceLabel}`}
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </FormField>

          <Button type="submit">Send Announcement</Button>
        </form>

        {feedback && <p style={{ fontSize: 13, color: colors.muted, marginTop: 12 }}>{feedback}</p>}
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Send History</h3>
        {history.length === 0 ? (
          <p style={{ color: colors.muted, fontSize: 13 }}>No announcements sent yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <strong>{entry.title}</strong>
                  <span style={{ fontSize: 12, color: colors.muted }}>
                    {new Date(entry.sentAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: '6px 0', fontSize: 14 }}>{entry.body}</p>
                <span
                  style={{
                    fontSize: 12,
                    color: colors.primary,
                    background: colors.bg,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  Audience: {entry.audienceLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm before send — prevents accidental mass sends */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <Card style={{ maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Confirm Announcement</h3>
            <p style={{ fontSize: 14 }}>
              You&apos;re about to send <strong>&quot;{title}&quot;</strong> to This cannot be
              easily undone once a real send endpoint is wired up.
            </p>
            <p style={{ fontSize: 14 }}>Are you sure?</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button onClick={handleConfirmedSend} disabled={sending}>
                {sending ? 'Sending…' : `Yes, send to ${audienceLabel}`}
              </Button>
              <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={sending}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
