import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, signal, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { isExternalUrl } from '../../core/cta-link';
import { LanguageService } from '../../core/language.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { PilatesClass } from '../../core/pilates-class';
import { PilatesClassService } from '../../core/pilates-class.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

@Component({
  selector: 'app-pilates-page',
  imports: [LocalizePathPipe, NgTemplateOutlet, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
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
