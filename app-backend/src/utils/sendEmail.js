import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('⚠️  SMTP configuration is missing. Email sending will fail.');
  console.warn('   Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file');
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

const getOtpHtmlTemplate = ({ otp, name }) => {
  const displayName = name?.trim() ? name.trim().split(' ')[0] : 'there';
  const logoUrl =
    process.env.EMAIL_LOGO_URL ||
    'https://cdn.jsdelivr.net/gh/musahex/secureshift-branding@main/logo.png';
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@secureshift.app';
  const supportPhone = process.env.SUPPORT_PHONE || '+61 123 456 789';
  const address =
    process.env.COMPANY_ADDRESS || '1234 Collins St, Melbourne VIC 3000';
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Secure Shift OTP</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;color:#1f2a37;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:18px;box-shadow:0 25px 60px rgba(12,32,77,0.15);overflow:hidden;">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#0b1c3d 0%,#284b93 45%,#de0b3d 100%);padding:32px 24px;">
                <img src="${logoUrl}" alt="Secure Shift" width="110" height="110" style="display:block;border:0;margin-bottom:12px;" />
                <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">SECURE SHIFT</p>
                <p style="margin:8px 0 0;font-size:14px;color:#bad0ff;text-transform:uppercase;letter-spacing:3px;">One-Time Passcode</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#101828;">Hi ${displayName},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475467;">
                  Use the secure code below to complete your login to Secure Shift. This code expires in <strong>5 minutes</strong>.
                </p>
                <div style="text-align:center;margin-bottom:28px;">
                  <span style="display:inline-block;background:#0b1c3d;color:#ffffff;font-size:36px;font-weight:700;letter-spacing:8px;padding:18px 32px;border-radius:16px;">
                    ${otp}
                  </span>
                  <p style="margin:12px 0 0;font-size:13px;color:#98a2b3;">
                    Do not share this code with anyone, including Secure Shift staff.
                  </p>
                </div>
                <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:24px;">
                  <tr>
                    <td style="font-size:13px;color:#667085;padding:12px 16px;border:1px solid #e4e7ec;border-radius:12px;background:#f7f9ff;">
                      <strong style="color:#101828;">If you didn’t request this code</strong>, reset your password or contact support immediately.
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:14px;color:#475467;">Stay safe,<br/><strong>The Secure Shift Team</strong></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:#f8fafc;padding:20px 16px;">
                <p style="margin:0;font-size:12px;color:#98a2b3;">
                  © ${year} Secure Shift · ${address}<br/>
                  ${supportEmail} · ${supportPhone}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
};

let transporter = createTransporter();

export const sendOTP = async (email, otp, recipientName = '') => {
  transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) {
    throw new Error('SMTP_FROM_EMAIL is not configured. Please set it in your .env file or Email Settings UI');
  }

  const mailOptions = {
    from: `"Secure Shift" <${fromEmail}>`,
    to: email,
    subject: 'Your Secure Shift OTP Code',
    text: `Hi ${recipientName || 'there'},\n\nYour one-time password is ${otp}. It expires in 5 minutes.\n\nIf you did not request this code, reset your password or contact Secure Shift support immediately.`,
    html: getOtpHtmlTemplate({ otp, name: recipientName }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} from ${fromEmail}`);
  } catch (err) {
    const errorMsg = err.message || 'Unknown error';
    console.error('❌ Failed to send OTP email:', errorMsg);
    console.error('   SMTP Config - Host:', process.env.SMTP_HOST || 'NOT SET');
    console.error('   SMTP Config - User:', process.env.SMTP_USER || 'NOT SET');
    console.error('   SMTP Config - Port:', process.env.SMTP_PORT || '587');
    console.error('   SMTP Config - Secure:', process.env.SMTP_SECURE || 'false');
    console.error('   SMTP Config - From Email:', fromEmail || 'NOT SET');
    console.error('   SMTP Config - Password Set:', process.env.SMTP_PASS ? 'YES' : 'NO');
    
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured. Please set it in your .env file');
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials are missing. Please set SMTP_USER and SMTP_PASS in your .env file');
    }
    if (!process.env.SMTP_FROM_EMAIL) {
      throw new Error('SMTP_FROM_EMAIL is not configured. For SendGrid, this must be a verified sender email. Please set it in your .env file or Email Settings UI');
    }
    
    if (errorMsg.includes('Authentication failed') || errorMsg.includes('535')) {
      if (process.env.SMTP_HOST === 'smtp.sendgrid.net' && process.env.SMTP_USER !== 'apikey') {
        throw new Error('For SendGrid, SMTP_USER must be exactly "apikey" (not an email address). SMTP_PASS should be your SendGrid API key.');
      }
      throw new Error(`SMTP Authentication failed. Check your SMTP_USER and SMTP_PASS credentials. Error: ${errorMsg}`);
    }
    
    if (errorMsg.includes('550') || errorMsg.includes('verified Sender Identity')) {
      throw new Error(`The FROM email address (${fromEmail}) is not verified in SendGrid. Please verify this email in SendGrid Dashboard → Settings → Sender Authentication. Error: ${errorMsg}`);
    }
    
    throw new Error(`Failed to send OTP email: ${errorMsg}`);
  }
};

export const sendEmployerCredentials = async (email, tempPassword, contactPerson, companyName) => {
  transporter = createTransporter();
  
  const subject = 'Your SecureShift Employer Account Credentials';
  const greetingName = contactPerson || companyName || 'there';
  const text = `Hello ${greetingName},

An employer account has been created for you on SecureShift.

Email: ${email}
Temporary Password: ${tempPassword}

For security, please log in and change your password immediately.

Best regards,
SecureShift Team`;

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const mailOptions = {
    from: `"SecureShift" <${fromEmail}>`,
    to: email,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Employer credentials email sent to ${email} from ${fromEmail}`);
  } catch (err) {
    console.error('❌ Failed to send employer credentials email:', err.message);
    throw new Error(`Failed to send employer credentials email: ${err.message}`);
  }
};