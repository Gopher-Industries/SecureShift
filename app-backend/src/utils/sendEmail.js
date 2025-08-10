import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
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
