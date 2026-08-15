import { Component, OnInit, computed, signal, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { EventService } from '../../core/event.service';
import { SeoService } from '../../core/seo.service';
import { StudioEvent } from '../../core/studio-event';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-events-page',
  imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class EventsPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly events = signal<StudioEvent[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly upcomingEvents = computed(() => this.events().filter((event) => !this.isPast(event)));
  protected readonly pastEvents = computed(() => this.events().filter((event) => this.isPast(event)).reverse());

  constructor(
    private readonly eventService: EventService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.events.title'),
      description: this.languageService.translate('seo.events.description')
    });

    this.eventService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (events) => this.events.set(events),
        error: () => this.errorMessage.set(this.languageService.translate('events.error'))
      });
  }

  protected eventDate(event: StudioEvent) {
    return new Intl.DateTimeFormat(this.languageService.language() === 'en' ? 'en-GB' : 'pl-PL', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(new Date(event.eventStartAt));
  }

  protected eventTime(event: StudioEvent) {
    return new Intl.DateTimeFormat(this.languageService.language() === 'en' ? 'en-GB' : 'pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(event.eventStartAt));
  }

  protected imageUrl(event: StudioEvent) {
    return event.image.thumbnailUrl || event.image.url;
  }

  private isPast(event: StudioEvent) {
    return new Date(event.eventStartAt).getTime() < Date.now();
  }

  /** Wybiera wersję redagowaną w panelu; brak tłumaczenia oznacza polski tekst. */
  protected content(polish: string | null | undefined, english: string | null | undefined) {
    return this.languageService.content(polish, english);
  }

}
