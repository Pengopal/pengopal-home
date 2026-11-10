import { site } from '../content/site';

export interface EnquiryInput {
  name: string;
  email: string;
  message: string;
  timeline: string;
  website: string;
  turnstileToken: string;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: 'validation'; fields: Record<string, string> }
  | { ok: false; kind: 'failed' };

/** Sends the enquiry to the Worker (spec §6.2). Anything but success or field errors is "failed". */
/** A stalled request gives up after this long, so the visitor gets the email fallback instead of waiting. */
export const SUBMIT_TIMEOUT_MS = 15_000;

export async function submitEnquiry(
  data: EnquiryInput,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = SUBMIT_TIMEOUT_MS,
): Promise<SubmitResult> {
  try {
    const res = await fetchImpl('/api/contact', {
      signal: AbortSignal.timeout(timeoutMs),
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 200) return { ok: true };
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> };
      if (body.fields && Object.keys(body.fields).length) return { ok: false, kind: 'validation', fields: body.fields };
    }
    return { ok: false, kind: 'failed' };
  } catch {
    return { ok: false, kind: 'failed' };
  }
}

/** A ready-to-send email with the visitor's own words, so a failed send never loses an enquiry. */
export function mailtoFallback(d: Pick<EnquiryInput, 'name' | 'message' | 'timeline'>): string {
  const subject = `New enquiry — ${d.name}`;
  const body = [d.message, '', `Timeline: ${d.timeline || 'Not given'}`].join('\n');
  return `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
