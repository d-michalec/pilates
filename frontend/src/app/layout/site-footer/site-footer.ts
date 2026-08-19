import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { CONTACT_DETAILS } from '../../core/contact-details';
import { LanguageService } from '../../core/language.service';
import { NewsletterService } from '../../core/newsletter.service';
import { SiteSettings } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';

/** Makieta używa różnych kolorów stopki na poszczególnych podstronach. */
type FooterTone = 'brown' | 'red' | 'olive';

@Component({
  selector: 'app-site-footer',
  imports: [ButtonModule, InputTextModule, LocalizePathPipe, MessageModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss'
})
export class SiteFooter implements OnInit {
  @Input() tone: FooterTone = 'brown';

  protected readonly kontakt = CONTACT_DETAILS;

  protected readonly settings = signal<SiteSettings | null>(null);
  protected readonly hasSocials = computed(() => {
    const settings = this.settings();
    return Boolean(settings?.instagramUrl || settings?.facebookUrl);
  });

  private readonly venueService = inject(VenueService);
  private readonly languageService = inject(LanguageService);

  protected readonly isSubscribing = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)]
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(128)]
    }),
    // Domyślnie odznaczone. Zgoda zaznaczona z góry nie jest zgodą - musi być
    // świadomym działaniem osoby zapisującej się.
    consentAccepted: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    }),
    website: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)]
    })
  });

  constructor(private readonly newsletterService: NewsletterService) {}

  ngOnInit() {
    // Brak linków to normalny stan, a nie błąd - wtedy po prostu nie pokazujemy ikon.
    this.venueService.getSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => this.settings.set(null)
    });
  }

  protected submit() {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Rozróżniamy powody, bo "podaj poprawny e-mail" przy poprawnym adresie
      // i niezaznaczonej zgodzie wysyłałoby ludzi w złą stronę.
      this.errorMessage.set(
        this.form.controls.consentAccepted.invalid
          ? this.languageService.translate('consent.required')
          : this.languageService.translate('newsletter.invalid')
      );
      return;
    }

    this.isSubscribing.set(true);
    this.newsletterService
      .subscribe(this.form.getRawValue())
      .pipe(finalize(() => this.isSubscribing.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({ email: '', name: '', consentAccepted: false, website: '' });
          this.successMessage.set('Dziękujemy za zapis.');
        },
        error: (error) => {
          this.errorMessage.set(this.languageService.formError(error, 'newsletter.failure'));
        }
      });
  }
}
