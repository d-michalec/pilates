export const FITSSEY_WIDGET_SCRIPT_URL = 'https://app.fitssey.com/assets/js/lb.widget.prod.js';
export const FITSSEY_WIDGET_BASE_URL = 'https://app.fitssey.com';

/**
 * Identyfikator studia w Fitssey - ten sam, który stoi w adresie panelu i w kodzie
 * bazowym widgetu (`lb('init','baba')`). Do sprawdzenia w Fitssey: Studio → Twoje
 * studio → "Unikatowy identyfikator studia".
 */
export const FITSSEY_STUDIO_UUID = 'baba';

/**
 * Bezpośredni adres frontoffice Fitssey. Trzymamy go w jednym miejscu, bo korzysta z niego
 * zarówno widok grafiku, jak i wstępne rozgrzewanie połączenia przy otwarciu menu.
 *
 * `header=true` pokazuje własną nawigację Fitssey nad grafikiem. Które zakładki się w niej
 * pojawią, nie wynika z tego adresu, tylko z ustawień studia w Fitssey - FrontOffice → Strony.
 * Grafik i profil są zawsze, "Kursy" i "Cennik" pokazują się dopiero po zaznaczeniu
 * "Włącz stronę ... dla FrontOffice™" na odpowiedniej podstronie ustawień.
 */
export const FITSSEY_SCHEDULE_URL =
  `${FITSSEY_WIDGET_BASE_URL}/${FITSSEY_STUDIO_UUID}/frontoffice` +
  '?widget=1&saveParams=1&header=true&category=#filters:,,,,,';

export function isFitsseyConfigured() {
  return Boolean(FITSSEY_STUDIO_UUID.trim());
}
