import type { APIRoute } from 'astro';
import { z } from 'zod';
import { Resend } from 'resend';
import { env } from 'cloudflare:workers';

export const prerender = false;

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  project_type: z.enum(['wordpress', 'salesforce', 'custom', 'agency', 'other']),
  message: z.string().trim().min(1).max(5000),
  'cf-turnstile-response': z.string().min(1),
});

const PROJECT_LABELS: Record<z.infer<typeof ContactSchema>['project_type'], string> = {
  wordpress: 'WordPress build',
  salesforce: 'Salesforce integration',
  custom: 'Custom tool / web app',
  agency: 'Agency partnership / white-label',
  other: 'Something else',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function verifyTurnstile(
  token: string,
  ip: string | null,
  secret: string,
): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    'error-codes'?: string[];
  };
  return result.success === true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Accept either form-encoded or JSON
  const contentType = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown>;
  try {
    if (contentType.includes('application/json')) {
      raw = (await request.json()) as Record<string, unknown>;
    } else {
      const fd = await request.formData();
      raw = Object.fromEntries(fd.entries());
    }
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot — silently accept so bots don't learn anything
  const honey = String(raw.website ?? '').trim();
  if (honey.length > 0) {
    return jsonResponse({ ok: true });
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const missingTurnstile = issues.some((i) => i.path[0] === 'cf-turnstile-response');
    const invalidEmail = issues.some(
      (i) => i.path[0] === 'email' && i.code !== 'too_small',
    );
    console.warn('contact: validation failed', {
      issues: issues.map((i) => ({ path: i.path, code: i.code })),
    });
    if (missingTurnstile) {
      return jsonResponse(
        {
          ok: false,
          error: 'Captcha did not load. Refresh the page and try again.',
        },
        400,
      );
    }
    if (invalidEmail) {
      return jsonResponse({ ok: false, error: 'That email address looks invalid.' }, 400);
    }
    return jsonResponse({ ok: false, error: 'Please fill in all required fields.' }, 400);
  }

  // Verify Turnstile
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    clientAddress ??
    null;
  const turnstileOk = await verifyTurnstile(
    parsed.data['cf-turnstile-response'],
    typeof ip === 'string' ? ip.split(',')[0]?.trim() ?? null : null,
    env.TURNSTILE_SECRET_KEY,
  );
  if (!turnstileOk) {
    console.warn('contact: turnstile siteverify rejected token');
    return jsonResponse(
      { ok: false, error: 'Captcha verification failed. Please try again.' },
      400,
    );
  }

  // Send email via Resend
  const resend = new Resend(env.RESEND_API_KEY);
  const { name, email, project_type, message } = parsed.data;
  const projectLabel = PROJECT_LABELS[project_type];
  const subject = `[skm.digital] New project inquiry from ${name}`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#13100B;line-height:1.55;max-width:560px;">
      <p style="font-family:ui-monospace,monospace;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#857A6D;margin:0 0 12px;">New project inquiry</p>
      <h2 style="font-family:Georgia,serif;font-size:20px;margin:0 0 18px;color:#13100B;">${escapeHtml(name)} &mdash; ${escapeHtml(projectLabel)}</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:18px;">
        <tr><td style="padding:6px 0;color:#857A6D;font-size:13px;width:100px;">Name</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#857A6D;font-size:13px;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#857A6D;font-size:13px;">Project</td><td style="padding:6px 0;">${escapeHtml(projectLabel)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #C2B89F;margin:18px 0;" />
      <p style="white-space:pre-wrap;margin:0;">${escapeHtml(message)}</p>
    </div>
  `.trim();

  const text = [
    'New project inquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Project: ${projectLabel}`,
    '',
    message,
  ].join('\n');

  const { error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    replyTo: email,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('contact: resend send failed', error);
    return jsonResponse(
      { ok: false, error: 'Could not send the message. Please try again or email me directly.' },
      502,
    );
  }

  console.log('contact: delivered', { project_type, email });
  return jsonResponse({ ok: true });
};

export const GET: APIRoute = () =>
  jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
