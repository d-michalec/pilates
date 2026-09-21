import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { NgControl } from '@angular/forms';

import { TWARDA_SPACJA, zlozTekst } from '../../core/typografia';
import { TypoUstawieniaService } from './typo-ustawienia.service';

/** Kawałek podglądu: zwykły tekst albo spacja, której nie wolno złamać. */
interface CzescPodgladu {
  tekst: string;
  twarda: boolean;
}

/** Ekrany, na których warto sprawdzić skład. */
export const SZEROKOSCI_PODGLADU = [
  { px: 390, etykieta: 'telefon' },
  { px: 768, etykieta: 'tablet' },
  { px: 1280, etykieta: 'laptop' },
  { px: 1708, etykieta: 'makieta' }
];

/**
 * Nastawy pola: stopień pisma jako mnożnik `--skala-tekstu` i szerokość kolumny
 * tekstu jako część szerokości okna. Bez nich podgląd pokazywałby złamanie
 * w innym miejscu niż strona.
 */
export interface TypoNastawy {
  mnoznik: number;
  udzial: number;
  pismo: 'serif' | 'sans';
  wersaliki: boolean;
}

export const TYPO_PRESETY: Record<string, TypoNastawy> = {
  /* Tekst ciągły: stopień 14 w kolumnie na ok. 37% szerokości okna. */
  akapit: { mnoznik: 0.583, udzial: 0.373, pismo: 'serif', wersaliki: false },
  /* Imię i nazwisko, tytuł kafelka, nazwa zajęć - stopień 18. */
  nazwa: { mnoznik: 0.77, udzial: 0.3, pismo: 'serif', wersaliki: false },
  /* Nagłówek podstrony - stopień 32 na szerokiej kolumnie. */
  naglowek: { mnoznik: 1.385, udzial: 0.6, pismo: 'serif', wersaliki: false },
  /* Etykieta sekcji i napis na przycisku - bezszeryfowe wersaliki, stopień 13. */
  etykieta: { mnoznik: 0.542, udzial: 0.25, pismo: 'sans', wersaliki: true }
};

