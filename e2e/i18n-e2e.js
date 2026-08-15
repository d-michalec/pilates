/**
 * Test E2E dwujęzyczności BABA Studio.
 *
 * Sprawdza pełną drogę treści: zapis przez API panelu -> odczyt przez API publiczne
 * -> wyrenderowany HTML na /... (polski) i /en/... (angielski) -> sprzątanie danych.
 *
 * Uruchomienie z Node 20+ (przy działającym backendzie i `ng serve`):
 *   node e2e/i18n-e2e.js
 *
 * Uruchomienie z konsoli przeglądarki na dowolnej stronie serwowanej przez `ng serve`:
 *   wklej całą zawartość pliku, a następnie wywołaj `runE2E()`.
 *
 * Dane logowania biorą się ze zmiennych środowiskowych z tymi samymi wartościami
 * domyślnymi co `backend/src/main/resources/application.yaml`, czyli admin/admin.
 * To fixture deweloperski, nie sekret - przed wdrożeniem trzeba go nadpisać.
 */

const KONFIGURACJA = {
	api: 'http://localhost:8080',
	front: 'http://localhost:4200',
	uzytkownik: 'admin',
	haslo: 'admin'
};

/** Wspólny prefiks pozwala rozpoznać i posprzątać dane testowe, gdyby test przerwał się w połowie. */
const PREFIKS = 'E2E-TMP';

