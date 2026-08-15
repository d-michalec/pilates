import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { TRANSLATIONS, TranslationKey } from './translations';

export type Language = 'pl' | 'en';

/** Prefiks angielskiej wersji w adresie: /en/kadra. Polski nie ma prefiksu. */
export const EN_PREFIX = 'en';

/**
 * Adres produkcyjny potrzebny do bezwzględnych odnośników hreflang i canonical.
 * Wyszukiwarki wymagają tu pełnych adresów, względne są ignorowane.
 */
export const SITE_URL = 'https://babapilates.pl';

/**
 * Język wynika wyłącznie z adresu, a nie z zapamiętanego wyboru. Dzięki temu ten sam
 * link zawsze pokazuje tę samą wersję - także komuś, kto dostał go od znajomej.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly currentLanguage = signal<Language>('pl');

  readonly language = this.currentLanguage.asReadonly();
  readonly isEnglish = computed(() => this.currentLanguage() === 'en');

  constructor(
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.applyFromUrl(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.applyFromUrl(event.urlAfterRedirects));
  }

  /**
   * Tłumaczenie dla kodu komponentów. Pipe obsługuje szablony, ale komunikaty
   * ustawiane w TypeScripcie, na przykład błędy formularzy, potrzebują wywołania.
   */
  translate(key: TranslationKey): string {
    const entry = TRANSLATIONS[key];
    if (!entry) {
      return key;
    }

    return this.currentLanguage() === 'en' ? entry.en : entry.pl;
  }

  /**
   * Wybiera wersję treści redagowanej z panelu, z powrotem do polskiego.
   * Brak tłumaczenia jest normalnym stanem - właścicielka uzupełnia je stopniowo,
   * a strona nie może mieć w tym czasie pustych miejsc.
   */
  content(polish: string | null | undefined, english: string | null | undefined): string {
    if (this.currentLanguage() === 'en' && english && english.trim()) {
      return english;
    }

    return polish ?? '';
  }

  /** Dokleja prefiks języka do ścieżki wewnętrznej. Adresy zewnętrzne zostawia w spokoju. */
  localizePath(path: string): string {
    if (!path.startsWith('/')) {
      return path;
    }

    if (this.currentLanguage() === 'pl') {
      return path;
    }

    return path === '/' ? `/${EN_PREFIX}` : `/${EN_PREFIX}${path}`;
  }

  /** Ta sama strona w drugim języku - używane przez przełącznik i znaczniki hreflang. */
  pathInLanguage(language: Language, url = this.router.url): string {
    const withoutQuery = url.split('#')[0].split('?')[0];
    const bare = this.stripPrefix(withoutQuery);

    if (language === 'pl') {
      return bare;
    }

    return bare === '/' ? `/${EN_PREFIX}` : `/${EN_PREFIX}${bare}`;
  }

  private applyFromUrl(url: string) {
    const segments = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    const language: Language = segments[0] === EN_PREFIX ? 'en' : 'pl';

    this.currentLanguage.set(language);

    // Atrybut lang jest sygnałem dla wyszukiwarek i czytników ekranu. Ustawiamy go
    // też podczas renderowania na serwerze - robot czyta właśnie tę wersję HTML.
    this.document.documentElement.lang = language;
    this.setAlternateLinks(url);
  }

  /**
   * Znaczniki hreflang mówią wyszukiwarce, że obie wersje to ta sama strona.
   * Bez nich wersje konkurują ze sobą w wynikach zamiast się uzupełniać.
   */
  private setAlternateLinks(url: string) {
    const head = this.document.head;
    for (const istniejacy of Array.from(head.querySelectorAll('link[rel="alternate"][hreflang]'))) {
      istniejacy.remove();
    }

    const warianty: [string, string][] = [
      ['pl', this.pathInLanguage('pl', url)],
      ['en', this.pathInLanguage('en', url)],
      ['x-default', this.pathInLanguage('pl', url)]
    ];

    for (const [hreflang, sciezka] of warianty) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', `${SITE_URL}${sciezka}`);
      head.appendChild(link);
    }

    // Adres kanoniczny wskazuje na bieżącą wersję językową, nie na polską.
    const biezacy = this.pathInLanguage(this.currentLanguage(), url);
    const canonical =
      head.querySelector('link[rel="canonical"]') ?? head.appendChild(this.document.createElement('link'));
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${SITE_URL}${biezacy}`);
  }

  private stripPrefix(url: string): string {
    if (url === `/${EN_PREFIX}`) {
      return '/';
    }

    return url.startsWith(`/${EN_PREFIX}/`) ? url.slice(EN_PREFIX.length + 1) : url;
  }
}
