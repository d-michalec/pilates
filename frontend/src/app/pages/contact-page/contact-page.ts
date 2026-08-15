import { Component, OnInit, signal, inject} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { CONTACT_DETAILS } from '../../core/contact-details';
import { ContactService } from '../../core/contact.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-contact-page',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule, SiteFooter, SiteHeader, TextareaModule, TranslatePipe],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss'
})
export class ContactPage implements OnInit {
  protected readonly kontakt = CONTACT_DETAILS;

  private readonly languageService = inject(LanguageService);

  protected readonly isSending = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)]
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(60)]
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(160)]
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3000)]
    }),
    website: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)]
    })
  });

  constructor(
    private readonly contactService: ContactService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.contact.title'),
      description: this.languageService.translate('seo.contact.description')
    });
  }

  protected submit() {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij wymagane pola i podaj poprawny e-mail.');
      return;
    }

    this.isSending.set(true);
    this.contactService
      .send(this.form.getRawValue())
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: () => {
          this.form.reset();
          this.successMessage.set('Dziękujemy za wiadomość. Odezwemy się tak szybko, jak to możliwe.');
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'Nie udało się wysłać wiadomości. Spróbuj ponownie.');
        }
      });
  }
}
