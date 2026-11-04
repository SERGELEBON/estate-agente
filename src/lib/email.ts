import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/security";

/**
 * Transport selection:
 *  - SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD  → any provider (Resend, Brevo, Zoho, Mailgun…)
 *  - EMAIL_USER/EMAIL_APP_PASSWORD                → Gmail with an App Password (legacy)
 * Emails go to any inbox (Gmail, iCloud, Outlook, Yahoo, company domains…).
 */
function createTransport() {
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER ?? "", pass: process.env.SMTP_PASSWORD ?? "" },
    });
  }
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
    });
  }
  return null;
}

const transporter = createTransport();
const FROM =
  process.env.EMAIL_FROM ??
  `"State-ImmoCom" <${process.env.SMTP_USER ?? process.env.EMAIL_USER ?? "no-reply@state-immocom.com"}>`;

export const emailConfigured = () => transporter !== null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo }: EmailOptions) {
  if (!transporter) {
    console.warn(`[email] Transport not configured — skipped "${subject}" to ${to}`);
    return { success: false, message: "Email not configured" };
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text, replyTo });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[email] Sending failed:", error?.message);
    return { success: false, message: error?.message ?? "Unknown error" };
  }
}

function siteUrl() {
  return (process.env.NEXTAUTH_URL ?? "https://state-agente.vercel.app").replace(/\/$/, "");
}

/** Branded, inline-styled layout compatible with Gmail, Apple Mail and Outlook. */
function layout(title: string, body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr><td style="background:#2E8B57;padding:20px 28px;">
      <div style="color:#fff;font-size:20px;font-weight:700;">State-ImmoCom</div>
      <div style="color:#F4C430;font-size:10px;letter-spacing:3px;font-weight:600;">BUY &bull; RENT &bull; INVEST</div>
    </td></tr>
    <tr><td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">${footer}</td></tr>
  </table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#2E8B57;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

export function otpEmail(code: string, ttlMinutes: number) {
  const subject = `${code} is your State-ImmoCom verification code`;
  const html = layout(
    "Confirm your email",
    `<p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">Use this code to continue your conversation with our agents:</p>
     <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#111827;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;font-family:'Courier New',monospace;">${code}</div>
     <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">This code expires in ${ttlMinutes} minutes and can be used once. Never share it with anyone — State-ImmoCom staff will never ask for it.</p>`,
    "If you didn't request this code, you can safely ignore this email."
  );
  const text = `Your State-ImmoCom verification code is ${code}. It expires in ${ttlMinutes} minutes. If you didn't request it, ignore this email.`;
  return { subject, html, text };
}

export function newMessageEmail(opts: {
  recipientName?: string | null;
  senderName: string;
  preview: string;
  propertyTitle?: string | null;
  link: string;
}) {
  const preview = escapeHtml(opts.preview.slice(0, 300));
  const about = opts.propertyTitle ? ` about <strong>${escapeHtml(opts.propertyTitle)}</strong>` : "";
  const subject = `New message from ${opts.senderName}`;
  const html = layout(
    `Hi ${escapeHtml(opts.recipientName?.split(" ")[0] ?? "there")},`,
    `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;"><strong>${escapeHtml(opts.senderName)}</strong> sent you a message${about}:</p>
     <div style="border-left:4px solid #2E8B57;background:#f9fafb;padding:14px 16px;border-radius:6px;color:#374151;font-size:14px;line-height:1.6;white-space:pre-line;">${preview}</div>
     <p style="margin:24px 0 0;">${button(opts.link, "Reply on State-ImmoCom")}</p>`,
    "You receive this email because you have a conversation on State-ImmoCom."
  );
  return { subject, html, text: `${opts.senderName}: ${opts.preview.slice(0, 300)}\n\nReply: ${opts.link}` };
}

export function agentReviewEmail(agent: { name?: string | null; email: string; license?: string | null }) {
  return {
    subject: `Agent profile to review: ${agent.name ?? agent.email}`,
    html: layout(
      "New agent awaiting verification",
      `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;"><strong>${escapeHtml(agent.name ?? "")}</strong> (${escapeHtml(agent.email)}) completed their agent profile.</p>
       <p style="margin:0 0 20px;color:#374151;font-size:14px;">License: <strong>${escapeHtml(agent.license ?? "—")}</strong></p>
       ${button(`${siteUrl()}/dashboard/admin/users`, "Review in admin")}`,
      "Verify the license before approving the account."
    ),
  };
}

export function agentApprovedEmail(name?: string | null) {
  return {
    subject: "Your State-ImmoCom agent account is approved",
    html: layout(
      `Welcome aboard${name ? `, ${escapeHtml(name.split(" ")[0])}` : ""}!`,
      `<p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">Your profile has been verified. You can now publish listings and receive messages from clients.</p>
       ${button(`${siteUrl()}/dashboard/agent`, "Open my dashboard")}`,
      "State-ImmoCom — Accra"
    ),
  };
}

export { siteUrl };

export function buildContactEmailHtml(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2E8B57, #3CB371); padding: 24px 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">State-ImmoCom</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">BUY • RENT • INVEST</p>
      </div>
      <div style="padding: 24px 32px;">
        <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px;">New Contact Message</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px; vertical-align: top;"><strong>Name:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${data.email}" style="color: #2E8B57;">${data.email}</a></td>
          </tr>
          ${data.phone ? `<tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.phone}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;"><strong>Subject:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #2E8B57;">
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${data.message.replace(/\n/g, "<br/>")}</p>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">This message was sent via the State-ImmoCom contact form.</p>
      </div>
    </div>
  `;
}
