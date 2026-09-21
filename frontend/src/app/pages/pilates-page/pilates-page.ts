import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, signal, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { isExternalUrl } from '../../core/cta-link';
import { LanguageService } from '../../core/language.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { SurowyTekstPipe, TypografiaPipe } from '../../core/typografia.pipe';
import { PilatesClass } from '../../core/pilates-class';
import { PilatesClassService } from '../../core/pilates-class.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

/*
 * Makieta rozkłada karty na dwa rodzaje tła: zdjęcie z białym napisem i biel
 * z czerwonym. Biały wariant przypada tam na zajęcia numer 3, 4, 5 i 8, a przy
 * większej liczbie zajęć wzór powtarza się od początku - stąd cykl ośmiu pozycji.
 *
 * Wzór jest przypisany do MIEJSCA na liście, nie do zajęć: kolejność w panelu
 * decyduje, które zajęcia wypadną na białym tle.
 */
const BIALE_W_CYKLU = [2, 3, 4, 7];
const DLUGOSC_CYKLU = 8;

@Component({
  selector: 'app-pilates-page',
  imports: [LocalizePathPipe, NgTemplateOutlet, RouterLink, SiteFooter, SiteHeader, TranslatePipe, TypografiaPipe, SurowyTekstPipe],
  templateUrl: './pilates-page.html',
  styleUrl: './pilates-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class PilatesPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly classes = signal<PilatesClass[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly pilatesClassService: PilatesClassService,
    private readonly seoService: SeoService
  ) {}

  /**
   * Czy karta na danym miejscu ma być biała z czerwonym napisem.
   *
   * Zajęcia bez wgranego zdjęcia zawsze idą na białym tle - na miejscu
   * "ze zdjęciem" nie ma czego pokazać, a biały napis na białym tle zniknąłby.
   */
  protected czyBialaKarta(index: number, maZdjecie: boolean): boolean {
    if (!maZdjecie) {
      return true;
    }
    return BIALE_W_CYKLU.includes(index % DLUGOSC_CYKLU);
  }

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.pilates.title'),
      description: this.languageService.translate('seo.pilates.description')
    });

    this.pilatesClassService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (classes) => this.classes.set(classes),
        error: () => this.errorMessage.set(this.languageService.translate('classes.error'))
      });
  }

  protected imageUrl(pilatesClass: PilatesClass) {
    return pilatesClass.image?.thumbnailUrl || pilatesClass.image?.url || '';
  }

  protected signupUrl(pilatesClass?: PilatesClass) {
    return pilatesClass?.signupUrl || '/grafik';
  }

  /** Wybiera wersję redagowaną w panelu; brak tłumaczenia oznacza polski tekst. */
  protected content(polish: string | null | undefined, english: string | null | undefined) {
    return this.languageService.content(polish, english);
  }


  /** Zewnętrzny adres idzie do href, wewnętrzny do routerLink z prefiksem języka. */
  protected isExternalCta(url: string) {
    return isExternalUrl(url);
  }

}
