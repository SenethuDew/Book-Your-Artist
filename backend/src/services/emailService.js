/**
 * Email service using nodemailer + SMTP.
 *
 * Required env vars (use app passwords for Gmail/Outlook):
 *   SMTP_HOST       e.g. smtp.gmail.com
 *   SMTP_PORT       587 (TLS) or 465 (SSL)
 *   SMTP_SECURE     "true" for 465, otherwise "false"
 *   SMTP_USER       SMTP username (usually your full email)
 *   SMTP_PASS       app password / SMTP password
 *   SMTP_FROM       "Book Your Artist <noreply@yourdomain.com>" (defaults to SMTP_USER)
 *
 * If SMTP_HOST is not set, falls back to dev mode (logs to console).
 */

let transporter = null;
let initFailed = false;

function getTransporter() {
  if (transporter || initFailed) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  try {
    const nodemailer = require("nodemailer");
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return transporter;
  } catch (err) {
    initFailed = true;
    console.error("[Email] Failed to init transporter:", err.message);
    return null;
  }
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) return { delivered: false, reason: "Missing recipient email" };

  const t = getTransporter();
  if (!t) {
    console.log(`[Email:dev] -> ${to} | ${subject}\n${text || html}`);
    return { delivered: false, dev: true, reason: "SMTP not configured" };
  }

  const from =
    process.env.SMTP_FROM ||
    `Book Your Artist <${process.env.SMTP_USER}>`;

  try {
    const info = await t.sendMail({ from, to, subject, text, html });
    console.log(`[Email] sent id=${info.messageId} -> ${to}`);
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] send failed to ${to}:`, err.message);
    return { delivered: false, reason: err.message };
  }
}

async function sendOtpEmail(toEmail, otp) {
  const subject = "Your Book Your Artist verification code";
  const text = `Your verification code is ${otp}.

This code expires in 10 minutes. If you did not request this, you can safely ignore this email.

— Book Your Artist`;

  const html = `
  <div style="font-family:Inter,system-ui,Arial,sans-serif;background:#0f0820;padding:32px;color:#fff;">
    <div style="max-width:480px;margin:auto;background:#1a0f28;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Bank account verification</h1>
      <p style="margin:0 0 24px;color:#b8b1c8;line-height:1.5;">
        Use the code below to verify your payout bank account on Book Your Artist.
      </p>
      <div style="background:#0f0820;border:1px solid rgba(167,139,250,.4);border-radius:12px;padding:18px;text-align:center;letter-spacing:0.5em;font-family:'JetBrains Mono',Menlo,monospace;font-size:32px;font-weight:800;color:#c4b5fd;">
        ${otp}
      </div>
      <p style="margin:24px 0 0;color:#867d99;font-size:13px;line-height:1.5;">
        This code expires in 10 minutes. Do not share it with anyone — Book Your Artist
        staff will never ask for it.
      </p>
    </div>
  </div>`;

  return sendEmail({ to: toEmail, subject, text, html });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const subject = "Reset your Book Your Artist password";
  const text = `We received a request to reset your password.

Open this link to choose a new password (valid for 1 hour):
${resetUrl}

If you didn't request this, you can ignore this email.

— Book Your Artist`;

  const html = `
  <div style="font-family:Inter,system-ui,Arial,sans-serif;background:#0f0820;padding:32px;color:#fff;">
    <div style="max-width:480px;margin:auto;background:#1a0f28;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#fff;">Reset your password</h1>
      <p style="margin:0 0 24px;color:#b8b1c8;line-height:1.5;">
        Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#c026d3);color:#fff;font-weight:800;padding:14px 28px;border-radius:12px;text-decoration:none;">
        Reset password
      </a>
      <p style="margin:24px 0 0;color:#867d99;font-size:13px;line-height:1.5;">
        Or copy this URL into your browser:<br/>
        <span style="word-break:break-all;color:#a78bfa;">${resetUrl}</span>
      </p>
    </div>
  </div>`;

  return sendEmail({ to: toEmail, subject, text, html });
}

module.exports = { sendEmail, sendOtpEmail, sendPasswordResetEmail };
