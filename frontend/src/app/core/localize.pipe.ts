import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from './language.service';
import { TranslationKey } from './translations';
import { zlozTekst } from './typografia';

/**
 * Dokleja prefiks języka do ścieżki: '/kadra' | localizePath daje '/en/kadra'
 * w wersji angielskiej. Pipe jest nieczysty, bo wynik zależy od aktualnej trasy.
 */
@Pipe({
  name: 'localizePath',
  pure: false
})
export class LocalizePathPipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(path: string): string {
    return this.languageService.localizePath(path);
  }
}

/**
 * Tłumaczy statyczny tekst interfejsu: 'menu.contact' | t daje "Kontakt" albo "Contact".
 * Brakujący klucz zwraca sam klucz, żeby błąd był widoczny, a nie cichy.
 *
 * Wynik idzie jeszcze przez `zlozTekst`, bo to on trafia na ekran: krótkie wyrazy
 * nie kończą wiersza także w tekstach stałych. Kod, który potrzebuje tłumaczenia
 * jako wartości (opisy dla wyszukiwarki w `SeoService`), woła `translate` wprost
 * i dostaje tekst bez spacji nierozdzielających.
 */
@Pipe({
  name: 't',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(key: TranslationKey): string {
    return zlozTekst(this.languageService.translate(key));
  }
}
