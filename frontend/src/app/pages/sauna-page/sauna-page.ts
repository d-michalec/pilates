import { Component, OnInit, signal, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SeoService } from '../../core/seo.service';
import { SaunaContent, SaunaSessionGroup, formatDayList } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-sauna-page',
  imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './sauna-page.html',
  styleUrl: './sauna-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class SaunaPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly sauna = signal<SaunaContent | null>(null);
  protected readonly isLoading = signal(true);

  constructor(
    private readonly venueService: VenueService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.sauna.title'),
      description: this.languageService.translate('seo.sauna.description')
    });

    this.venueService
      .getSauna()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (sauna) => this.sauna.set(sauna),
        error: () => this.sauna.set(null)
      });
  }

  /** Opis przychodzi jako jeden tekst - akapity rozdzielamy pustą linią. */
  protected paragraphs(description: string) {
    return description.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  /** Treści z panelu: wersja angielska, a przy jej braku polska. */
  protected description(content: SaunaContent) {
    return this.languageService.content(content.description, content.descriptionEn);
  }

  protected ctaLabel(content: SaunaContent) {
    return this.languageService.content(content.ctaLabel, content.ctaLabelEn);
  }

  protected imageAlt(content: SaunaContent) {
    return this.languageService.content(content.imageAlt, content.imageAltEn);
  }

  protected dayLabel(group: SaunaSessionGroup) {
    return formatDayList(group.dayNumbers);
  }

  protected isExternalCta(url: string) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  protected imageUrl(sauna: SaunaContent) {
    return sauna.image?.url ?? null;
  }
}
