export function formatAttendanceTime(value?: string) {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
