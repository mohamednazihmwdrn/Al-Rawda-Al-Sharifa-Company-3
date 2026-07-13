/**
 * Helper utilities for Al-Rawda Al-Sharifa Deficits system.
 */

export const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const safeEncodeBase64 = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Base64 encoding error:', e);
    return '';
  }
};

export const safeDecodeBase64 = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Base64 decoding error:', e);
    return '';
  }
};
