import { onReveal } from '../motion/reveal';
import { burst } from '../motion/burst';
import { mailtoFallback, submitEnquiry, type EnquiryInput } from './contact-client';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface Turnstile {
  render(el: Element, opts: Record<string, unknown>): string;
  reset(id?: string): void;
}
type TurnstileWindow = Window & { turnstile?: Turnstile };

const FIELDS = ['name', 'email', 'message', 'timeline'] as const;

export function initContact(form: HTMLFormElement): void {
  const section = form.closest('section')!;
  const send = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const failed = form.querySelector<HTMLElement>('[data-failed]')!;
  const mailto = form.querySelector<HTMLAnchorElement>('[data-mailto]')!;
  const tsError = form.querySelector<HTMLElement>('[data-turnstile-error]')!;
  const success = section.querySelector<HTMLElement>('[data-success]')!;
  const slot = form.querySelector<HTMLElement>('[data-turnstile]')!;

  let token = '';
  let widget: string | undefined;
  let sending = false;
  const refresh = () => { send.disabled = sending || !token; };

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;
  const showError = (name: string, msg: string) => {
    const input = field(name), err = form.querySelector<HTMLElement>(`#e-${name}`);
    if (!input || !err) return;
    input.setAttribute('aria-invalid', 'true');
    err.textContent = msg;
    err.hidden = false;
  };
  const clearErrors = () => {
    FIELDS.forEach((n) => {
      field(n)?.removeAttribute('aria-invalid');
      const err = form.querySelector<HTMLElement>(`#e-${n}`);
      if (err) { err.hidden = true; err.textContent = ''; }
    });
    failed.hidden = true;
  };

  // Turnstile: loaded only when the form is near the viewport (spec §6.3).
  const renderWidget = () => {
    const ts = (window as TurnstileWindow).turnstile;
    if (!ts) return;
    widget = ts.render(slot, {
      sitekey: form.dataset.sitekey,
      appearance: 'interaction-only',
      callback: (t: string) => { token = t; refresh(); },
      'expired-callback': () => { token = ''; refresh(); },
      'error-callback': () => { token = ''; refresh(); },
    });
  };
  const loadTurnstile = () => {
    if ((window as TurnstileWindow).turnstile) return renderWidget();
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = renderWidget;
    s.onerror = () => { tsError.hidden = false; refresh(); };
    document.head.appendChild(s);
  };
  onReveal(form, loadTurnstile, { threshold: 0, rootMargin: '600px 0px' });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || !token) return;
    clearErrors();

    // Native constraint checks first, shown the same way as the server's.
    let firstInvalid: HTMLElement | null = null;
    for (const n of FIELDS) {
      const input = field(n);
      if (input && !input.checkValidity()) {
        showError(n, input.validationMessage);
        firstInvalid ??= input;
      }
    }
    if (firstInvalid) { firstInvalid.focus(); return; }

    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const input: EnquiryInput = {
      name: data.name ?? '', email: data.email ?? '', message: data.message ?? '',
      timeline: data.timeline ?? '', website: data.website ?? '', turnstileToken: token,
    };

    sending = true;
    refresh();
    send.textContent = send.dataset.sending ?? send.textContent;
    form.setAttribute('aria-busy', 'true');
    const result = await submitEnquiry(input);
    sending = false;
    form.removeAttribute('aria-busy');
    send.textContent = send.dataset.label ?? send.textContent;

    if (result.ok) {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      burst(success);
      return;
    }
    // A Turnstile token is single-use: ask for a fresh one before the next try.
    token = '';
    (window as TurnstileWindow).turnstile?.reset(widget);
    refresh();
    if (result.kind === 'validation') {
      Object.entries(result.fields).forEach(([n, msg]) => showError(n, msg));
      const first = FIELDS.find((n) => result.fields[n]);
      if (first) field(first)?.focus();
    } else {
      mailto.href = mailtoFallback(input);
      failed.hidden = false;
    }
  });
}
