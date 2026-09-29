import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ZgodyService } from './zgody.service';

/**
 * PIKSEL META.
 *
 * Kod z dokumentacji Mety wkleja się zwykle wprost do `index.html`. Tutaj tego
 * nie robimy z dwóch powodów:
 *
 *  1. Bez zgody marketingowej skrypt nie może się nawet pobrać, a wpis
 *     w `index.html` ładuje się zawsze i każdemu.
 *  2. Strona jest aplikacją jednostronicową z prerenderem. Przejście z sauny na
 *     grafik nie przeładowuje dokumentu, więc snippet zgłosiłby jedną odsłonę
 *     przy wejściu i zamilkł.
 *
 * Cała reszta aplikacji woła wyłącznie `track()` i nie musi wiedzieć nic
 * o Metcie ani o stanie zgody - bez zgody metoda po prostu nic nie robi.
 */

const ID_PIKSELA = '38596773213302223';
const ADRES_SKRYPTU = 'https://connect.facebook.net/en_US/fbevents.js';

/** Zdarzenia standardowe Mety, których używamy. Nazwy są z ich listy, nie dowolne. */
export type ZdarzenieMety =
	| 'PageView'
	| 'ViewContent'
	| 'InitiateCheckout'
	| 'Contact'
	| 'Lead';

type FunkcjaFbq = ((...argumenty: unknown[]) => void) & {
	callMethod?: (...argumenty: unknown[]) => void;
	queue?: unknown[][];
	push?: unknown;
	loaded?: boolean;
	version?: string;
};

interface OknoZPikselem extends Window {
	fbq?: FunkcjaFbq;
	_fbq?: FunkcjaFbq;
}

@Injectable({
	providedIn: 'root'
})
export class MetaPixelService {
	private readonly dokument = inject(DOCUMENT);
	private readonly router = inject(Router);
	private readonly zgody = inject(ZgodyService);
	private readonly wPrzegladarce = isPlatformBrowser(inject(PLATFORM_ID));

	private zaladowany = false;
	private nasluchUruchomiony = false;

	/**
	 * Adres, dla którego ostatnio zgłosiliśmy odsłonę. Dzięki temu nie ma
	 * znaczenia, czy piksel wystartował przy wejściu na stronę, czy dopiero
	 * po kliknięciu "Akceptuję" na trzeciej podstronie: inicjalizacja zgłasza
	 * bieżącą stronę, a router zgłasza każdą następną, i nic nie liczy się
	 * dwa razy.
	 */
	private ostatniaZgloszonaSciezka: string | null = null;

	constructor() {
		if (!this.wPrzegladarce) {
			return;
		}

		/*
		 * Jedno miejsce reagujące na zmianę zgody - także tę z panelu ustawień
		 * otwartego ze stopki w trakcie wizyty.
		 */
		effect(() => {
			if (this.zgody.marketing()) {
				this.wlacz();
			}
			else {
				this.wylacz();
			}
		});
	}

	/**
	 * Zgłasza zdarzenie. Bez zgody albo przed załadowaniem skryptu nie robi nic -
	 * i tak ma być. Komponenty nie mają sprawdzać zgody przed każdym wywołaniem.
	 */
	track(zdarzenie: ZdarzenieMety, parametry?: Record<string, unknown>) {
		if (!this.wPrzegladarce || !this.zaladowany || !this.zgody.marketing()) {
			return;
		}

		const fbq = (this.dokument.defaultView as OknoZPikselem | null)?.fbq;
		if (!fbq) {
			return;
		}

		if (parametry) {
			fbq('track', zdarzenie, parametry);
		}
		else {
			fbq('track', zdarzenie);
		}
	}

	private wlacz() {
		if (this.zaladowany) {
			return;
		}

		const okno = this.dokument.defaultView as OknoZPikselem | null;
		if (!okno) {
			return;
		}

		const fbq = this.przygotujKolejke(okno);
		this.wstrzyknijSkrypt();

		fbq('init', ID_PIKSELA);
		fbq('consent', 'grant');

		this.zaladowany = true;

		// Odsłona strony, na której piksel właśnie wystartował.
		this.ostatniaZgloszonaSciezka = this.router.url;
		fbq('track', 'PageView');

		this.uruchomNasluchNawigacji();
	}

	/**
	 * Wycofanie zgody. Raz pobranego skryptu nie da się z przeglądarki usunąć,
	 * więc robimy trzy rzeczy, które są w naszym zasięgu: mówimy Metcie, że
	 * zgody nie ma, przestajemy wysyłać cokolwiek i kasujemy pliki, które
	 * zdążyła założyć.
	 */
	private wylacz() {
		if (!this.zaladowany) {
			return;
		}

		const fbq = (this.dokument.defaultView as OknoZPikselem | null)?.fbq;
		fbq?.('consent', 'revoke');

		this.zaladowany = false;
		this.ostatniaZgloszonaSciezka = null;
		this.usunPlikiPiksela();
	}

	/**
	 * Kolejka, do której trafiają wywołania oddane, zanim skrypt się pobierze.
	 * To ten sam mechanizm co w oficjalnym snippecie Mety, tylko zapisany
	 * czytelnie zamiast jednej zminifikowanej linijki.
	 */
	private przygotujKolejke(okno: OknoZPikselem): FunkcjaFbq {
		if (okno.fbq) {
			return okno.fbq;
		}

		const kolejka: unknown[][] = [];
		const fbq = function (this: unknown, ...argumenty: unknown[]) {
			if (fbq.callMethod) {
				fbq.callMethod.apply(fbq, argumenty);
			}
			else {
				kolejka.push(argumenty);
			}
		} as FunkcjaFbq;

		fbq.queue = kolejka;
		fbq.push = fbq;
		fbq.loaded = true;
		fbq.version = '2.0';

		okno.fbq = fbq;
		okno._fbq ??= fbq;

		return fbq;
	}

	private wstrzyknijSkrypt() {
		const juzJest = this.dokument.querySelector(`script[src="${ADRES_SKRYPTU}"]`);
		if (juzJest) {
			return;
		}

		const skrypt = this.dokument.createElement('script');
		skrypt.async = true;
		skrypt.src = ADRES_SKRYPTU;
		this.dokument.head.appendChild(skrypt);
	}

	private uruchomNasluchNawigacji() {
		if (this.nasluchUruchomiony) {
			return;
		}

		this.nasluchUruchomiony = true;

		this.router.events
			.pipe(filter((zdarzenie): zdarzenie is NavigationEnd => zdarzenie instanceof NavigationEnd))
			.subscribe((zdarzenie) => {
				const sciezka = zdarzenie.urlAfterRedirects;

				if (sciezka === this.ostatniaZgloszonaSciezka) {
					return;
				}

				this.ostatniaZgloszonaSciezka = sciezka;
				this.track('PageView');
			});
	}

	/**
	 * `_fbp` i `_fbc` zakłada piksel na naszej domenie. Po wycofaniu zgody nie
	 * mają prawa dalej leżeć w przeglądarce.
	 */
	private usunPlikiPiksela() {
		const wczoraj = 'Thu, 01 Jan 1970 00:00:00 GMT';
		const domena = this.dokument.location?.hostname ?? '';

		for (const nazwa of ['_fbp', '_fbc']) {
			this.dokument.cookie = `${nazwa}=; expires=${wczoraj}; path=/`;

			if (domena) {
				this.dokument.cookie = `${nazwa}=; expires=${wczoraj}; path=/; domain=.${domena}`;
			}
		}
	}
}
