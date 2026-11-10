export type Theme = 'light' | 'dark';

export const THEME_KEY = 'pengopal-theme';

/** A stored choice wins; anything else (missing, unknown, blocked storage) follows the system. */
export function resolveTheme(stored: string | null, systemDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemDark ? 'dark' : 'light';
}
