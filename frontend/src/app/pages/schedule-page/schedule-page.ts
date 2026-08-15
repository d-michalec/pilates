import { AfterViewInit, Component, OnDestroy, OnInit, signal, inject} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { FitsseyWarmupService } from '../../core/fitssey-warmup.service';
import { FITSSEY_SCHEDULE_URL } from '../../core/fitssey-widget.config';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

/**
 * Grafik jest cudzą aplikacją w iframe, więc nie mamy wglądu w jej wewnętrzny stan.
 * Zdarzenie load to najlepszy sygnał, jakim dysponujemy; timeout chroni przed sytuacją,
 * w której nigdy nie dotrze i użytkownik zostałby ze skeletonem na stałe.
 */
const FRAME_FALLBACK_TIMEOUT_MS = 8000;

@Component({
  selector: 'app-schedule-page',
  imports: [SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.scss'
})
export class SchedulePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly languageService = inject(LanguageService);

  protected readonly scheduleUrl: SafeResourceUrl;
  protected readonly isFrameReady = signal(false);
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  private fallbackTimeoutId?: number;

  constructor(
    private readonly fitsseyWarmupService: FitsseyWarmupService,
    private readonly seoService: SeoService,
    sanitizer: DomSanitizer
  ) {
    this.scheduleUrl = sanitizer.bypassSecurityTrustResourceUrl(FITSSEY_SCHEDULE_URL);
  }

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.schedule.title'),
      description: this.languageService.translate('seo.schedule.description')
    });
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') {
      return;
    }

    // Ukryta ramka rozgrzewająca zrobiła swoje - dalej ładuje się już właściwy widok.
    this.fitsseyWarmupService.release();
    this.fallbackTimeoutId = window.setTimeout(() => this.markFrameReady(), FRAME_FALLBACK_TIMEOUT_MS);
  }

  ngOnDestroy() {
    this.clearFallbackTimeout();
  }

  protected onFrameLoad() {
    this.markFrameReady();
  }

  private markFrameReady() {
    this.clearFallbackTimeout();
    this.isFrameReady.set(true);
  }

  private clearFallbackTimeout() {
    if (this.fallbackTimeoutId !== undefined) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = undefined;
    }
  }
}
