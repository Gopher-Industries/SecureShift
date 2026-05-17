import http from '../lib/http';

// Types

export type NotificationType = string;

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title?: string;
  message: string;
  data?: Record<string, unknown>;
}

// API Calls

/**
 * Get unread notification count
 * GET /notifications/unread-count
 */
export async function getUnreadCount() {
  const { data } = await http.get('/notifications/unread-count');
  return data;
}

/**
 * Mark all notifications as read
 * PATCH /notifications/read-all
 */
export async function markAllAsRead() {
  const { data } = await http.patch('/notifications/read-all');
  return data;
}

/**
 * Get user notifications (paginated)
 * GET /notifications
 */
export async function getNotifications(params?: GetNotificationsParams) {
  const { data } = await http.get('/notifications', { params });
  return data;
}

/**
 * Create a notification
 * POST /notifications
 */
export async function createNotification(payload: CreateNotificationPayload) {
  const { data } = await http.post('/notifications', payload);
  return data;
}

/**
 * Get single notification by ID
 * GET /notifications/:id
 */
export async function getNotificationById(id: string) {
  const { data } = await http.get(`/notifications/${id}`);
  return data;
}

/**
 * Mark notification as read
 * PATCH /notifications/:id/read
 */
export async function markAsRead(id: string) {
  const { data } = await http.patch(`/notifications/${id}/read`);
  return data;
}
