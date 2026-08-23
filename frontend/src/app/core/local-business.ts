import { CONTACT_DETAILS } from './contact-details';
import { SITE_URL } from './language.service';

/**
 * Dane strukturalne studia w formacie schema.org.
 *
 * Po co: Google czyta z tego adres, telefon i godziny i pokazuje je obok wyniku
 * oraz w mapce. Dla lokalnej firmy to jedna z niewielu rzeczy, które da się zrobić
 * po stronie kodu, żeby wpłynąć na wygląd wyniku wyszukiwania.
 *
 * Czego to NIE zastępuje: wizytówki Google Business Profile. Dane strukturalne
 * potwierdzają to, co Google już wie z wizytówki, ale same z siebie nie umieszczą
 * studia na mapce. Bez wizytówki większość korzyści przepada.
 *
 * Uwaga na spójność: adres, telefon i nazwa muszą się zgadzać co do znaku z tym, co
 * jest w wizytówce i na stronie kontaktu. Rozbieżność w tych trzech miejscach jest
 * gorsza niż brak danych strukturalnych - Google traktuje ją jako sygnał, że nie
 * wiadomo, której wersji wierzyć.
 */
export function localBusinessJsonLd(): string {
	const dane = {
		'@context': 'https://schema.org',
		'@type': 'HealthAndBeautyBusiness',
		name: 'BABA Studio',
		description:
			'Studio pilatesu w Łodzi. Zajęcia na macie i na sprzęcie, sauna, wydarzenia i warsztaty.',
		url: SITE_URL,
		telephone: CONTACT_DETAILS.phoneLink,
		email: CONTACT_DETAILS.email,
		address: {
			'@type': 'PostalAddress',
			streetAddress: CONTACT_DETAILS.street,
			// Kod pocztowy i miasto trzymamy w jednym polu na potrzeby wyświetlania,
			// ale schema.org chce ich osobno - stąd rozbicie.
			postalCode: CONTACT_DETAILS.city.split(' ')[0],
			addressLocality: CONTACT_DETAILS.city.split(' ').slice(1).join(' '),
			addressCountry: 'PL'
		},
		areaServed: 'Łódź'
	};

	return JSON.stringify(dane);
}
