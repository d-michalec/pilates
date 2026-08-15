export const FITSSEY_WIDGET_SCRIPT_URL = 'https://app.fitssey.com/assets/js/lb.widget.prod.js';
export const FITSSEY_WIDGET_BASE_URL = 'https://app.fitssey.com';

export const FITSSEY_STUDIO_UUID = '2314264123';

/**
 * Bezpośredni adres frontoffice Fitssey. Trzymamy go w jednym miejscu, bo korzysta z niego
 * zarówno widok grafiku, jak i wstępne rozgrzewanie połączenia przy otwarciu menu.
 */
export const FITSSEY_SCHEDULE_URL =
  `${FITSSEY_WIDGET_BASE_URL}/${FITSSEY_STUDIO_UUID}/frontoffice` +
  '?widget=1&saveParams=1&header=false&category=#filters:,,,,,';

export function isFitsseyConfigured() {
  return Boolean(FITSSEY_STUDIO_UUID.trim());
}
