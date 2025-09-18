// src/controllers/verification.controller.js
import GuardVerification from '../models/GuardVerification.js';
import ManualVerification from '../models/ManualVerification.js';
import Guard from '../models/Guard.js';
import { encryptLicence, decryptLicence } from '../utils/crypto.js';
import { verifyNSW } from '../adapters/verification/nswAdapter.js';
import { createManualVerification } from '../adapters/verification/manualAdapter.js';

export const startVerification = async (req, res) => {
  try {
    const { guardId, jurisdiction, licenceNumber, firstName, lastName, dob } = req.body;
    if (!guardId || !jurisdiction || !licenceNumber) {
      return res.status(400).json({ message: 'guardId, jurisdiction and licenceNumber are required' });
    }

    // encrypt licence number
    const encryptedLicence = encryptLicence(licenceNumber);

    if (jurisdiction.toUpperCase() === 'NSW') {
      // Call NSW adapter
      const result = await verifyNSW({ firstName, lastName, dob, licenceNumber });

      if (!result.ok) {
        // save failed snapshot
        const gv = await GuardVerification.create({
          guardId, jurisdiction: 'NSW', licenceNumber: encryptedLicence,
          status: 'failed', source: 'nsw_api', notes: result.error, responseHash: result.responseHash || null
        });
        return res.status(200).json({ message: 'NSW verification attempted', verification: gv });
      }

      // success or failed based on adapter parsing
      const gv = await GuardVerification.create({
        guardId,
        jurisdiction: 'NSW',
        licenceNumber: encryptedLicence,
        status: result.status === 'verified' ? 'verified' : 'failed',
        authority: result.authority,
        expiryDate: result.expiryDate,
        verifiedAt: result.status === 'verified' ? new Date() : null,
        source: 'nsw_api',
        responseHash: result.responseHash,
        notes: result.raw ? JSON.stringify(result.raw).slice(0, 1000) : null
      });

      // If verified, update Guard.license status to verified (so app knows)
      if (result.status === 'verified') {
        const guard = await Guard.findById(guardId);
        if (guard) {
          guard.license.status = 'verified';
          guard.license.verifiedAt = new Date();
          guard.license.verifiedBy = null;
          await guard.save();
        }
      }

      return res.status(200).json({ message: 'NSW verification result saved', verification: gv });
    } else {
      // Create manual verification record
      const manual = await createManualVerification({ guardId, jurisdiction, notes: 'Created via API fallback' });
      const gv = await GuardVerification.create({
        guardId,
        jurisdiction,
        licenceNumber: encryptedLicence,
        status: 'manual_pending',
        source: 'manual',
        notes: `manualId:${manual._id}`
      });
      return res.status(201).json({ message: 'Manual verification created', manualId: manual._id, verification: gv });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const requester = req.user;
    const { guardId } = req.params;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    // allow guards to view their own verification or admins
    if (String(requester.id) !== String(guardId) && requester.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const latest = await GuardVerification.findOne({ guardId }).sort({ createdAt: -1 }).lean();
    if (!latest) return res.status(404).json({ message: 'No verification found for this guard' });

    // decrypt licence number before returning (optional)
    // const decryptedLicence = decryptLicence(latest.licenceNumber);

    // remove the encrypted value from response for safety; if you want to show masked value do so
    delete latest.licenceNumber;

    return res.status(200).json({ verification: latest });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const recheckVerification = async (req, res) => {
  try {
    const requester = req.user;
    const { guardId } = req.params;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    // Only admin or the guard themselves can recheck
    if (String(requester.id) !== String(guardId) && requester.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // find latest verification snapshot
    const latest = await GuardVerification.findOne({ guardId }).sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: 'No verification snapshot found' });

    if (latest.source === 'nsw_api') {
      // decrypt licence and call NSW again
      const { decryptLicence } = await import('../utils/licenceCrypto.js');
      const licenceNumber = decryptLicence(latest.licenceNumber);
      const result = await verifyNSW({ licenceNumber });

      if (!result.ok) {
        latest.status = 'failed';
        latest.notes = (latest.notes || '') + `;recheck_error:${result.error}`;
        await latest.save();
        return res.status(200).json({ message: 'NSW recheck attempted and failed', latest });
      }

      latest.status = result.status === 'verified' ? 'verified' : 'failed';
      latest.expiryDate = result.expiryDate || latest.expiryDate;
      latest.verifiedAt = result.status === 'verified' ? new Date() : latest.verifiedAt;
      latest.responseHash = result.responseHash || latest.responseHash;
      await latest.save();

      // if verified update guard
      if (result.status === 'verified') {
        const guard = await Guard.findById(guardId);
        if (guard) {
          guard.license.status = 'verified';
          guard.license.verifiedAt = new Date();
          await guard.save();
        }
      }

      return res.status(200).json({ message: 'NSW recheck completed', latest });
    } else {
      // manual -> mark manual verification in_review
      const manualIdNote = (latest.notes || '').match(/manualId:([0-9a-fA-F]{24})/);
      const manualId = manualIdNote ? manualIdNote[1] : null;
      if (!manualId) return res.status(400).json({ message: 'Manual verification id not found' });

      await ManualVerification.findByIdAndUpdate(manualId, { status: 'in_review' });
      return res.status(200).json({ message: 'Manual verification set to in_review', manualId });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
