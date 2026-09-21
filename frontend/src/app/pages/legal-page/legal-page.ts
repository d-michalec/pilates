import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { LanguageService } from '../../core/language.service';
import { LegalDocument, LegalDocumentKey, LegalSection, splitLegalBody } from '../../core/legal-document';
import { LegalService } from '../../core/legal.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { TypografiaPipe } from '../../core/typografia.pipe';
import { SeoService } from '../../core/seo.service';
import { TranslationKey } from '../../core/translations';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

/**
 * Tytuł zakładki i opis dla wyszukiwarki idą ze słownika, nie z treści z bazy:
 * ustawiamy je od razu z trasy, więc muszą być dostępne przed odpowiedzią
 * backendu. Klucze wypisane wprost, bo `translate` przyjmuje typ zamknięty.
 */
const SEO: Record<LegalDocumentKey, { title: TranslationKey; description: TranslationKey }> = {
	'regulamin': { title: 'seo.terms.title', description: 'seo.terms.description' },
	'polityka-prywatnosci': { title: 'seo.privacy.title', description: 'seo.privacy.description' }
};

/**
 * Jedna strona obsługująca oba dokumenty prawne. Który z nich wyświetlić, mówi
 * `data.dokument` w definicji trasy.
 *
 * Treść przychodzi teraz z bazy, a nie z pliku w kodzie - właścicielka edytuje
 * ją w panelu. Strona ma `ngSkipHydration`, bo prerender nie ma dostępu do
 * backendu; treść dociąga się w przeglądarce, tak jak na pozostałych
 * podstronach opartych o dane z panelu.
 */
@Component({
	selector: 'app-legal-page',
	imports: [LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe, TypografiaPipe],
	templateUrl: './legal-page.html',
	styleUrl: './legal-page.scss',
	host: { ngSkipHydration: 'true' }
})
export class LegalPage implements OnInit {
	private readonly languageService = inject(LanguageService);
	private readonly legalService = inject(LegalService);
	private readonly route = inject(ActivatedRoute);
	private readonly seoService = inject(SeoService);

	protected readonly klucz = signal<LegalDocumentKey>('regulamin');
	protected readonly dokument = signal<LegalDocument | null>(null);
	protected readonly isLoading = signal(true);
	protected readonly errorMessage = signal<string | null>(null);

	/** Tytuł w wersji językowej - potrzebny też w `aria-label` sekcji. */
	protected readonly tytul = computed(() => {
		const dokument = this.dokument();
		return dokument ? this.tekst(dokument.title, dokument.titleEn) : '';
	});

	ngOnInit() {
		const zDanych = this.route.snapshot.data['dokument'] as LegalDocumentKey | undefined;
		if (zDanych) {
			this.klucz.set(zDanych);
		}

		// Tytuł zakładki ustawiamy od razu z trasy, żeby nie mrugał "BABA Studio"
		// do czasu odpowiedzi backendu. Dokumenty prawne są `noindex`, więc
		// wyszukiwarce i tak nie zależy na treści.
		const seo = SEO[this.klucz()];
		this.seoService.set({
			title: this.languageService.translate(seo.title),
			description: this.languageService.translate(seo.description),
			noindex: true
		});

		this.legalService
			.get(this.klucz())
			.pipe(finalize(() => this.isLoading.set(false)))
			.subscribe({
				next: (dokument) => this.dokument.set(dokument),
				error: () => this.errorMessage.set(this.languageService.translate('legal.error'))
			});
	}

	/** Wybiera wersję językową; brak tłumaczenia oznacza tekst polski. */
	protected tekst(polski: string | null | undefined, angielski: string | null | undefined) {
		return this.languageService.content(polski, angielski);
	}

	/** Akapity i listy sekcji w kolejności, w jakiej je wpisano. */
	protected bloki(sekcja: LegalSection) {
		return splitLegalBody(this.tekst(sekcja.body, sekcja.bodyEn));
	}

	protected czyPusta(sekcja: LegalSection) {
		return this.bloki(sekcja).length === 0;
	}

	protected dataAktualizacji() {
		const dokument = this.dokument();
		if (!dokument) {
			return '';
		}

		const jezyk = this.languageService.isEnglish() ? 'en-GB' : 'pl-PL';
		return new Intl.DateTimeFormat(jezyk, {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		}).format(new Date(dokument.updatedAt));
	}
}
