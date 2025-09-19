// src/utils/licenceCrypto.js
import crypto from 'crypto';

const KEY_B64 = process.env.LICENCE_ENC_KEY;
if (!KEY_B64) throw new Error('LICENCE_ENC_KEY missing in env');

const KEY = Buffer.from(KEY_B64, 'base64'); // 32 bytes expected
if (KEY.length !== 32) throw new Error('LICENCE_ENC_KEY must be 32 bytes (base64)');

export function encryptLicence(plainText) {
  const iv = crypto.randomBytes(16); // 16 bytes IV
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  // store iv and cipher together
  return `${iv.toString('base64')}:${encrypted}`;
}

export function decryptLicence(stored) {
  if (!stored) return null;
  const [ivB64, encrypted] = stored.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  let out = decipher.update(encrypted, 'base64', 'utf8');
  out += decipher.final('utf8');
  return out;
}
