import { Component, Input } from '@angular/core';

/**
 * Warianty kolorystyczne logotypu. Każdy to osobny plik PNG w `public/logo`,
 * bo logo jest znakiem zaprojektowanym dla marki, a nie napisem ustawionym
 * krojem pisma - nie da się go odtworzyć fontem ani przemalować filtrem CSS.
 */
export type BabaLogoVariant = 'white' | 'red' | 'brown' | 'olive' | 'blue';

/** Wymiary pliku źródłowego. Podane w atrybutach, żeby przeglądarka
 *  zarezerwowała proporcje jeszcze przed pobraniem obrazu. */
const SZEROKOSC_PLIKU = 1000;
const WYSOKOSC_PLIKU = 282;

@Component({
  selector: 'app-baba-logo',
  templateUrl: './baba-logo.html',
  styleUrl: './baba-logo.scss'
})
export class BabaLogo {
  @Input({ required: true }) variant!: BabaLogoVariant;

  /**
   * Domyślnie "BABA", więc logo wnosi nazwę marki do drzewa dostępności
   * i do nagłówka `h1`. Puste, gdy ten sam tekst stoi już obok.
   */
  @Input() alt = 'BABA';

  /** Logo w hero jest największym elementem pierwszego ekranu, więc ładuje się pilnie. */
  @Input() priority = false;

  protected readonly width = SZEROKOSC_PLIKU;
  protected readonly height = WYSOKOSC_PLIKU;

  protected get src(): string {
    return `logo/baba-${this.variant}.png`;
  }
}
