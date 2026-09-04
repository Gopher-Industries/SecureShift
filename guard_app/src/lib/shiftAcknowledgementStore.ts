import AsyncStorage from '@react-native-async-storage/async-storage';

export type ShiftAcknowledgement = {
  id: string;
  shiftId: string;
  acknowledged: boolean;
  acknowledgedAt: string;
  instructionsSnapshot: string;
  signature?: string;
};

const STORAGE_KEY = 'shift_acknowledgements';

export async function getShiftAcknowledgements(): Promise<ShiftAcknowledgement[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ShiftAcknowledgement[];
  } catch {
    return [];
  }
}

export async function saveShiftAcknowledgement(
  acknowledgement: ShiftAcknowledgement,
): Promise<void> {
  const acknowledgements = await getShiftAcknowledgements();

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([acknowledgement, ...acknowledgements]));
}
