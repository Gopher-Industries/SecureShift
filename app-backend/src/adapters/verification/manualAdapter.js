// src/adapters/verification/manualAdapter.js
import ManualVerification from '../../models/ManualVerification.js';

export async function createManualVerification({ guardId, jurisdiction, notes }) {
  const manual = new ManualVerification({
    guardId,
    jurisdiction,
    status: 'pending',
    history: [{ action: 'created', note: notes || 'manual fallback created' }]
  });
  await manual.save();
  return manual;
}
