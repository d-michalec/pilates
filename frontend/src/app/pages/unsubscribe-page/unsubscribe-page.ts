import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { LanguageService } from '../../core/language.service';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { NewsletterService } from '../../core/newsletter.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';

/**
 * Rezygnacja z newslettera.
 *
 * Wypis następuje dopiero po kliknięciu przycisku, a nie od razu po wejściu na
 * stronę. Skanery bezpieczeństwa w poczcie i podglądy odnośników otwierają adresy
 * z wiadomości same, bez udziału odbiorcy - gdyby samo wejście kasowało zapis,
 * część osób wypisywałaby się bez swojej wiedzy.
 */
@Component({
	selector: 'app-unsubscribe-page',
	imports: [ButtonModule, LocalizePathPipe, RouterLink, SiteFooter, SiteHeader, TranslatePipe],
	templateUrl: './unsubscribe-page.html',
	styleUrl: './unsubscribe-page.scss',
	host: { ngSkipHydration: 'true' }
})
export class UnsubscribePage implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly newsletterService = inject(NewsletterService);
	private readonly languageService = inject(LanguageService);
	private readonly seoService = inject(SeoService);

	protected readonly token = signal<string | null>(null);
	protected readonly isSending = signal(false);
	protected readonly isDone = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	ngOnInit() {
		this.seoService.set({
			title: `${this.languageService.translate('unsubscribe.title')} | BABA Studio`,
			description: this.languageService.translate('unsubscribe.lead'),
			noindex: true
		});

		const token = this.route.snapshot.queryParamMap.get('token');
		this.token.set(token && token.trim() ? token.trim() : null);
	}

	protected confirm() {
		const token = this.token();
		if (!token) {
			return;
		}

		this.errorMessage.set(null);
		this.isSending.set(true);

		this.newsletterService
			.unsubscribe(token)
			.pipe(finalize(() => this.isSending.set(false)))
			.subscribe({
				next: () => this.isDone.set(true),
				error: (error) => this.errorMessage.set(this.languageService.formError(error, 'unsubscribe.failure'))
			});
	}
}
