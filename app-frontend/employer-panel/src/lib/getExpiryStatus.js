export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'unknown';

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'valid';
};
