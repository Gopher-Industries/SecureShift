export async function getExpoPushToken(): Promise<string | null> {
  return null;
}

export async function registerPushTokenIfNeeded(): Promise<void> {
  return;
}

export function subscribeToPushTokenChanges() {
  return {
    remove: () => {},
  };
}
