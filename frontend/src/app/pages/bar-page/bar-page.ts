import { Component, OnInit, computed, signal, inject} from '@angular/core';
import { finalize } from 'rxjs';

import { SeoService } from '../../core/seo.service';
import { BarContent, BarOpeningDay, formatDayList } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

interface OpeningHoursGroup {
  days: string;
  hours: string;
}

@Component({
  selector: 'app-bar-page',
  imports: [SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './bar-page.html',
  styleUrl: './bar-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class BarPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly bar = signal<BarContent | null>(null);
  protected readonly isLoading = signal(true);

  /**
   * Makieta pokazuje "poniedziałek-piątek: 7:00-21:00", więc kolejne dni o identycznych
   * godzinach scalamy w jeden wiersz. Backend zwraca siedem osobnych dni.
   */
  protected readonly openingHoursGroups = computed<OpeningHoursGroup[]>(() => {
    const hours = this.bar()?.openingHours;
    if (!hours || hours.length === 0) {
      return [];
    }

    const groups: { dayNumbers: number[]; hours: string }[] = [];
    for (const day of hours) {
      const label = this.hoursLabel(day);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.hours === label) {
        lastGroup.dayNumbers.push(day.dayOfWeek);
      }
      else {
        groups.push({ dayNumbers: [day.dayOfWeek], hours: label });
      }
    }

    return groups.map((group) => ({ days: formatDayList(group.dayNumbers), hours: group.hours }));
  });

  constructor(
    private readonly venueService: VenueService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.bar.title'),
      description: this.languageService.translate('seo.bar.description')
    });

    this.venueService
      .getBar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (bar) => this.bar.set(bar),
        error: () => this.bar.set(null)
      });
  }

  protected paragraphs(description: string) {
    return description.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  /** Treści z panelu: wersja angielska, a przy jej braku polska. */
  protected description(content: BarContent) {
    return this.languageService.content(content.description, content.descriptionEn);
  }

  protected imageAlt(content: BarContent) {
    return this.languageService.content(content.imageAlt, content.imageAltEn);
  }

  protected imageUrl(bar: BarContent) {
    return bar.image?.url ?? null;
  }

  private hoursLabel(day: BarOpeningDay) {
    return day.closed ? this.languageService.translate('bar.closed') : `${day.opensAt}-${day.closesAt}`;
  }
}
