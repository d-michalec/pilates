import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { EventService } from '../../core/event.service';
import { SeoService } from '../../core/seo.service';
import { StudioEvent } from '../../core/studio-event';
import { plainEventTitle, splitEventTitle } from '../../core/event-title';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { SurowyTekstPipe, TypografiaPipe } from '../../core/typografia.pipe';
import { isExternalUrl } from '../../core/cta-link';
import { LanguageService } from '../../core/language.service';

/** Google ucina opisy w okolicach 155-160 znaków. */
const META_DESCRIPTION_MAX_LENGTH = 155;

@Component({
  selector: 'app-event-detail-page',
  imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe, TypografiaPipe, SurowyTekstPipe],
  templateUrl: './event-detail-page.html',
  styleUrl: './event-detail-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class EventDetailPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly event = signal<StudioEvent | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(switchMap((params) => this.eventService.get(params.get('id') ?? '')))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.isLoading.set(false);
          this.applySeo(event);
        },
        error: () => {
          this.errorMessage.set(this.languageService.translate('event.notFound'));
          this.isLoading.set(false);
          this.seoService.set({
            title: 'Wydarzenie | BABA Studio',
            description: 'Szczegóły wydarzenia w BABA Studio w Łodzi.'
          });
        }
      });
  }

  /*
   * Nazwa bez znaczników - do atrybutu alt, tytułu dokumentu i opisu dla
   * wyszukiwarek. Sama nazwa w nagłówku idzie kawałkami przez `titleParts`,
   * bo w makiecie część słów jest błękitna.
   */
  protected plainTitle(event: StudioEvent) {
    return plainEventTitle(this.content(event.title, event.titleEn));
  }

  private applySeo(event: StudioEvent) {
    this.seoService.set({
      // Wersja językowa jak w nagłówku strony - inaczej na /en tytuł dokumentu
      // zostawał polski.
      title: `${this.plainTitle(event)} | BABA Studio`,
      description: this.metaDescription(event)
    });
  }

  private metaDescription(event: StudioEvent) {
    // Wersja językowa jak w treści strony - inaczej na /en opis dla
    // wyszukiwarek zostawał polski, choć tytuł dokumentu był już angielski.
    const summary = this.content(event.shortDescription, event.shortDescriptionEn)?.trim();
    const fallback = `${this.plainTitle(event)} z ${event.hostName} - ${this.dateLine(event)}, godz. ${this.timeLine(event)} w BABA Studio.`;
    const description = summary || fallback;

    if (description.length <= META_DESCRIPTION_MAX_LENGTH) {
      return description;
    }

    const truncated = description.slice(0, META_DESCRIPTION_MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}...`;
  }

  /*
   * Makieta rozbija termin w nagłówku na trzy wiersze: dzień tygodnia, datę
   * i godzinę. Wcześniej `dateLine` sklejał dzień tygodnia z datą w jeden
   * wiersz, bo tak formatuje `Intl` z `weekday: 'long'`.
   */
  protected weekdayLine(event: StudioEvent) {
    return this.formatDate(event, { weekday: 'long' });
  }

  protected dayLine(event: StudioEvent) {
    return this.formatDate(event, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Makieta: w informacjach pod spodem data idzie przed dniem tygodnia. */
  protected factDateLine(event: StudioEvent) {
    return `${this.dayLine(event)}, ${this.weekdayLine(event)}`;
  }

  protected dateLine(event: StudioEvent) {
    return this.formatDate(event, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  private formatDate(event: StudioEvent, options: Intl.DateTimeFormatOptions) {
    const locale = this.languageService.language() === 'en' ? 'en-GB' : 'pl-PL';
    return new Intl.DateTimeFormat(locale, options).format(new Date(event.eventStartAt));
  }

  /** Kawałki nazwy razem z informacją, które są błękitne - patrz core/event-title.ts. */
  protected titleParts(event: StudioEvent) {
    return splitEventTitle(this.content(event.title, event.titleEn));
  }

  /** Opis przychodzi jako jeden tekst - akapity rozdzielamy pustą linią. */
  protected paragraphs(text: string | null | undefined) {
    return (text ?? '').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  /** Bez opisu prowadzącej zostaje krótki opis wydarzenia - tak było dotąd. */
  protected hostText(event: StudioEvent) {
    return (
      this.content(event.hostDescription, event.hostDescriptionEn) ||
      this.content(event.shortDescription, event.shortDescriptionEn)
    );
  }

  protected timeLine(event: StudioEvent) {
    return new Intl.DateTimeFormat(this.languageService.language() === 'en' ? 'en-GB' : 'pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(event.eventStartAt));
  }

  protected signupUrl(event: StudioEvent) {
    return event.signupUrl || '/grafik';
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
