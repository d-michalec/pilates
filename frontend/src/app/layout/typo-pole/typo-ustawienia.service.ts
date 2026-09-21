import { Injectable, signal } from '@angular/core';

/**
 * Wspólne ustawienia podglądu składu w panelu.
 *
 * Podgląd i szerokość ekranu są jednym przełącznikiem dla całego panelu, a nie
 * osobnym przy każdym polu: osoba, która składa tekst, chce widzieć wszystkie
 * pola naraz i w tej samej szerokości, a nie klikać to samo przy każdym polu.
 * Wybór trzyma się do końca sesji.
 */
@Injectable({ providedIn: 'root' })
export class TypoUstawieniaService {
  /** Czy pod polami pokazywać podgląd składu. */
  readonly pokazujPodglad = signal(false);

  /** Szerokość ekranu, dla której liczymy skład (w pikselach). */
  readonly szerokoscEkranu = signal(1708);

  /** Czy zaznaczać spacje nierozdzielające. */
  readonly pokazujTwardeSpacje = signal(true);
}
