import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoConfig {
  title: string;
  description: string;
  /**
   * Wyłącza stronę z wyników wyszukiwania. Używamy tego dla dokumentów prawnych:
   * nie mają wartości dla szukających, a potrafią wypychać z wyników podstrony,
   * które faktycznie chcemy pokazać.
   */
  noindex?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  set(config: SeoConfig) {
    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Znacznik trzeba nie tylko ustawiać, ale i zdejmować. Serwis jest wspólny dla
    // całej aplikacji, więc bez usuwania noindex zostałby po przejściu z regulaminu
    // na dowolną inną stronę - a przy nawigacji po stronie klienta robot mógłby
    // zobaczyć zakaz indeksowania na stronie, która ma być widoczna.
    if (config.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    } else {
      this.meta.removeTag("name='robots'");
    }
  }
}
