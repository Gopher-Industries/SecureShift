const defaultTemplates = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    subject: 'Welcome to {{ companyName }}',
    body: `Hi {{ userName }},

Welcome to {{ companyName }}.

Your account has been created successfully.

Email: {{ email }}

Regards,
{{ companyName }} Team`,
  },
  {
    id: 'shift-assigned',
    name: 'Shift Assigned',
    subject: 'New Shift Assigned - {{ shiftDate }}',
    body: `Hi {{ userName }},

You have been assigned a new shift.

Date: {{ shiftDate }}
Time: {{ shiftTime }}

Please check your account for more details.

Regards,
{{ companyName }} Team`,
  },
  {
    id: 'shift-reminder',
    name: 'Shift Reminder',
    subject: 'Shift Reminder - {{ shiftDate }}',
    body: `Hi {{ userName }},

This is a reminder about your upcoming shift.

Date: {{ shiftDate }}
Time: {{ shiftTime }}

Regards,
{{ companyName }} Team`,
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body: `Hi {{ userName }},

We received a request to reset your password.

Please follow the password reset instructions to continue.

If you did not request this, please contact {{ companyName }} support.

Regards,
{{ companyName }} Team`,
  },
];

export const getMockEmailTemplates = () => {
  const savedTemplates = localStorage.getItem('emailTemplates');

  if (!savedTemplates) {
    return Promise.resolve(defaultTemplates);
  }

  try {
    const templates = JSON.parse(savedTemplates);

    if (!Array.isArray(templates)) {
      return Promise.resolve(defaultTemplates);
    }

    return Promise.resolve(templates);
  } catch (error) {
    return Promise.resolve(defaultTemplates);
  }
};

export const updateMockEmailTemplates = (templates) => {
  localStorage.setItem('emailTemplates', JSON.stringify(templates));

  return Promise.resolve(templates);
};
