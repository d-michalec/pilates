import { Component, OnInit, signal, inject } from '@angular/core';

import { CONTACT_DETAILS } from '../../core/contact-details';
import { ContactPageContent, ContactService } from '../../core/contact.service';
import { LanguageService } from '../../core/language.service';
import { TranslatePipe } from '../../core/localize.pipe';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

/**
 * Strona kontaktu pokazuje wyłącznie dane kontaktowe - formularz jest na stronie
 * głównej, zgodnie z makietą, żeby nie dublować tego samego w dwóch miejscach.
 */
@Component({
  selector: 'app-contact-page',
  imports: [SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss'
})
export class ContactPage implements OnInit {
  protected readonly kontakt = CONTACT_DETAILS;

  private readonly languageService = inject(LanguageService);
  private readonly contactService = inject(ContactService);
  private readonly seoService = inject(SeoService);

  protected readonly page = signal<ContactPageContent | null>(null);

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.contact.title'),
      description: this.languageService.translate('seo.contact.description')
    });

    // Brak zdjęcia nie jest błędem - strona ma wtedy pokazać zastępnik.
    this.contactService.getPage().subscribe({
      next: (page) => this.page.set(page),
      error: () => this.page.set(null)
    });
  }

  protected imageUrl() {
    return this.page()?.image?.url ?? null;
  }

  protected imageAlt() {
    return this.languageService.content(this.page()?.imageAlt, this.page()?.imageAltEn);
  }
}
