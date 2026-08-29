import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || "Feyse Clothing Labels <onboarding@resend.dev>";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://feyseclothinglabel.vercel.app";

/**
 * Sends a plain, branded-enough transactional email via Resend. No-ops
 * (with a console warning) if RESEND_API_KEY isn't configured, so the rest
 * of the app keeps working without it — email is additive to the in-app
 * notification, never a dependency for it.
 */
export async function sendEmail(params: { to: string | string[]; subject: string; body: string; ctaLabel?: string; ctaHref?: string }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${params.subject}" to ${params.to}`);
    return;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #241710;">
      <p style="font-size: 20px; font-style: italic; margin: 0 0 24px;">Feyse Clothing Labels</p>
      <h1 style="font-size: 18px; margin: 0 0 12px;">${params.subject}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #4d4436;">${params.body}</p>
      ${
        params.ctaHref
          ? `<p style="margin-top: 20px;"><a href="${params.ctaHref}" style="background:#b9924f;color:#1a1108;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">${params.ctaLabel ?? "View in dashboard"}</a></p>`
          : ""
      }
    </div>
  `;

  try {
    await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, html });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}
