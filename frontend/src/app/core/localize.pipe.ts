import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from './language.service';
import { TranslationKey } from './translations';

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
 */
@Pipe({
  name: 't',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(key: TranslationKey): string {
    return this.languageService.translate(key);
  }
}
