// Types, constants and pure helpers for incident reporting.
// Extracted from IncidentReportScreen.tsx (GA-021) unchanged.

export type Severity = 'Low' | 'Medium' | 'High';

export type Shift = {
  _id: string;
  title: string;
  date: string;
  status?: string;
};

export type Attachment = {
  _id: string;
  originalName?: string;
  mimeType?: string;
  mediaType?: string;
};

export type Incident = {
  _id: string;
  description: string;
  severity: string;
  status?: string;
  createdAt?: string;
  attachments?: Attachment[];
};

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export type ApiResponse = Incident[] | { incidents?: Incident[]; data?: Incident[] };

// myshifts is paginated now, so the list comes back inside items
export type ShiftsResponse = Shift[] | { items?: Shift[] };

export type ErrorState = {
  title: string;
  message: string;
} | null;

// same list the backend accepts, otherwise the upload comes back as a 400
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// works with a mime type or with the mediaType the server sends back
export function fileIcon(type?: string) {
  if (!type) return '📎';
  if (type.startsWith('image')) return '🖼️';
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('audio')) return '🎵';
  if (type.includes('pdf')) return '📄';
  return '📎';
}

export const getNowDateTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
