import { resolveTheme, THEME_KEY } from '../../src/scripts/theme';

test('stored light/dark wins', () => {
  expect(resolveTheme('dark', false)).toBe('dark');
  expect(resolveTheme('light', true)).toBe('light');
});

test('no stored value follows system', () => {
  expect(resolveTheme(null, true)).toBe('dark');
  expect(resolveTheme(null, false)).toBe('light');
});

test('invalid stored theme falls back to system', () => {
  expect(resolveTheme('purple', true)).toBe('dark');
});

test('storage key is stable', () => {
  expect(THEME_KEY).toBe('pengopal-theme');
});
