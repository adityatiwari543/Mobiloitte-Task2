import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

class EmailServiceClass {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.init();
  }

  private init() {
    if (env.SMTP_USER && env.SMTP_PASSWORD) {
      const cleanPassword = env.SMTP_PASSWORD.replace(/\s+/g, '');
      const isSecurePort = env.SMTP_PORT === 465 || env.SMTP_SECURE;

      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecurePort,
        auth: {
          user: env.SMTP_USER,
          pass: cleanPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      this.isConfigured = true;

      // Asynchronously verify connection on startup without blocking
      this.transporter.verify((error: Error | null) => {
        if (error) {
          console.warn(`⚠️ [EmailService] SMTP connection verification failed: ${error.message}`);
          console.warn(`ℹ️ Fallback console logging will continue to display OTP codes.`);
        } else {
          console.log(`✅ [EmailService] Connected to SMTP server ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}`);
        }
      });
    } else {
      console.warn('⚠️ [EmailService] No SMTP_USER or SMTP_PASSWORD configured. Emails will only be logged to console.');
    }
  }

  /**
   * Send 6-Digit OTP Email
   */
  async sendOtpEmail(
    toEmail: string,
    otp: string,
    purpose: 'email_verification' | 'password_reset' | 'login_verification'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let subject = 'Your JobConnect Verification Code';
    let heading = 'Verify Your Account';
    let actionDescription = 'Please use the following 6-digit verification code to complete your registration on JobConnect.';

    if (purpose === 'password_reset') {
      subject = 'JobConnect - Password Reset Code';
      heading = 'Reset Your Password';
      actionDescription = 'We received a request to reset your JobConnect password. Use the code below to verify your identity and set a new password.';
    } else if (purpose === 'login_verification') {
      subject = 'JobConnect - Login Verification Code';
      heading = 'Two-Factor Authentication';
      actionDescription = 'A login attempt requires two-factor verification. Enter the code below to proceed into your account.';
    }

    // In development / demo testing:
    // If toEmail is a mock/demo address (e.g. ends with @jobconnect.dev, .local, .test, .commmm)
    // Route delivery to env.SMTP_USER so the developer receives the actual OTP in their real Gmail inbox!
    const isMockEmail =
      toEmail.endsWith('@jobconnect.dev') ||
      toEmail.endsWith('.commmm') ||
      toEmail.endsWith('.local') ||
      toEmail.endsWith('.test');

    const actualDeliveryEmail = isMockEmail && env.SMTP_USER ? env.SMTP_USER : toEmail;

    if (isMockEmail && env.SMTP_USER) {
      subject = `[Demo: ${toEmail}] ${subject}`;
    }

    const demoBannerHtml = isMockEmail
      ? `<div style="background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #0369a1; text-align: center;">
           <strong>Demo Account Target:</strong> ${toEmail}
         </div>`
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; border-radius: 9999px; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-align: center; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; text-align: center; }
    .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1e40af; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 10px; }
    .footer { margin-top: 32px; pt: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .warning { color: #dc2626; font-size: 12px; font-weight: 500; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">JobConnect</div>
    <div style="text-align: center;">
      <span class="badge">Security Verification</span>
    </div>
    ${demoBannerHtml}
    <h1>${heading}</h1>
    <p>${actionDescription}</p>

    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">Valid for 5 minutes only</div>
    </div>

    <p class="warning">Do not share this code with anyone. JobConnect representatives will never ask for your code.</p>

    <div class="footer">
      This is an automated security message from JobConnect Platform.<br>
      If you did not make this request, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
    `.trim();

    const textContent = `
JobConnect Security Verification
================================
${isMockEmail ? `Demo Account Target: ${toEmail}\n` : ''}
${heading}

${actionDescription}

YOUR 6-DIGIT VERIFICATION CODE: ${otp}
(This code is valid for 5 minutes)

Do not share this code with anyone.
If you did not request this code, please ignore this email.
    `.trim();

    if (!this.transporter || !this.isConfigured) {
      console.log(`ℹ️ [EmailService Simulated Delivery] To: ${toEmail} | OTP: ${otp} | Purpose: ${purpose}`);
      return { success: true, messageId: 'simulated' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.FROM_EMAIL || `"JobConnect Security" <${env.SMTP_USER}>`,
        to: actualDeliveryEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`📧 [EmailService] OTP Email sent successfully to ${actualDeliveryEmail} (Target account: ${toEmail}). MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`❌ [EmailService] Error dispatching email to ${actualDeliveryEmail}:`, err.message || err);
      return { success: false, error: err.message || 'SMTP transmission error' };
    }
  }
}

export const EmailService = new EmailServiceClass();