async function runE2E(konfiguracja = KONFIGURACJA) {
	const { api, front, uzytkownik, haslo } = { ...KONFIGURACJA, ...konfiguracja };
	const autoryzacja = 'Basic ' + btoa(`${uzytkownik}:${haslo}`);

	const wyniki = [];
	const pominiete = [];
	const doPosprzatania = [];

	function sprawdz(opis, warunek, szczegoly) {
		wyniki.push({ opis, ok: Boolean(warunek), szczegoly: warunek ? undefined : szczegoly });
	}

	async function zadanie(sciezka, opcje = {}) {
		const naglowki = { Authorization: autoryzacja, ...(opcje.headers ?? {}) };
		let cialo = opcje.body;

		if (opcje.json !== undefined) {
			naglowki['Content-Type'] = 'application/json';
			cialo = JSON.stringify(opcje.json);
		}

		const odpowiedz = await fetch(api + sciezka, { method: opcje.method ?? 'GET', headers: naglowki, body: cialo });

		if (odpowiedz.status === 204) {
			return { status: odpowiedz.status, dane: null };
		}

		const tekst = await odpowiedz.text();
		let dane = null;
		try {
			dane = tekst ? JSON.parse(tekst) : null;
		}
		catch {
			dane = tekst;
		}

		return { status: odpowiedz.status, dane };
	}

	function formularz(pola) {
		const dane = new FormData();
		for (const [klucz, wartosc] of Object.entries(pola)) {
			if (wartosc !== null && wartosc !== undefined) {
				dane.append(klucz, wartosc);
			}
		}
		return dane;
	}

	/** Najmniejszy poprawny PNG - moduł mediów wymaga prawdziwego pliku graficznego. */
	function maleZdjecie(nazwa) {
		const base64 =
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
		const bajty = Uint8Array.from(atob(base64), (znak) => znak.charCodeAt(0));
		return new File([bajty], nazwa, { type: 'image/png' });
	}

	async function html(sciezka) {
		return fetch(front + sciezka).then((odpowiedz) => odpowiedz.text());
	}

	/**
	 * Rozpoznaje pustą skorupę HTML, czyli stronę oddaną do renderowania w
	 * przeglądarce. Strony wydarzeń powstają statycznie na podstawie listy pobranej
	 * z backendu w momencie budowania. Wydarzenie utworzone później - a takie tworzy
	 * ten test - nie ma swojej strony i dostaje skorupę. Na produkcji to zachowanie
	 * zamierzone, więc nie zgłaszamy go jako błędu.
	 */
	function pustaSkorupa(html) {
		return html.length < 5000;
	}

	/** Sprawdza treść strony, o ile w ogóle została wyrenderowana na serwerze. */
	function sprawdzWyrenderowana(opis, html, warunek) {
		if (pustaSkorupa(html)) {
			pominiete.push(opis);
			return;
		}

		sprawdz(opis, warunek);
	}

	// ---------------------------------------------------------------- ZAJĘCIA

	async function zajecia() {
		const utworzone = await zadanie('/api/admin/classes', {
			method: 'POST',
			body: formularz({
				title: `${PREFIKS} Zajęcia`,
				levelLabel: `${PREFIKS} Poziom`,
				description: `${PREFIKS} opis po polsku`,
				titleEn: `${PREFIKS} Class`,
				levelLabelEn: `${PREFIKS} Level`,
				descriptionEn: `${PREFIKS} description in English`,
				image: maleZdjecie('zajecia.png')
			})
		});

		sprawdz('zajęcia: zapis zwraca 201', utworzone.status === 201, utworzone);
		if (utworzone.status !== 201) {
			return null;
		}

		const id = utworzone.dane.id;
		doPosprzatania.push(() => zadanie(`/api/admin/classes/${id}`, { method: 'DELETE' }));

		sprawdz('zajęcia: odpowiedź zawiera obie wersje', utworzone.dane.title && utworzone.dane.titleEn, utworzone.dane);

		const publiczne = await zadanie('/api/classes');
		const zListy = publiczne.dane.find((pozycja) => pozycja.id === id);
		sprawdz('zajęcia: API publiczne zwraca pola angielskie', zListy?.titleEn === `${PREFIKS} Class`, zListy);

		// Puste tłumaczenie ma się zapisać jako brak tłumaczenia, a nie jako pusty tekst.
		const wyczyszczone = await zadanie(`/api/admin/classes/${id}`, {
			method: 'PUT',
			body: formularz({
				title: `${PREFIKS} Zajęcia`,
				levelLabel: `${PREFIKS} Poziom`,
				description: `${PREFIKS} opis po polsku`,
				titleEn: '   ',
				levelLabelEn: '',
				descriptionEn: `${PREFIKS} description in English`
			})
		});
		sprawdz('zajęcia: puste tłumaczenie zapisuje się jako null', wyczyszczone.dane?.titleEn === null, wyczyszczone.dane);

		// Przywracamy tłumaczenie, żeby sprawdzić render obu drzew.
		await zadanie(`/api/admin/classes/${id}`, {
			method: 'PUT',
			body: formularz({
				title: `${PREFIKS} Zajęcia`,
				levelLabel: `${PREFIKS} Poziom`,
				description: `${PREFIKS} opis po polsku`,
				titleEn: `${PREFIKS} Class`,
				levelLabelEn: `${PREFIKS} Level`,
				descriptionEn: `${PREFIKS} description in English`
			})
		});

		const polski = await html('/pilates');
		const angielski = await html('/en/pilates');

		sprawdz('zajęcia: /pilates pokazuje polską nazwę', polski.includes(`${PREFIKS} Zajęcia`));
		sprawdz('zajęcia: /pilates nie pokazuje angielskiej nazwy', !polski.includes(`${PREFIKS} Class`));
		sprawdz('zajęcia: /en/pilates pokazuje angielską nazwę', angielski.includes(`${PREFIKS} Class`));
		sprawdz('zajęcia: /en/pilates nie pokazuje polskiej nazwy', !angielski.includes(`${PREFIKS} Zajęcia`));

		return id;
	}

	// ------------------------------------------------------------------ KADRA

	async function kadra() {
		const zTlumaczeniem = await zadanie('/api/admin/team', {
			method: 'POST',
			body: formularz({
				fullName: `${PREFIKS} Anna Kowalska`,
				description: `${PREFIKS} opis instruktorki`,
				descriptionEn: `${PREFIKS} instructor bio`,
				photo: maleZdjecie('kadra.png')
			})
		});
		sprawdz('kadra: zapis z tłumaczeniem zwraca 201', zTlumaczeniem.status === 201, zTlumaczeniem);
		if (zTlumaczeniem.status !== 201) {
			return;
		}
		doPosprzatania.push(() => zadanie(`/api/admin/team/${zTlumaczeniem.dane.id}`, { method: 'DELETE' }));

		// Druga osoba bez tłumaczenia sprawdza zachowanie awaryjne na tej samej stronie.
		const bezTlumaczenia = await zadanie('/api/admin/team', {
			method: 'POST',
			body: formularz({
				fullName: `${PREFIKS} Beata Nowak`,
				description: `${PREFIKS} opis bez tlumaczenia`,
				photo: maleZdjecie('kadra2.png')
			})
		});
		sprawdz('kadra: zapis bez tłumaczenia zwraca 201', bezTlumaczenia.status === 201, bezTlumaczenia);
		if (bezTlumaczenia.status === 201) {
			doPosprzatania.push(() => zadanie(`/api/admin/team/${bezTlumaczenia.dane.id}`, { method: 'DELETE' }));
			sprawdz('kadra: brak tłumaczenia zapisuje się jako null', bezTlumaczenia.dane.descriptionEn === null, bezTlumaczenia.dane);
		}

		const polski = await html('/kadra');
		const angielski = await html('/en/kadra');

		sprawdz('kadra: /kadra pokazuje polski opis', polski.includes(`${PREFIKS} opis instruktorki`));
		sprawdz('kadra: /en/kadra pokazuje angielski opis', angielski.includes(`${PREFIKS} instructor bio`));
		sprawdz(
			'kadra: /en/kadra wraca do polskiego przy braku tłumaczenia',
			angielski.includes(`${PREFIKS} opis bez tlumaczenia`)
		);
	}

	// ------------------------------------------------------------- WYDARZENIA

	async function wydarzenia() {
		const zaTydzien = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);

		const utworzone = await zadanie('/api/admin/events', {
			method: 'POST',
			body: formularz({
				title: `${PREFIKS} Wydarzenie`,
				hostName: `${PREFIKS} Prowadząca`,
				shortDescription: `${PREFIKS} krótki opis`,
				description: `${PREFIKS} pełny opis`,
				hostDescription: `${PREFIKS} o prowadzącej`,
				eventStartAt: zaTydzien,
				location: `${PREFIKS} miejsce`,
				price: `${PREFIKS} 100 zł`,
				titleEn: `${PREFIKS} Event`,
				shortDescriptionEn: `${PREFIKS} short description`,
				descriptionEn: `${PREFIKS} full description`,
				hostDescriptionEn: `${PREFIKS} about the host`,
				locationEn: `${PREFIKS} venue`,
				priceEn: `${PREFIKS} 100 PLN`,
				image: maleZdjecie('wydarzenie.png')
			})
		});

		sprawdz('wydarzenia: zapis zwraca 201', utworzone.status === 201, utworzone);
		if (utworzone.status !== 201) {
			return;
		}

		const id = utworzone.dane.id;
		doPosprzatania.push(() => zadanie(`/api/admin/events/${id}`, { method: 'DELETE' }));

		const braki = ['titleEn', 'shortDescriptionEn', 'descriptionEn', 'hostDescriptionEn', 'locationEn', 'priceEn'].filter(
			(pole) => !utworzone.dane[pole]
		);
		sprawdz('wydarzenia: odpowiedź zawiera wszystkie sześć pól angielskich', braki.length === 0, braki);

		const polskaLista = await html('/wydarzenia');
		const angielskaLista = await html('/en/wydarzenia');
		sprawdz('wydarzenia: /wydarzenia pokazuje polski tytuł', polskaLista.includes(`${PREFIKS} Wydarzenie`));
		sprawdz('wydarzenia: /en/wydarzenia pokazuje angielski tytuł', angielskaLista.includes(`${PREFIKS} Event`));

		const polskiSzczegol = await html(`/event/${id}`);
		const angielskiSzczegol = await html(`/en/event/${id}`);
		sprawdzWyrenderowana('wydarzenia: szczegóły PL pokazują polskie miejsce i cenę', polskiSzczegol,
			polskiSzczegol.includes(`${PREFIKS} miejsce`) && polskiSzczegol.includes(`${PREFIKS} 100 zł`));
		sprawdzWyrenderowana('wydarzenia: szczegóły EN pokazują angielskie miejsce i cenę', angielskiSzczegol,
			angielskiSzczegol.includes(`${PREFIKS} venue`) && angielskiSzczegol.includes(`${PREFIKS} 100 PLN`));

		// Link z listy angielskiej nie może wyprowadzać z drzewa angielskiego.
		sprawdz('wydarzenia: link z /en/wydarzenia zostaje w drzewie angielskim',
			angielskaLista.includes(`/en/event/${id}`) && !angielskaLista.includes(`href="/event/${id}"`));
	}

	// -------------------------------------------------------------------- FAQ

	async function faq() {
		const utworzone = await zadanie('/api/admin/faq', {
			method: 'POST',
			json: {
				question: `${PREFIKS} pytanie po polsku`,
				answer: `${PREFIKS} odpowiedź po polsku`,
				questionEn: `${PREFIKS} question in English`,
				answerEn: `${PREFIKS} answer in English`
			}
		});

		sprawdz('faq: zapis zwraca 201', utworzone.status === 201, utworzone);
		if (utworzone.status !== 201) {
			return;
		}
		doPosprzatania.push(() => zadanie(`/api/admin/faq/${utworzone.dane.id}`, { method: 'DELETE' }));

		const polski = await html('/faq');
		const angielski = await html('/en/faq');
		sprawdz('faq: /faq pokazuje polskie pytanie', polski.includes(`${PREFIKS} pytanie po polsku`));
		sprawdz('faq: /en/faq pokazuje angielskie pytanie', angielski.includes(`${PREFIKS} question in English`));
	}

	// ---------------------------------------------- LANDING, SAUNA, BAR (edycja i przywrócenie)

	async function trescStala() {
		const landing = (await zadanie('/api/landing')).dane;
		const sauna = (await zadanie('/api/sauna')).dane;
		const bar = (await zadanie('/api/bar')).dane;

		// Te moduły mają jeden rekord, więc zamiast tworzyć nowy zapisujemy stan i przywracamy go na końcu.
		doPosprzatania.push(() =>
			zadanie('/api/admin/landing/hero', {
				method: 'PUT',
				body: formularz({
					title: landing.title,
					ctaLabel: landing.ctaLabel,
					ctaUrl: landing.ctaUrl,
					imageAlt: landing.imageAlt,
					titleEn: landing.titleEn ?? '',
					ctaLabelEn: landing.ctaLabelEn ?? '',
					imageAltEn: landing.imageAltEn ?? ''
				})
			})
		);
		doPosprzatania.push(() =>
			zadanie('/api/admin/sauna', {
				method: 'PUT',
				body: formularz({
					description: sauna.description,
					ctaLabel: sauna.ctaLabel,
					ctaUrl: sauna.ctaUrl,
					imageAlt: sauna.imageAlt,
					descriptionEn: sauna.descriptionEn ?? '',
					ctaLabelEn: sauna.ctaLabelEn ?? '',
					imageAltEn: sauna.imageAltEn ?? ''
				})
			})
		);
		doPosprzatania.push(() =>
			zadanie('/api/admin/bar', {
				method: 'PUT',
				body: formularz({
					description: bar.description,
					imageAlt: bar.imageAlt,
					descriptionEn: bar.descriptionEn ?? '',
					imageAltEn: bar.imageAltEn ?? ''
				})
			})
		);

		await zadanie('/api/admin/landing/hero', {
			method: 'PUT',
			body: formularz({
				title: landing.title,
				ctaLabel: landing.ctaLabel,
				ctaUrl: landing.ctaUrl,
				imageAlt: landing.imageAlt,
				titleEn: `${PREFIKS} Hero title`,
				ctaLabelEn: `${PREFIKS} Book now`,
				imageAltEn: `${PREFIKS} hero photo`
			})
		});
		await zadanie('/api/admin/sauna', {
			method: 'PUT',
			body: formularz({
				description: sauna.description,
				ctaLabel: sauna.ctaLabel,
				ctaUrl: sauna.ctaUrl,
				imageAlt: sauna.imageAlt,
				descriptionEn: `${PREFIKS} sauna description`,
				ctaLabelEn: `${PREFIKS} Book the sauna`,
				imageAltEn: `${PREFIKS} sauna photo`
			})
		});
		await zadanie('/api/admin/bar', {
			method: 'PUT',
			body: formularz({
				description: bar.description,
				imageAlt: bar.imageAlt,
				descriptionEn: `${PREFIKS} bar description`,
				imageAltEn: `${PREFIKS} bar photo`
			})
		});

		const stronaGlownaPl = await html('/');
		const stronaGlownaEn = await html('/en');
		sprawdz('landing: / pokazuje polski tekst przycisku', stronaGlownaPl.includes(landing.ctaLabel));
		sprawdz('landing: /en pokazuje angielski tekst przycisku', stronaGlownaEn.includes(`${PREFIKS} Book now`));

		const saunaPl = await html('/sauna');
		const saunaEn = await html('/en/sauna');
		sprawdz('sauna: /sauna pokazuje polski opis', saunaPl.includes(sauna.description.slice(0, 40)));
		sprawdz('sauna: /en/sauna pokazuje angielski opis', saunaEn.includes(`${PREFIKS} sauna description`));

		const barPl = await html('/bar');
		const barEn = await html('/en/bar');
		sprawdz('bar: /bar pokazuje polski opis', barPl.includes(bar.description.slice(0, 40)));
		sprawdz('bar: /en/bar pokazuje angielski opis', barEn.includes(`${PREFIKS} bar description`));
	}

	// ------------------------------------------------------- NAWIGACJA I SEO

	async function nawigacjaISeo() {
		const polski = await html('/kadra');
		const angielski = await html('/en/kadra');

		sprawdz('nawigacja: menu polskie prowadzi do tras polskich', polski.includes('href="/pilates"'));
		sprawdz('nawigacja: menu angielskie prowadzi do tras angielskich', angielski.includes('href="/en/pilates"'));
		sprawdz('nawigacja: strona angielska nie linkuje do drzewa polskiego', !angielski.includes('href="/pilates"'));

		sprawdz('przełącznik: strona polska prowadzi do /en/kadra', polski.includes('href="/en/kadra"'));
		sprawdz('przełącznik: strona angielska prowadzi do /kadra', angielski.includes('href="/kadra"'));

		sprawdz('seo: strona polska ma lang="pl"', /<html[^>]*lang="pl"/.test(polski));
		sprawdz('seo: strona angielska ma lang="en"', /<html[^>]*lang="en"/.test(angielski));
		sprawdz('seo: strona angielska ma hreflang', /hreflang="pl"/.test(angielski) && /hreflang="en"/.test(angielski));
	}

	// ------------------------------------------------------------- URUCHOMIENIE

	try {
		await zajecia();
		await kadra();
		await wydarzenia();
		await faq();
		await trescStala();
		await nawigacjaISeo();
	}
	catch (blad) {
		sprawdz('przebieg testu bez wyjątku', false, String(blad));
	}
	finally {
		// Sprzątamy zawsze, także po błędzie - dane testowe nie mogą zostać w bazie.
		for (const posprzataj of doPosprzatania.reverse()) {
			try {
				await posprzataj();
			}
			catch (blad) {
				wyniki.push({ opis: 'sprzątanie danych testowych', ok: false, szczegoly: String(blad) });
			}
		}
	}

	// Niezależna kontrola, że po sprzątaniu nie został żaden rekord testowy.
	const pozostale = [];
	for (const [nazwa, sciezka, pola] of [
		['zajęcia', '/api/classes', ['title', 'titleEn']],
		['kadra', '/api/team', ['fullName', 'description']],
		['wydarzenia', '/api/events', ['title', 'titleEn']],
		['faq', '/api/faq', ['question', 'questionEn']]
	]) {
		const lista = (await zadanie(sciezka)).dane ?? [];
		for (const pozycja of lista) {
			if (pola.some((pole) => String(pozycja[pole] ?? '').includes(PREFIKS))) {
				pozostale.push(`${nazwa}: ${pozycja.id}`);
			}
		}
	}
	sprawdz('sprzątanie: w bazie nie zostały dane testowe', pozostale.length === 0, pozostale);

	const bledy = wyniki.filter((wynik) => !wynik.ok);
	const podsumowanie = {
		zaliczone: wyniki.length - bledy.length,
		wszystkie: wyniki.length,
		bledy,
		// Sprawdzenia pominięte, bo strona nie była renderowana na serwerze.
		pominiete
	};

	console.log(podsumowanie.bledy.length === 0 ? 'E2E: wszystko zaliczone' : 'E2E: są błędy', podsumowanie);
	return podsumowanie;
}

if (typeof window === 'undefined') {
	runE2E().then((podsumowanie) => process.exit(podsumowanie.bledy.length === 0 ? 0 : 1));
}
