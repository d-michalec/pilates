import { Component, OnInit, signal, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FaqEntry } from '../../core/faq';
import { FaqService } from '../../core/faq.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-faq-page',
  imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './faq-page.html',
  styleUrl: './faq-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class FaqPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly faqItems = signal<FaqEntry[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly faqService: FaqService,
    private readonly seoService: SeoService
  ) {}

  /** Treści z panelu: wersja angielska, a przy jej braku polska. */
  protected question(item: FaqEntry) {
    return this.languageService.content(item.question, item.questionEn);
  }

  protected answer(item: FaqEntry) {
    return this.languageService.content(item.answer, item.answerEn);
  }

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.faq.title'),
      description: this.languageService.translate('seo.faq.description')
    });

    this.faqService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => this.faqItems.set(items),
        error: () => this.errorMessage.set(this.languageService.translate('faq.error'))
      });
  }
}
