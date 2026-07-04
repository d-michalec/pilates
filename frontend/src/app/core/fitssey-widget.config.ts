export const FITSSEY_WIDGET_SCRIPT_URL = 'https://app.fitssey.com/assets/js/lb.widget.prod.js';
export const FITSSEY_WIDGET_BASE_URL = 'https://app.fitssey.com';

export const FITSSEY_STUDIO_UUID = '2314264123';

export function isFitsseyConfigured() {
  return Boolean(FITSSEY_STUDIO_UUID.trim());
}
