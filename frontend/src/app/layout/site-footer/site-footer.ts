import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { CONTACT_DETAILS } from '../../core/contact-details';
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
    consentAccepted: new FormControl(true, {
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
      this.errorMessage.set('Podaj poprawny e-mail.');
      return;
    }

    this.isSubscribing.set(true);
    this.newsletterService
      .subscribe(this.form.getRawValue())
      .pipe(finalize(() => this.isSubscribing.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({ email: '', name: '', consentAccepted: true, website: '' });
          this.successMessage.set('Dziękujemy za zapis.');
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać do newslettera.');
        }
      });
  }
}
