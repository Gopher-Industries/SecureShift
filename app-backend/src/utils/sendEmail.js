import nodemailer from 'nodemailer';

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  // ── Dev mode: print OTP directly to terminal, skip SMTP ──────────────────
  if (!EMAIL_ENABLED) {
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│  📬 OTP for ${email.padEnd(28)}│`);
    console.log(`│  🔑 Code : ${String(otp).padEnd(30)}│`);
    console.log('│  ⏰ Expires in 5 minutes                │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    return;
  }

  // ── Production: send via SMTP ─────────────────────────────────────────────
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
    console.error('❌ Failed to send OTP email:', err.message);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Notify a guard that their payroll has been APPROVED.
 * In dev mode (EMAIL_ENABLED=false) prints to terminal.
 */
export const sendPayrollApproved = async (email, guardName, grossPay, periodType, startDate, endDate) => {
  if (!EMAIL_ENABLED) {
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│  💰 Payroll APPROVED for ${guardName.substring(0, 15).padEnd(15)} │`);
    console.log(`│  Period : ${String(periodType).padEnd(30)}│`);
    console.log(`│  From   : ${String(startDate).padEnd(30)}│`);
    console.log(`│  To     : ${String(endDate).padEnd(30)}│`);
    console.log(`│  Gross  : $${String(grossPay.toFixed(2)).padEnd(29)}│`);
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    return;
  }

  const mailOptions = {
    from: `"SecureShift" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your SecureShift Payroll Has Been Approved',
    text: `Hi ${guardName},\n\nYour payroll for the period ${startDate} to ${endDate} has been approved.\n\nGross Pay: $${grossPay.toFixed(2)}\n\nIt will be processed shortly.\n\nBest regards,\nSecureShift Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Payroll approval email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send payroll approval email:', err.message);
  }
};

/**
 * Notify a guard that their payroll has been PROCESSED (payment on the way).
 * In dev mode (EMAIL_ENABLED=false) prints to terminal.
 */
export const sendPayrollProcessed = async (email, guardName, grossPay, periodType, startDate, endDate) => {
  if (!EMAIL_ENABLED) {
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│  ✅ Payroll PROCESSED for ${guardName.substring(0, 14).padEnd(14)} │`);
    console.log(`│  Period : ${String(periodType).padEnd(30)}│`);
    console.log(`│  From   : ${String(startDate).padEnd(30)}│`);
    console.log(`│  To     : ${String(endDate).padEnd(30)}│`);
    console.log(`│  Gross  : $${String(grossPay.toFixed(2)).padEnd(29)}│`);
    console.log('│  Payment is on its way!                 │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    return;
  }

  const mailOptions = {
    from: `"SecureShift" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your SecureShift Payroll Has Been Processed',
    text: `Hi ${guardName},\n\nGreat news! Your payroll for the period ${startDate} to ${endDate} has been processed.\n\nGross Pay: $${grossPay.toFixed(2)}\n\nPayment is on its way.\n\nBest regards,\nSecureShift Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Payroll processed email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send payroll processed email:', err.message);
  }
};

export const sendEmployerCredentials = async (email, tempPassword, contactPerson, companyName) => {
  // ── Dev mode: print credentials to terminal ───────────────────────────────
  if (!EMAIL_ENABLED) {
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│  📬 Employer credentials for ${email.substring(0, 12).padEnd(12)}│`);
    console.log(`│  🔑 Temp Password : ${String(tempPassword).padEnd(21)}│`);
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    return;
  }

  // ── Production: send via SMTP ─────────────────────────────────────────────
  const greetingName = contactPerson || companyName || 'there';
  const mailOptions = {
    from: `"SecureShift" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your SecureShift Employer Account Credentials',
    text: `Hello ${greetingName},\n\nAn employer account has been created for you on SecureShift.\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nFor security, please log in and change your password immediately.\n\nBest regards,\nSecureShift Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Employer credentials email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send employer credentials email:', err.message);
    throw new Error('Failed to send employer credentials email');
  }
};
