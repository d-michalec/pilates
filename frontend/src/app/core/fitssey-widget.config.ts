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
/**
 * Cennik jest w Fitssey osobną stroną frontoffice, a nie osobnym elementem
 * widgetu: skrypt `lb.widget.prod.js` rejestruje tylko `lb-schedule-widget`
 * i `lb-course-widget` (patrz przykład w fitssey-widget-next-js-example).
 * Dlatego cennik osadzamy ramką na adres frontoffice - ten sam wzorzec adresu,
 * jaki mają publiczne frontoffice innych studiów.
 *
 * Na końcu musi stać `/classes`. Samo `/frontoffice/pricing` jest w routerze
 * Fitssey trasą nadrzędną bez treści: strona się wczytuje, ale zakładka
 * "Cennik" zostaje nieaktywna, a pod banerem widać wyłącznie pusty napis
 * "Zajęcia". Adres z `/classes` to dokładnie to, co Fitssey podstawia pod
 * kliknięcie w swoją własną zakładkę cennika (`a.lb-tab` prowadzi na
 * `/frontoffice/pricing/classes`), więc widok wchodzi od razu zaznaczony.
 *
 * Strona pokaże się tylko wtedy, gdy jest włączona w ustawieniach studia:
 * Fitssey → FrontOffice → Strony → "Włącz stronę cennika dla FrontOffice™".
 * Bez tego Fitssey odpowie własnym komunikatem o braku strony.
 */
export const FITSSEY_PRICING_URL =
  `${FITSSEY_WIDGET_BASE_URL}/${FITSSEY_STUDIO_UUID}/frontoffice/pricing/classes` +
  '?widget=1&saveParams=1&header=true';

/**
 * Osadzone strony Fitssey (te z `widget=1`) same podają rodzicowi swoją
 * wysokość: wysyłają `postMessage` z JSON-em, w którym kluczem jest nazwa
 * zdarzenia, a wartością liczba pikseli. Na tym stoi automatyczna wysokość
 * oficjalnego widgetu grafiku - dla cennika, który idzie zwykłą ramką,
 * obsługujemy tę samą parę zdarzeń u siebie.
 *
 * `recalculate` to zmierzona wysokość treści. `override` przychodzi, gdy
 * Fitssey otwiera własny panel (np. zakup karnetu) i chce wysokość wymusić -
 * dopóki jest ustawione, ma pierwszeństwo nad wyliczoną.
 */
export const FITSSEY_FRAME_ORIGIN = FITSSEY_WIDGET_BASE_URL;
export const FITSSEY_FRAME_HEIGHT_EVENT = 'com.lightenbody.widget.recalculateIframeHeight';
export const FITSSEY_FRAME_HEIGHT_OVERRIDE_EVENT = 'com.lightenbody.widget.overrideIframeHeight';

/** Zapora na wartości z cudzej strony: poniżej tego nie schodzimy, wyżej nie rośniemy. */
export const FITSSEY_FRAME_MIN_HEIGHT_PX = 480;
export const FITSSEY_FRAME_MAX_HEIGHT_PX = 20000;

export const FITSSEY_SCHEDULE_URL =
  `${FITSSEY_WIDGET_BASE_URL}/${FITSSEY_STUDIO_UUID}/frontoffice` +
  '?widget=1&saveParams=1&header=true&category=#filters:,,,,,';

export function isFitsseyConfigured() {
  return Boolean(FITSSEY_STUDIO_UUID.trim());
}
