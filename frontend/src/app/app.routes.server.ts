import { inject } from '@angular/core';
import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

import { API_BASE_URL } from './core/api-url';

/**
 * Strony wydarzeń generujemy statycznie na podstawie danych z backendu, żeby były
 * widoczne dla wyszukiwarek - wcześniej trasa renderowała się wyłącznie po stronie
 * klienta i zwracała pustą skorupę HTML.
 *
 * Wydarzenia dodane z panelu już po buildzie trafiają na fallback renderowany po
 * stronie klienta: działają od razu, a do indeksu wchodzą przy najbliższym buildzie.
 */
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Ta funkcja bywa wywoływana z innego injectora niż aplikacja, więc token może nie
 * mieć wartości. Bez tego zabezpieczenia adres byłby pusty, fetch cicho by padł,
 * a build przeszedłby bez żadnej strony wydarzenia - błąd trudny do zauważenia.
 */
function resolveApiBaseUrl() {
  const injected = inject(API_BASE_URL, { optional: true });
  return injected?.trim() || process.env['PRERENDER_API_URL'] || 'http://localhost:8080';
}

async function getEventPrerenderParams(): Promise<Record<string, string>[]> {
  const apiBaseUrl = resolveApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/api/events`);

    if (!response.ok) {
      console.warn(`[prerender] ${apiBaseUrl}/api/events odpowiedziało ${response.status}. Pomijam strony wydarzeń.`);
      return [];
    }

    const events = (await response.json()) as { id: string }[];
    console.log(`[prerender] Generuję ${events.length} stron wydarzeń z ${apiBaseUrl}.`);
    return events.map((event) => ({ id: String(event.id) }));
  } catch {
    // Build nie może się wywalić tylko dlatego, że backend akurat nie stoi.
    console.warn(`[prerender] Backend ${apiBaseUrl} niedostępny. Pomijam strony wydarzeń.`);
    return [];
  }
}

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'event/:id',
    renderMode: RenderMode.Prerender,
    // Domyślnym fallbackiem jest SSR, którego przy outputMode "static" nie mamy.
    fallback: PrerenderFallback.Client,
    getPrerenderParams: getEventPrerenderParams
  },
  {
    /*
     * Wersja angielska jest osobnym wpisem, bo wzorzec "event/:id" dopasowuje się
     * wyłącznie do korzenia. Bez tej trasy /en/event/:id wpadałby pod gwiazdkę,
     * która ma parametr w adresie, ale nie ma skąd wziąć jego wartości - build
     * przerwałby się dopiero na produkcji.
     */
    path: 'en/event/:id',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: getEventPrerenderParams
  },
  {
    // Reszta tras obu drzew jest zdefiniowana wprost w routerze, więc prerender
    // sam je wylicza - łącznie z gałęzią /en.
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
