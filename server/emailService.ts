import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
  console.warn('⚠️  Email service not configured: EMAIL_USER and EMAIL_APP_PASSWORD environment variables are required');
}

// Create nodemailer transporter
const transporter = EMAIL_USER && EMAIL_APP_PASSWORD 
  ? nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD,
      },
    })
  : null;

// Helper to get base URL for links in emails
function getBaseUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  return 'http://localhost:5000';
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  if (!transporter) {
    // Fallback to console logging if email is not configured
    const baseUrl = getBaseUrl();
    console.log(`📧 Verification email would be sent to: ${email}`);
    console.log(`🔗 Verification link: ${baseUrl}/api/auth/verify-email?token=${token}`);
    console.log(`✨ Configure EMAIL_USER and EMAIL_APP_PASSWORD to enable actual email sending`);
    return;
  }

  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"TrackMyRC" <${EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your TrackMyRC Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4a7c59; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4a7c59; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TrackMyRC!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with TrackMyRC! To complete your registration and start tracking your RC car collection, please verify your email address.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">${verificationLink}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with TrackMyRC, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TrackMyRC. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!transporter) {
    // Fallback to console logging if email is not configured
    const baseUrl = getBaseUrl();
    console.log(`📧 Password reset email would be sent to: ${email}`);
    console.log(`🔗 Reset link: ${baseUrl}/reset-password?token=${token}`);
    console.log(`✨ Configure EMAIL_USER and EMAIL_APP_PASSWORD to enable actual email sending`);
    return;
  }

  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"TrackMyRC" <${EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your TrackMyRC Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4a7c59; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4a7c59; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your TrackMyRC account.</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This password reset link will expire in 1 hour.
            </div>
            <p><strong>If you didn't request a password reset</strong>, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TrackMyRC. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}

export function isEmailConfigured(): boolean {
  return !!(transporter && EMAIL_USER && EMAIL_APP_PASSWORD);
}
