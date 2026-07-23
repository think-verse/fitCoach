import "server-only";

/**
 * Thin Resend email client (via REST — no SDK dependency).
 * If RESEND_API_KEY is not set, sends are skipped (logged) so the rest of the
 * access flow still works in dev. Set the key in .env.local to enable real mail.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "AesthetixAI <daya@aesthetixai.fit>";
export const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || "dhruvsangal1999@gmail.com";

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY missing — skipped mail to ${opts.to}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[email] Resend ${res.status}: ${text}`);
      return { ok: false, error: `${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { ok: false, error: "exception" };
  }
}

/* ------------------------------ templates ------------------------------ */

const BRAND = "#10b981";
const BG = "#0a0a0b";
const CARD = "#141416";
const TEXT = "#fafafa";
const MUTED = "#9ca3af";

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BG};padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 8px 24px;">
        <span style="display:inline-block;background:${BRAND};color:#052e1a;font-weight:800;border-radius:10px;padding:8px 12px;font-size:15px;">AesthetixAI</span>
      </td></tr>
      <tr><td style="background:${CARD};border:1px solid #232327;border-radius:18px;padding:32px;">
        ${inner}
      </td></tr>
      <tr><td style="padding:20px 8px;color:${MUTED};font-size:12px;line-height:1.6;">
        For fitness guidance only — not medical advice.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export function credentialEmailHtml(opts: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}): string {
  return shell(`
    <h1 style="margin:0 0 8px;color:${TEXT};font-size:24px;">Your access is confirmed 🎉</h1>
    <p style="margin:0 0 20px;color:${MUTED};font-size:15px;line-height:1.6;">
      Your AesthetixAI access is now active. Use the credentials below to sign in.
    </p>
    <div style="background:${BG};border:1px solid #232327;border-radius:12px;padding:18px;margin-bottom:22px;">
      <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Login email</div>
      <div style="color:${TEXT};font-size:16px;font-weight:600;margin:2px 0 14px;">${escapeHtml(opts.email)}</div>
      <div style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Temporary password</div>
      <div style="color:${BRAND};font-size:18px;font-weight:700;font-family:monospace;margin-top:2px;">${escapeHtml(opts.password)}</div>
    </div>
    <a href="${opts.loginUrl}" style="display:inline-block;background:${BRAND};color:#052e1a;font-weight:700;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:15px;">Sign in to AesthetixAI →</a>
    <p style="margin:24px 0 0;color:${MUTED};font-size:13px;line-height:1.7;">
      <strong style="color:${TEXT};">What you can do now:</strong><br/>
      • Upload your physique for an AI body analysis<br/>
      • Get a personalized workout &amp; diet plan<br/>
      • Chat with your AI coach any time<br/>
      • Check in weekly and watch your plan adapt
    </p>
  `);
}

export function adminNotifyHtml(opts: {
  name: string;
  email: string;
  mobile: string;
  loginUrl: string;
}): string {
  return shell(`
    <h1 style="margin:0 0 8px;color:${TEXT};font-size:22px;">New paid member ✅</h1>
    <p style="margin:0 0 18px;color:${MUTED};font-size:15px;">A new member was granted access via the thank-you page.</p>
    <table role="presentation" width="100%" style="color:${TEXT};font-size:15px;">
      <tr><td style="color:${MUTED};padding:6px 0;width:120px;">Name</td><td style="padding:6px 0;">${escapeHtml(opts.name)}</td></tr>
      <tr><td style="color:${MUTED};padding:6px 0;">Email</td><td style="padding:6px 0;">${escapeHtml(opts.email)}</td></tr>
      <tr><td style="color:${MUTED};padding:6px 0;">Mobile</td><td style="padding:6px 0;">${opts.mobile ? escapeHtml(opts.mobile) : "—"}</td></tr>
    </table>
  `);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
