import { Component, HostListener, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FitsseyWarmupService } from '../../core/fitssey-warmup.service';
import { LanguageService } from '../../core/language.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';

type HeaderTone = 'light' | 'red' | 'brown';

@Component({
  selector: 'app-site-header',
  imports: [LocalizePathPipe, RouterLink, TranslatePipe],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss'
})
export class SiteHeader {
  @Input() tone: HeaderTone = 'red';
  @Input() floating = false;

  protected readonly isMenuOpen = signal(false);

  private readonly fitsseyWarmupService = inject(FitsseyWarmupService);
  private readonly languageService = inject(LanguageService);

  protected readonly otherLanguage = computed(() => (this.languageService.isEnglish() ? 'pl' : 'en'));
  /** Ten sam widok w drugim języku, żeby przełącznik nie wyrzucał na stronę główną. */
  protected readonly otherLanguagePath = computed(() =>
    this.languageService.pathInLanguage(this.otherLanguage())
  );

  protected toggleMenu() {
    this.isMenuOpen.update((isOpen) => !isOpen);

    // Otwarcie menu to najwcześniejszy moment, w którym wiadomo, że użytkownik może
    // wejść w grafik. Zaczynamy wtedy rozgrzewać połączenie z Fitssey.
    if (this.isMenuOpen()) {
      this.warmSchedule();
    }
  }

  protected warmSchedule() {
    this.fitsseyWarmupService.warm();
  }

  protected closeMenu() {
    this.isMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeMenuOnEscape() {
    this.closeMenu();
  }
}
