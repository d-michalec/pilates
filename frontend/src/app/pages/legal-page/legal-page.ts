import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LanguageService } from '../../core/language.service';
import { LEGAL_DOCUMENTS, LegalDocument, LegalDocumentKey, LegalSection } from '../../core/legal-documents';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

/**
 * Jedna strona obsługująca oba dokumenty prawne. Który z nich wyświetlić, mówi
 * `data.dokument` w definicji trasy - dzięki temu dołożenie trzeciego dokumentu
 * (na przykład informacji o cookies) to wpis w słowniku i dwie trasy, bez nowego
 * komponentu i bez kopiowania stylów.
 */
@Component({
	selector: 'app-legal-page',
	imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
	templateUrl: './legal-page.html',
	styleUrl: './legal-page.scss',
	host: { ngSkipHydration: 'true' }
})
export class LegalPage implements OnInit {
	private readonly languageService = inject(LanguageService);
	private readonly route = inject(ActivatedRoute);
	private readonly seoService = inject(SeoService);

	protected readonly klucz = signal<LegalDocumentKey>('regulamin');
	protected readonly dokument = computed<LegalDocument>(() => LEGAL_DOCUMENTS[this.klucz()]);

	ngOnInit() {
		const zDanych = this.route.snapshot.data['dokument'] as LegalDocumentKey | undefined;
		if (zDanych && zDanych in LEGAL_DOCUMENTS) {
			this.klucz.set(zDanych);
		}

		const dokument = this.dokument();
		this.seoService.set({
			title: `${this.tekst(dokument.title)} | BABA Studio`,
			description: dokument.intro ? this.tekst(dokument.intro) : this.tekst(dokument.title),
			// Dokumenty prawne nie mają wartości dla wyszukiwarki i potrafią wypychać
			// z wyników strony, które faktycznie chcemy pokazać.
			noindex: true
		});
	}

	/** Wybiera wersję językową pojedynczego napisu. */
	protected tekst(wartosc: { pl: string; en: string }) {
		return this.languageService.isEnglish() ? wartosc.en : wartosc.pl;
	}

	protected czyPusta(sekcja: LegalSection) {
		return !sekcja.paragraphs?.length && !sekcja.bullets?.length;
	}

	protected dataAktualizacji() {
		const jezyk = this.languageService.isEnglish() ? 'en-GB' : 'pl-PL';
		return new Intl.DateTimeFormat(jezyk, {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		}).format(new Date(this.dokument().updated));
	}
}
