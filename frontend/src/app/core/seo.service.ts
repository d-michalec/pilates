import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { SITE_URL } from './language.service';
import { localBusinessJsonLd } from './local-business';

/** Identyfikator znacznika z danymi strukturalnymi - żeby dało się go podmieniać, a nie mnożyć. */
const JSON_LD_ID = 'baba-json-ld';

interface SeoConfig {
  title: string;
  description: string;
  /**
   * Wyłącza stronę z wyników wyszukiwania. Używamy tego dla dokumentów prawnych:
   * nie mają wartości dla szukających, a potrafią wypychać z wyników podstrony,
   * które faktycznie chcemy pokazać.
   */
  noindex?: boolean;
  /**
   * Dane strukturalne studia. Wstawiamy je wyłącznie na stronie głównej i kontakcie -
   * powtórzone na każdej podstronie nie dają nic więcej, a mnożą miejsca, w których
   * adres może się rozjechać z rzeczywistością.
   */
  localBusiness?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly document = inject(DOCUMENT);

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
    this.meta.updateTag({ property: 'og:site_name', content: 'BABA Studio' });

    // Podgląd linku na Facebooku, WhatsAppie czy Messengerze. Bez tego udostępniony
    // adres pokazuje się jako goły tekst i klika w niego znacznie mniej osób.
    this.meta.updateTag({ property: 'og:image', content: `${SITE_URL}/og-image.jpg` });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.setJsonLd(config.localBusiness === true);

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

  /**
   * Dane strukturalne wstawiamy jako pojedynczy znacznik o stałym identyfikatorze.
   * Bez tego przy przechodzeniu między stronami po stronie klienta dokładałby się
   * kolejny skrypt przy każdej nawigacji, a strona z pięcioma opisami tej samej
   * firmy wygląda dla wyszukiwarki podejrzanie.
   */
  private setJsonLd(wstawic: boolean) {
    const istniejacy = this.document.getElementById(JSON_LD_ID);

    if (!wstawic) {
      istniejacy?.remove();
      return;
    }

    const skrypt = istniejacy ?? this.document.createElement('script');
    skrypt.id = JSON_LD_ID;
    skrypt.setAttribute('type', 'application/ld+json');
    skrypt.textContent = localBusinessJsonLd();

    if (!istniejacy) {
      this.document.head.appendChild(skrypt);
    }
  }
}
