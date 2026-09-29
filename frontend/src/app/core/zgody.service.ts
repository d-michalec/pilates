import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

/**
 * ZGODY NA PLIKI COOKIE.
 *
 * Do tej pory strona nie zapisywała niczego do śledzenia i baner nie był
 * potrzebny. Wraz z pikselem Meta staje się obowiązkowy: piksel zakłada
 * w przeglądarce pliki reklamowe, a na to trzeba zgody wyrażonej wcześniej.
 *
 * Kluczowa zasada, wokół której zbudowany jest ten serwis: brak zgody oznacza,
 * że skrypt Mety **nie zostaje w ogóle pobrany**. Nie wystarczy go załadować
 * i nie wysyłać zdarzeń - samo pobranie pliku z serwerów Facebooka jest już
 * kontaktem przeglądarki odwiedzającej z podmiotem trzecim.
 */

/** Kategorie, o które pytamy. Niezbędne nie ma tu wpisu - o nie się nie pyta. */
export interface StanZgod {
	/** Piksel Meta i wszystko, co służy mierzeniu skuteczności reklam. */
	marketing: boolean;
	/** Wersja treści zgody. Zmiana wymusza ponowne zapytanie. */
	wersja: number;
	/** Kiedy wybór został dokonany - do wykazania, że zgoda istniała. */
	data: string;
}

/**
 * Numer podnosimy, gdy dokładamy nową kategorię albo zmieniamy zakres tego,
 * na co ktoś się zgadza. Stara zgoda przestaje wtedy obowiązywać i baner
 * pyta jeszcze raz - bo zgoda dotyczy konkretnej treści, a nie "czegokolwiek
 * w przyszłości".
 */
export const WERSJA_ZGOD = 1;

const KLUCZ_PAMIECI = 'baba-zgody';

@Injectable({
	providedIn: 'root'
})
export class ZgodyService {
	private readonly platforma = inject(PLATFORM_ID);
	private readonly wPrzegladarce = isPlatformBrowser(this.platforma);

	/** `null` znaczy "jeszcze nie zapytaliśmy" - a nie "odmówiono". */
	private readonly stan = signal<StanZgod | null>(null);

	/** Baner otwarty ręcznie ze stopki, mimo zapisanego wcześniej wyboru. */
	private readonly otwartyRecznie = signal(false);

	readonly zapisanyStan = this.stan.asReadonly();

	/** Jedyna rzecz, o którą pyta reszta aplikacji. */
	readonly marketing = computed(() => this.stan()?.marketing === true);

	/**
	 * Baner pokazujemy, dopóki nie ma zapisanego wyboru w bieżącej wersji -
	 * albo gdy ktoś sam poprosił o zmianę zdania.
	 *
	 * Na serwerze zawsze `false`: prerender nie wie, co dana osoba wybrała,
	 * a wstawienie banera do statycznego HTML-a pokazałoby go na ułamek
	 * sekundy także tym, którzy już odpowiedzieli.
	 */
	readonly banerWidoczny = computed(() => {
		if (!this.wPrzegladarce) {
			return false;
		}

		return this.otwartyRecznie() || this.stan() === null;
	});

	constructor() {
		this.stan.set(this.odczytaj());
	}

	/** Przycisk "Akceptuję" - zgoda na wszystko, o co pytamy. */
	zaakceptujWszystko() {
		this.zapisz({ marketing: true });
	}

	/** Przycisk "Odrzucam" - zostają wyłącznie pliki niezbędne. */
	odrzucWszystko() {
		this.zapisz({ marketing: false });
	}

	/** Zapis wyboru z panelu ustawień. */
	zapisz(wybor: { marketing: boolean }) {
		const nowy: StanZgod = {
			marketing: wybor.marketing,
			wersja: WERSJA_ZGOD,
			data: new Date().toISOString()
		};

		this.stan.set(nowy);
		this.otwartyRecznie.set(false);
		this.zachowaj(nowy);
	}

	/**
	 * Otwarcie banera z odnośnika w stopce. Prawo wymaga, żeby wycofanie zgody
	 * było równie łatwe jak jej udzielenie - bez tego cały mechanizm jest wadliwy,
	 * nawet gdy samo pytanie zadano poprawnie.
	 */
	otworzPonownie() {
		this.otwartyRecznie.set(true);
	}

	zamknijBezZmiany() {
		this.otwartyRecznie.set(false);
	}

	private odczytaj(): StanZgod | null {
		if (!this.wPrzegladarce) {
			return null;
		}

		try {
			const zapis = localStorage.getItem(KLUCZ_PAMIECI);
			if (!zapis) {
				return null;
			}

			const odczytany = JSON.parse(zapis) as Partial<StanZgod>;

			// Zgoda w starej wersji nie liczy się jako zgoda na obecny zakres.
			if (odczytany.wersja !== WERSJA_ZGOD || typeof odczytany.marketing !== 'boolean') {
				return null;
			}

			return {
				marketing: odczytany.marketing,
				wersja: WERSJA_ZGOD,
				data: typeof odczytany.data === 'string' ? odczytany.data : new Date().toISOString()
			};
		}
		catch {
			/*
			 * W trybie prywatnym i przy zablokowanych danych witryny samo sięgnięcie
			 * po localStorage potrafi rzucić wyjątkiem. Traktujemy to jak brak
			 * odpowiedzi: zapytamy jeszcze raz, zamiast wysypać stronę.
			 */
			return null;
		}
	}

	private zachowaj(stan: StanZgod) {
		if (!this.wPrzegladarce) {
			return;
		}

		try {
			localStorage.setItem(KLUCZ_PAMIECI, JSON.stringify(stan));
		}
		catch {
			/*
			 * Nie udało się zapamiętać - baner pojawi się przy następnej wizycie.
			 * Uciążliwe, ale bezpieczne: gorzej byłoby uznać zgodę za udzieloną
			 * bez śladu, że kiedykolwiek padła.
			 */
		}
	}
}
