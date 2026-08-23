/**
 * Generuje sitemap.xml po zbudowaniu frontu.
 *
 * Dlaczego generowana, a nie napisana ręcznie: mapa napisana ręcznie dezaktualizuje
 * się przy pierwszej nowej podstronie i nikt się o tym nie dowie, bo nic nie
 * przestaje działać. Robot po prostu przestaje widzieć część strony.
 *
 * Adresy wydarzeń bierzemy z tego, co build faktycznie wygenerował, a nie z osobnego
 * zapytania do backendu. Dzięki temu mapa nigdy nie obiecuje strony, której nie ma -
 * a przy pierwszym uruchomieniu na serwerze backend jeszcze nie stoi i strony
 * wydarzeń się nie generują.
 *
 * Uruchamiane przez "npm run build".
 */

import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const KATALOG = 'dist/babastudio-frontend/browser';
const ADRES = process.env.SITE_URL || 'https://baba-studio.pl';

/**
 * Podstrony, których nie chcemy w wynikach wyszukiwania. Dokumenty prawne mają
 * już znacznik noindex w HTML - w mapie byłyby sprzecznym sygnałem, bo mapa mówi
 * "zaindeksuj to", a strona "nie indeksuj".
 */
const POMIJANE = [
	'regulamin',
	'polityka-prywatnosci',
	'newsletter/wypisz',
	'admin'
];

/** Adresy ważniejsze od reszty. Wartości względne, liczy się kolejność, nie sama liczba. */
const WAGI = {
	'': 1.0,
	grafik: 0.9,
	pilates: 0.8,
	wydarzenia: 0.8,
	kontakt: 0.7,
	kadra: 0.7,
	sauna: 0.7,
	bar: 0.6,
	faq: 0.6
};

async function znajdzStronyHtml(katalog, korzen = katalog) {
	const wyniki = [];
	for (const wpis of await readdir(katalog, { withFileTypes: true })) {
		const sciezka = join(katalog, wpis.name);
		if (wpis.isDirectory()) {
			wyniki.push(...(await znajdzStronyHtml(sciezka, korzen)));
		}
		else if (wpis.name === 'index.html') {
			wyniki.push(relative(korzen, katalog).split(sep).join('/'));
		}
	}
	return wyniki;
}

function czyPominac(sciezka) {
	// Wersja angielska ma prefiks /en, więc porównujemy ścieżkę bez niego.
	const bezPrefiksu = sciezka.startsWith('en/') ? sciezka.slice(3) : sciezka === 'en' ? '' : sciezka;
	return POMIJANE.some((wzorzec) => bezPrefiksu === wzorzec || bezPrefiksu.startsWith(`${wzorzec}/`));
}

function priorytet(sciezka) {
	const bezPrefiksu = sciezka.startsWith('en/') ? sciezka.slice(3) : sciezka === 'en' ? '' : sciezka;
	const podstawa = WAGI[bezPrefiksu] ?? (bezPrefiksu.startsWith('event/') ? 0.6 : 0.5);
	// Wersja angielska dostaje niższy priorytet: studio działa w Łodzi, więc ruch
	// z polskich zapytań jest ważniejszy.
	return sciezka.startsWith('en') ? Math.max(0.1, podstawa - 0.2) : podstawa;
}

function adres(sciezka) {
	return sciezka === '' ? `${ADRES}/` : `${ADRES}/${sciezka}`;
}

/** Odpowiednik tej samej strony w drugim języku - do znaczników hreflang. */
function drugiJezyk(sciezka) {
	if (sciezka === 'en') return '';
	if (sciezka.startsWith('en/')) return sciezka.slice(3);
	return sciezka === '' ? 'en' : `en/${sciezka}`;
}

const wszystkie = await znajdzStronyHtml(KATALOG);
const strony = wszystkie.filter((s) => !czyPominac(s)).sort();

if (strony.length === 0) {
	console.error('[sitemap] Nie znalazłem żadnej strony w ' + KATALOG + '. Czy build się powiódł?');
	process.exit(1);
}

const dzisiaj = new Date().toISOString().split('T')[0];

const wpisy = strony
	.map((sciezka) => {
		const para = drugiJezyk(sciezka);
		const maPare = strony.includes(para);
		const polski = sciezka.startsWith('en') ? para : sciezka;
		const angielski = sciezka.startsWith('en') ? sciezka : para;

		// Znaczniki hreflang w mapie muszą się zgadzać z tymi w HTML. Sprzeczność
		// między nimi jest gorsza niż brak jednych i drugich.
		const alternatywy = maPare
			? [
					`    <xhtml:link rel="alternate" hreflang="pl" href="${adres(polski)}"/>`,
					`    <xhtml:link rel="alternate" hreflang="en" href="${adres(angielski)}"/>`,
					`    <xhtml:link rel="alternate" hreflang="x-default" href="${adres(polski)}"/>`
				].join('\n')
			: null;

		return [
			'  <url>',
			`    <loc>${adres(sciezka)}</loc>`,
			`    <lastmod>${dzisiaj}</lastmod>`,
			`    <priority>${priorytet(sciezka).toFixed(1)}</priority>`,
			alternatywy,
			'  </url>'
		]
			.filter(Boolean)
			.join('\n');
	})
	.join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${wpisy}
</urlset>
`;

await writeFile(join(KATALOG, 'sitemap.xml'), xml, 'utf8');

const pominiete = wszystkie.length - strony.length;
console.log(`[sitemap] Zapisano ${strony.length} adresów, pominięto ${pominiete}. Domena: ${ADRES}`);

// Ostrzeżenie, nie błąd: brak stron wydarzeń jest normalny przy pierwszym
// uruchomieniu, gdy backend jeszcze nie stoi.
if (!strony.some((s) => s.startsWith('event/'))) {
	console.warn('[sitemap] Uwaga: w mapie nie ma ani jednej strony wydarzenia. Czy backend działał podczas budowania?');
}

await stat(join(KATALOG, 'sitemap.xml'));
