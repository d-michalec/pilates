import { Pipe, PipeTransform } from '@angular/core';

import { tekstSurowy, zlozTekst } from './typografia';

/**
 * Składa tekst wpisany w panelu: 'zapraszamy do studia' | typo sklei "do"
 * z następnym słowem, a tyldę zamieni w spację nierozdzielającą.
 *
 * Potok jest czysty - liczy się tylko przy zmianie tekstu.
 */
@Pipe({ name: 'typo' })
export class TypografiaPipe implements PipeTransform {
  transform(tekst: string | null | undefined): string {
    return zlozTekst(tekst);
  }
}

/**
 * Tekst bez znaczników - do atrybutów, w których skład nie ma znaczenia,
 * a znak, którego nikt nie wpisał, byłby zwykłym błędem: alt zdjęcia,
 * tytuł okna, wartość pola.
 */
@Pipe({ name: 'surowy' })
export class SurowyTekstPipe implements PipeTransform {
  transform(tekst: string | null | undefined): string {
    return tekstSurowy(tekst);
  }
}
