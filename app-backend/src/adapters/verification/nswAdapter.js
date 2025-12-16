// src/adapters/verification/nswAdapter.js
import axios from 'axios';
import crypto from 'crypto';

const tokenUrl = process.env.NSW_TOKEN_URL;
const clientId = process.env.NSW_API_KEY;
const clientSecret = process.env.NSW_API_SECRET;
const verifyUrl = process.env.NSW_VERIFY_URL; // check your exact endpoint in NSW docs

async function getOAuthToken() {
  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error('NSW API credentials missing');
  }
  // This is a generic OAuth client credentials flow.
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const res = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: { username: clientId, password: clientSecret },
    timeout: 10000
  });
  return res.data.access_token;
}

export async function verifyNSW({ firstName, lastName, dob, licenceNumber }) {
  try {
    const token = await getOAuthToken();
    // Make verify call - payload shape may vary; check NSW docs and adapt
    const res = await axios.post(verifyUrl, {
      givenName: firstName,
      familyName: lastName,
      dob,
      licenceNumber
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000
    });

    const raw = res.data;
    const hash = crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex');

    // parse result (adjust to actual NSW response fields)
    const status = (raw && raw.licenceStatus) ? (raw.licenceStatus === 'valid' ? 'verified' : 'failed') : 'failed';
    const expiryDate = raw.expiryDate ? new Date(raw.expiryDate) : null;
    const authority = 'NSW';

    return { ok: true, status, expiryDate, authority, raw, responseHash: hash };
  } catch (err) {
    console.error('NSW verify error', err.message);
    return { ok: false, error: err.message };
  }
}
