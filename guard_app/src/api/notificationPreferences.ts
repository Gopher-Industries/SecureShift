import http from '../lib/http';

import type { NotificationPreferences } from '../lib/notificationPreferences';

// Backend follow-up: the endpoint below doesn't exist yet. Until it
// lands, preferences are client-only and pushes the OS shows while the app is
// backgrounded still arrive. Once the backend stores these on the User and
// filters in its push sender, flip this on - no other client change is needed.
//
//   PUT /users/notification-preferences
//   body: { shiftAssignments: boolean, shiftUpdates: boolean, messages: boolean, incidents: boolean }
export const NOTIFICATION_PREFS_SERVER_SYNC_ENABLED = false;

export async function updateNotificationPreferences(prefs: NotificationPreferences) {
  const { data } = await http.put('/users/notification-preferences', prefs);
  return data;
}

/** Best-effort push of the local preferences to the backend; never throws. */
export async function syncNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  if (!NOTIFICATION_PREFS_SERVER_SYNC_ENABLED) return;
  try {
    await updateNotificationPreferences(prefs);
  } catch (error) {
    console.warn('Failed to sync notification preferences', error);
  }
}
