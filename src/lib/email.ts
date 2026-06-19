import nodemailer from "nodemailer";

// Configure the email transporter
// Using Gmail SMTP — you need to set up an App Password in Google Account
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_APP_PASSWORD || "",
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
  // If email credentials are not configured, just log and skip
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("📧 Email not configured. Would have sent:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML: ${html.substring(0, 200)}...`);
    return { success: false, message: "Email not configured - credentials missing" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"State-ImmoCom" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      replyTo,
    });
    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message);
    return { success: false, message: error.message };
  }
}

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
