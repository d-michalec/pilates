import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { LegalDocument, LegalDocumentKey, LegalDocumentSummary } from '../../core/legal-document';
import { LegalService } from '../../core/legal.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';
import { TypoPoleDirective } from '../../layout/typo-pole/typo-pole.directive';

/** Podpisy zakładek. Kluczy są dwa i nie przewidujemy trzeciego bez migracji. */
const DOKUMENTY: { key: LegalDocumentKey; label: string; preview: string }[] = [
	{ key: 'regulamin', label: 'Regulamin', preview: '/regulamin' },
	{ key: 'polityka-prywatnosci', label: 'Polityka prywatności', preview: '/polityka-prywatnosci' }
];

type SekcjaForm = FormGroup<{
	heading: FormControl<string>;
	headingEn: FormControl<string>;
	body: FormControl<string>;
	bodyEn: FormControl<string>;
	needsContent: FormControl<boolean>;
}>;

/**
 * Edycja regulaminu i polityki prywatności.
 *
 * Dokument zapisuje się jako całość - nagłówek razem z pełną listą sekcji -
 * bo przy dokumencie prawnym nikt nie zmienia jednego punktu w oderwaniu od
 * reszty. Każdy zapis backend odkłada w tabeli rewizji, więc poprzednie wersje
 * nie przepadają.
 */
@Component({
	selector: 'app-admin-legal-page',
	imports: [
		AdminHeader,
		ButtonModule,
		CardModule,
		CheckboxModule,
		InputTextModule,
		MessageModule,
		ReactiveFormsModule,
		TextareaModule
	, TypoPoleDirective],
	templateUrl: './admin-legal-page.html',
	styleUrl: './admin-legal-page.scss'
})
export class AdminLegalPage implements OnInit {
	protected readonly dokumenty = DOKUMENTY;

	protected readonly summaries = signal<LegalDocumentSummary[]>([]);
	protected readonly activeKey = signal<LegalDocumentKey>('regulamin');
	protected readonly isLoading = signal(true);
	protected readonly isSaving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly successMessage = signal<string | null>(null);

	protected readonly activeLabel = computed(
		() => DOKUMENTY.find((dokument) => dokument.key === this.activeKey())?.label ?? ''
	);
	protected readonly activePreview = computed(
		() => DOKUMENTY.find((dokument) => dokument.key === this.activeKey())?.preview ?? '/'
	);

	/** Data ostatniego zapisu - przy dokumencie prawnym to nie ozdoba. */
	protected readonly lastUpdate = computed(() => {
		const summary = this.summaries().find((pozycja) => pozycja.docKey === this.activeKey());
		if (!summary) {
			return null;
		}

		return new Intl.DateTimeFormat('pl-PL', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(summary.updatedAt));
	});

