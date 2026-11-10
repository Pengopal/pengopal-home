import { THEME_KEY } from './theme';

const SCROLLED_AT = 24;

function syncToggle(toggle: HTMLButtonElement) {
  toggle.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
}

export function initHeader(root: HTMLElement): void {
  // Solid bar once the page scrolls.
  const onScroll = () => {
    root.dataset.scrolled = String(window.scrollY > SCROLLED_AT);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Theme toggle: flips the theme and remembers it when storage is available.
  const toggle = root.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (toggle) {
    syncToggle(toggle);
    toggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // storage blocked: the choice holds for this visit only
      }
      syncToggle(toggle);
    });
  }

  // Phone menu: an accessible disclosure.
  const button = root.querySelector<HTMLButtonElement>('[data-menu-button]');
  const panel = button ? document.getElementById(button.getAttribute('aria-controls') ?? '') : null;
  if (!button || !panel) return;
  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    root.dataset.menuOpen = String(open);
  };
  setOpen(false);
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false);
  });
  // On the document, not the header: Safari does not focus a button on click,
  // so after opening the menu the key event may never pass through the header.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
}
