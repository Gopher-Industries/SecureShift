import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE || 'false') === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"SecureShift" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your OTP Code for SecureShift Login',
    text: `Your One-Time Password (OTP) is: ${otp}\n\nThis code will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err);
    throw new Error('Failed to send OTP email');
  }
};

export const sendEmployerCredentials = async (email, tempPassword, contactPerson, companyName) => {
  const subject = 'Your SecureShift Employer Account Credentials';
  const greetingName = contactPerson || companyName || 'there';
  const text = `Hello ${greetingName},

An employer account has been created for you on SecureShift.

Email: ${email}
Temporary Password: ${tempPassword}

For security, please log in and change your password immediately.

Best regards,
SecureShift Team`;

  const mailOptions = {
    from: `"SecureShift" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Employer credentials email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send employer credentials email:', err);
    throw new Error('Failed to send employer credentials email');
  }
};