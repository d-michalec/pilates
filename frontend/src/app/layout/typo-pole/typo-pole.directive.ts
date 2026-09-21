import { Directive, ElementRef, OnInit, ViewContainerRef, effect, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

import { TYPO_PRESETY, TypoNastawy, TypoPole } from './typo-pole';

/**
 * Dopina do pola tekstowego w panelu pasek narzędzi składu i podgląd.
 *
 * Dyrektywa, a nie osobny komponent w szablonie: dzięki temu przy polu wystarczy
 * dopisać jedno słowo, nie trzeba przebudowywać formularzy ani powtarzać przy
 * każdym polu referencji i kontrolki. Komponent dostawiamy pod polem sami.
 *
 *   <input pInputText formControlName="fullName" appTypo="nazwa" />
 *   <textarea pTextarea formControlName="description" appTypo></textarea>
 *
 * Nazwa nastawy mówi, jak tekst wygląda na stronie (stopień pisma i szerokość
 * kolumny) - bez tego podgląd łamałby wiersze w innych miejscach niż strona.
 * Gdy strona odbiega od gotowych nastaw, można podać własne: `[typoMnoznik]`
 * to mnożnik `--skala-tekstu`, `[typoUdzial]` część szerokości okna.
 */
@Directive({ selector: '[appTypo]' })
export class TypoPoleDirective implements OnInit {
  private readonly element: ElementRef<HTMLInputElement | HTMLTextAreaElement> = inject(ElementRef);
  private readonly kontener = inject(ViewContainerRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  readonly appTypo = input<string>('');
  readonly typoMnoznik = input<number | null>(null);
  readonly typoUdzial = input<number | null>(null);
  readonly typoPismo = input<'serif' | 'sans' | null>(null);
  readonly typoWersaliki = input<boolean | null>(null);

  ngOnInit() {
    /*
     * Bez kontrolki formularza nie ma czego śledzić ani gdzie zapisać sklejenia,
     * więc pole zostaje takie, jakie było - lepiej niż pasek, który nic nie robi.
     */
    if (!this.ngControl) {
      return;
    }

    const komponent = this.kontener.createComponent(TypoPole);
    komponent.setInput('pole', this.element.nativeElement);
    komponent.setInput('kontrolka', this.ngControl);

    effect(
      () => komponent.setInput('nastawy', this.nastawy()),
      { injector: komponent.injector }
    );
  }

  private nastawy(): TypoNastawy {
    const podstawa = TYPO_PRESETY[this.appTypo()] ?? TYPO_PRESETY['akapit'];

    return {
      mnoznik: this.typoMnoznik() ?? podstawa.mnoznik,
      udzial: this.typoUdzial() ?? podstawa.udzial,
      pismo: this.typoPismo() ?? podstawa.pismo,
      wersaliki: this.typoWersaliki() ?? podstawa.wersaliki
    };
  }
}
