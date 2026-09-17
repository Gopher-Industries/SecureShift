// Pure verification for a checkpoint scan: matches the scanned QR payload to a
// checkpoint AND confirms the guard is physically within its radius. No side
// effects, so it is easy to unit test.
import { checkWithinRadius, type LatLng } from './geo';

import type { Checkpoint } from '../api/patrol';

export type VerifyResult =
  | { ok: true; checkpoint: Checkpoint; distanceMeters: number }
  | { ok: false; reason: 'unknown-code' }
  | { ok: false; reason: 'already-done'; checkpoint: Checkpoint }
  | { ok: false; reason: 'too-far'; checkpoint: Checkpoint; distanceMeters: number };

// Normalise QR payloads so trivial differences (whitespace / case) don't fail a
// legitimate scan.
function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function verifyScan(
  scannedCode: string,
  checkpoints: Checkpoint[],
  current: LatLng,
  completedCheckpointIds: readonly string[] = [],
): VerifyResult {
  const target = checkpoints.find((cp) => normalizeCode(cp.code) === normalizeCode(scannedCode));

  if (!target) return { ok: false, reason: 'unknown-code' };

  if (completedCheckpointIds.includes(target.id)) {
    return { ok: false, reason: 'already-done', checkpoint: target };
  }

  const { within, distanceMeters } = checkWithinRadius(
    current,
    { latitude: target.latitude, longitude: target.longitude },
    target.radiusMeters,
  );

  if (!within) return { ok: false, reason: 'too-far', checkpoint: target, distanceMeters };

  return { ok: true, checkpoint: target, distanceMeters };
}
