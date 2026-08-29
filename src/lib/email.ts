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

  const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
  const SERIF = "Georgia, 'Times New Roman', serif";

  const html = `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#f3ecdb; font-family:${SANS};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${params.body}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdb; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:#fffdf9; border-radius:16px; overflow:hidden; border:1px solid rgba(26,17,8,0.08);">
            <tr>
              <td style="height:4px; background:linear-gradient(90deg,#b9924f,#d8be83);"></td>
            </tr>
            <tr>
              <td style="padding:28px 32px 20px;">
                <span style="font-family:${SANS}; font-size:15px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:#1a1108;">Feyse</span>
                <span style="font-family:${SANS}; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#7c5c2c; margin-left:6px;">Clothing Labels</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 28px;">
                <h1 style="margin:0 0 14px; font-family:${SERIF}; font-size:21px; line-height:1.3; color:#1a1108; font-weight:400;">${params.subject}</h1>
                <p style="margin:0; font-family:${SANS}; font-size:14px; line-height:1.65; color:#402c1d;">${params.body}</p>
                ${
                  params.ctaHref
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td style="border-radius:999px; background:#b9924f;">
                        <a href="${params.ctaHref}" style="display:inline-block; padding:11px 22px; font-family:${SANS}; font-size:14px; font-weight:600; color:#1a1108; text-decoration:none; border-radius:999px;">${params.ctaLabel ?? "View in dashboard"}</a>
                      </td></tr></table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px; background:#f3ecdb; border-top:1px solid rgba(26,17,8,0.06);">
                <p style="margin:0; font-family:${SANS}; font-size:11px; line-height:1.6; color:#543a26;">
                  Feyse Clothing Labels · Custom woven &amp; printed garment labels
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, html });
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}
