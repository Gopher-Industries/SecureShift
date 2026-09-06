import AsyncStorage from '@react-native-async-storage/async-storage';

export type HandoverNote = {
  id: string;
  shiftId: string;
  siteKey: string;
  text: string;
  author: string;
  createdAt: string;
};

const STORAGE_KEY = 'handover_notes';

export async function getHandoverNotes(): Promise<HandoverNote[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as HandoverNote[];
  } catch {
    return [];
  }
}

export async function saveHandoverNote(note: HandoverNote): Promise<void> {
  const notes = await getHandoverNotes();

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...notes]));
}

export async function getHandoverNotesForSite(siteKey: string): Promise<HandoverNote[]> {
  const notes = await getHandoverNotes();

  return notes.filter((note) => note.siteKey === siteKey);
}
