import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { EventService } from '../../core/event.service';
import { SeoService } from '../../core/seo.service';
import { StudioEvent } from '../../core/studio-event';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { isExternalUrl } from '../../core/cta-link';
import { LanguageService } from '../../core/language.service';

/** Google ucina opisy w okolicach 155-160 znaków. */
const META_DESCRIPTION_MAX_LENGTH = 155;

@Component({
  selector: 'app-event-detail-page',
  imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
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

  private applySeo(event: StudioEvent) {
    this.seoService.set({
      title: `${event.title} | BABA Studio`,
      description: this.metaDescription(event)
    });
  }

  private metaDescription(event: StudioEvent) {
    const summary = event.shortDescription?.trim();
    const fallback = `${event.title} z ${event.hostName} - ${this.dateLine(event)}, godz. ${this.timeLine(event)} w BABA Studio.`;
    const description = summary || fallback;

    if (description.length <= META_DESCRIPTION_MAX_LENGTH) {
      return description;
    }

    const truncated = description.slice(0, META_DESCRIPTION_MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}...`;
  }

  protected dateLine(event: StudioEvent) {
    return new Intl.DateTimeFormat(this.languageService.language() === 'en' ? 'en-GB' : 'pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(event.eventStartAt));
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