@Component({
  selector: 'app-typo-pole',
  templateUrl: './typo-pole.html',
  styleUrl: './typo-pole.scss'
})
export class TypoPole {
  protected readonly ustawienia = inject(TypoUstawieniaService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly szerokosci = SZEROKOSCI_PODGLADU;

  /** Pole, którym się opiekujemy - stąd bierzemy kursor i zaznaczenie. */
  readonly pole = input.required<HTMLInputElement | HTMLTextAreaElement>();

  /** Kontrolka formularza - przez nią zapisujemy zmianę, żeby formularz o niej wiedział. */
  readonly kontrolka = input.required<NgControl>();

  readonly nastawy = input<TypoNastawy>(TYPO_PRESETY['akapit']);

  private readonly wartosc = signal('');

  /**
   * Zmierzone miejsce na podgląd - do przeliczenia skali. Mierzymy element
   * gospodarza, a nie samą scenę podglądu: scena stoi w bloku `@if`, więc
   * zapytanie widoku potrafi trzymać węzeł, którego w dokumencie już nie ma.
   */
  private readonly dostepnaSzerokosc = signal(0);

  /*
   * Szerokość kolumny tekstu. Powyżej 1080 px podstrony trzymają treść w kolumnie
   * o stałym udziale w szerokości okna - tak jak makieta. Niżej przechodzą na
   * jedną kolumnę na niemal całą szerokość (`calc(100% - 40px)` w stylach
   * podstron), więc udział przestaje obowiązywać i liczy się prawie całe okno.
   */
  protected readonly szerokoscTekstu = computed(() => {
    const okno = this.ustawienia.szerokoscEkranu();
    const zUdzialu = okno * this.nastawy().udzial;

    return Math.round(okno >= 1080 ? zUdzialu : Math.max(zUdzialu, okno - 48));
  });

  /*
   * Ten sam wzór, co `--skala-tekstu` w styles.scss: clamp(24px, 2.236vw, 44px)
   * razy mnożnik pola. Zmiennej CSS nie da się tu użyć, bo `vw` liczyłoby się
   * od prawdziwego okna, a nie od szerokości, którą podglądamy.
   */
  protected readonly stopienPisma = computed(() => {
    const podstawa = Math.min(44, Math.max(24, (2.236 * this.ustawienia.szerokoscEkranu()) / 100));

    return Math.round(podstawa * this.nastawy().mnoznik * 100) / 100;
  });

  /** Podgląd składamy w prawdziwej szerokości i dopiero potem zmniejszamy. */
  protected readonly skala = computed(() => {
    const dostepna = this.dostepnaSzerokosc();
    const szerokosc = this.szerokoscTekstu();

    if (dostepna === 0 || szerokosc <= dostepna) {
      return 1;
    }

    return Math.round((dostepna / szerokosc) * 1000) / 1000;
  });

  protected readonly akapity = computed<CzescPodgladu[][]>(() => {
    const zlozony = zlozTekst(this.wartosc());

    if (!zlozony.trim()) {
      return [];
    }

    return zlozony
      .split(/\n\s*\n/)
      .map((akapit) => akapit.trim())
      .filter((akapit) => akapit.length > 0)
      .map((akapit) => this.naCzesci(akapit));
  });

  constructor() {
    // Wartość pola śledzimy przez kontrolkę, bo tylko ona wie o zmianach
    // wprowadzonych z klawiatury, z przycisku i przy wczytaniu danych do edycji.
    effect((onCleanup) => {
      const kontrolka = this.kontrolka().control;

      if (!kontrolka) {
        return;
      }

      this.wartosc.set(String(kontrolka.value ?? ''));
      const subskrypcja = kontrolka.valueChanges.subscribe((nowa) =>
        this.wartosc.set(String(nowa ?? ''))
      );

      onCleanup(() => subskrypcja.unsubscribe());
    });

    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.dostepnaSzerokosc.set(Math.round(element.clientWidth));

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const obserwator = new ResizeObserver(() =>
        this.dostepnaSzerokosc.set(Math.round(element.clientWidth))
      );

      obserwator.observe(element);
      this.destroyRef.onDestroy(() => obserwator.disconnect());
    });
  }

  /**
   * Skleja albo rozdziela dwa wyrazy przy kursorze.
   *
   * Jeden przycisk, a nie dwa: osoba składająca tekst patrzy na jedno miejsce
   * i chce je przestawić, a nie wybierać kierunek. Gdy w zaznaczeniu jest
   * spacja, przycisk działa na całym zaznaczeniu - tak wychodzi szybciej przy
   * dłuższej nazwie, którą trzeba trzymać w jednym wierszu.
   */
  protected przelacz() {
    const pole = this.pole();
    const tekst = pole.value ?? '';

    if (!tekst) {
      return;
    }

    const start = pole.selectionStart ?? tekst.length;
    const koniec = pole.selectionEnd ?? start;
    const zmiana = koniec > start ? this.zamienWZaznaczeniu(tekst, start, koniec) : this.zamienPrzyKursorze(tekst, start);

    if (!zmiana) {
      return;
    }

    const kontrolka = this.kontrolka().control;
    kontrolka?.setValue(zmiana.tekst);
    kontrolka?.markAsDirty();

    // Kursor wraca na miejsce dopiero po tym, jak Angular przepisze wartość do pola.
    requestAnimationFrame(() => {
      pole.focus();
      pole.setSelectionRange(zmiana.kursor, zmiana.kursor);
    });
  }

  private zamienWZaznaczeniu(tekst: string, start: number, koniec: number) {
    const fragment = tekst.slice(start, koniec);

    if (!fragment.includes(' ') && !fragment.includes('~')) {
      return null;
    }

    const zamieniony = fragment.includes('~')
      ? fragment.replace(/~/g, ' ')
      : fragment.replace(/ /g, '~');

    return { tekst: tekst.slice(0, start) + zamieniony + tekst.slice(koniec), kursor: koniec };
  }

  private zamienPrzyKursorze(tekst: string, kursor: number) {
    const przed = tekst[kursor - 1];
    const po = tekst[kursor];
    let miejsce = -1;

    if (przed === ' ' || przed === '~') {
      miejsce = kursor - 1;
    } else if (po === ' ' || po === '~') {
      miejsce = kursor;
    } else {
      // Kursor stoi w środku wyrazu - bierzemy najbliższą przerwę po lewej.
      miejsce = Math.max(tekst.lastIndexOf(' ', kursor - 1), tekst.lastIndexOf('~', kursor - 1));
    }

    if (miejsce < 0) {
      return null;
    }

    const znak = tekst[miejsce] === ' ' ? '~' : ' ';

    return {
      tekst: tekst.slice(0, miejsce) + znak + tekst.slice(miejsce + 1),
      kursor: miejsce + 1
    };
  }

  private naCzesci(akapit: string): CzescPodgladu[] {
    return akapit
      .split(new RegExp(`(${TWARDA_SPACJA})`))
      .filter((czesc) => czesc.length > 0)
      .map((czesc) => ({ tekst: czesc, twarda: czesc === TWARDA_SPACJA }));
  }
}
