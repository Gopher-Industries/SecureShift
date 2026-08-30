const defaultSettings = {
  platformName: 'SecureShift',
  supportEmail: 'support@secureshift.com',
  timezone: 'Australia/Melbourne',
  maintenanceMode: false,
};

export const getMockSettings = () => {
  const savedSettings = localStorage.getItem('generalSettings');

  if (savedSettings) {
    try {
      return Promise.resolve(JSON.parse(savedSettings));
    } catch (error) {
      return Promise.resolve(defaultSettings);
    }
  }

  return Promise.resolve(defaultSettings);
};

export const updateMockSettings = (settings) => {
  localStorage.setItem('generalSettings', JSON.stringify(settings));

  return Promise.resolve(settings);
};