	protected readonly form = new FormGroup({
		title: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.maxLength(200)]
		}),
		titleEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
		intro: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
		introEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
		sections: new FormArray<SekcjaForm>([])
	});

	/** Ile sekcji nadal czeka na treść - właścicielka widzi to od razu u góry. */
	protected readonly pendingSections = computed(() => this.sectionsSnapshot().filter((sekcja) => sekcja.pending).length);

	/**
	 * Formularze nie są sygnałami, więc licznik sekcji do uzupełnienia nie
	 * odświeżałby się przy pisaniu. Ten sygnał trzyma kopię stanu i jest
	 * aktualizowany przez `valueChanges`.
	 */
	private readonly sectionsSnapshot = signal<{ pending: boolean }[]>([]);

	private readonly legalService = inject(LegalService);

	ngOnInit() {
		this.form.controls.sections.valueChanges.subscribe(() => this.refreshSnapshot());
		this.loadSummaries();
		this.loadDocument(this.activeKey());
	}

	protected get sections(): FormArray<SekcjaForm> {
		return this.form.controls.sections;
	}

	protected selectDocument(key: LegalDocumentKey) {
		if (key === this.activeKey()) {
			return;
		}

		this.activeKey.set(key);
		this.loadDocument(key);
	}

	protected addSection() {
		this.clearMessages();
		this.sections.push(this.buildSection());
		this.form.markAsDirty();
	}

	/*
	 * Ostatniej sekcji nie da się usunąć. Backend odrzuca dokument bez sekcji
	 * (zapis pustej listy kasował wcześniej całą treść i zwracał 200), więc
	 * lepiej zablokować to w panelu niż pokazywać błąd po kliknięciu.
	 */
	protected canRemoveSection() {
		return this.sections.length > 1;
	}

	protected removeSection(index: number) {
		if (!this.canRemoveSection()) {
			return;
		}

		this.clearMessages();
		this.sections.removeAt(index);
		this.form.markAsDirty();
	}

	/** Przesuwa sekcję o jedno miejsce; kolejność na liście to kolejność na stronie. */
	protected moveSection(index: number, offset: number) {
		const target = index + offset;
		if (target < 0 || target >= this.sections.length) {
			return;
		}

		this.clearMessages();
		const sekcja = this.sections.at(index);
		this.sections.removeAt(index);
		this.sections.insert(target, sekcja);
		this.form.markAsDirty();
	}

	protected submit() {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.clearMessages();
		this.isSaving.set(true);

		const wartosci = this.form.getRawValue();

		this.legalService
			.update(this.activeKey(), {
				title: wartosci.title,
				titleEn: wartosci.titleEn,
				intro: wartosci.intro,
				introEn: wartosci.introEn,
				sections: wartosci.sections
			})
			.pipe(finalize(() => this.isSaving.set(false)))
			.subscribe({
				next: (dokument) => {
					this.fillForm(dokument);
					this.successMessage.set('Zapisano. Ta wersja dokumentu została odłożona w historii zmian.');
					this.loadSummaries();
				},
				error: () => this.errorMessage.set('Nie udało się zapisać dokumentu. Spróbuj ponownie.')
			});
	}

	private loadSummaries() {
		this.legalService.list().subscribe({
			next: (summaries) => this.summaries.set(summaries),
			// Lista to tylko data ostatniego zapisu u góry - jej brak nie blokuje edycji.
			error: () => this.summaries.set([])
		});
	}

	private loadDocument(key: LegalDocumentKey) {
		this.clearMessages();
		this.isLoading.set(true);

		this.legalService
			.get(key)
			.pipe(finalize(() => this.isLoading.set(false)))
			.subscribe({
				next: (dokument) => this.fillForm(dokument),
				error: () => this.errorMessage.set('Nie udało się pobrać dokumentu.')
			});
	}

	private fillForm(dokument: LegalDocument) {
		this.sections.clear();

		for (const sekcja of dokument.sections) {
			this.sections.push(
				this.buildSection({
					heading: sekcja.heading ?? '',
					headingEn: sekcja.headingEn ?? '',
					body: sekcja.body,
					bodyEn: sekcja.bodyEn ?? '',
					needsContent: sekcja.needsContent
				})
			);
		}

		this.form.patchValue({
			title: dokument.title,
			titleEn: dokument.titleEn ?? '',
			intro: dokument.intro ?? '',
			introEn: dokument.introEn ?? ''
		});

		this.form.markAsPristine();
		this.refreshSnapshot();
	}

	private buildSection(wartosci?: {
		heading: string;
		headingEn: string;
		body: string;
		bodyEn: string;
		needsContent: boolean;
	}): SekcjaForm {
		return new FormGroup({
			heading: new FormControl(wartosci?.heading ?? '', {
				nonNullable: true,
				validators: [Validators.maxLength(300)]
			}),
			headingEn: new FormControl(wartosci?.headingEn ?? '', {
				nonNullable: true,
				validators: [Validators.maxLength(300)]
			}),
			body: new FormControl(wartosci?.body ?? '', {
				nonNullable: true,
				validators: [Validators.maxLength(20000)]
			}),
			bodyEn: new FormControl(wartosci?.bodyEn ?? '', {
				nonNullable: true,
				validators: [Validators.maxLength(20000)]
			}),
			needsContent: new FormControl(wartosci?.needsContent ?? false, { nonNullable: true })
		});
	}

	private refreshSnapshot() {
		this.sectionsSnapshot.set(
			this.sections.controls.map((sekcja) => ({ pending: sekcja.controls.needsContent.value }))
		);
	}

	private clearMessages() {
		this.errorMessage.set(null);
		this.successMessage.set(null);
	}
}
