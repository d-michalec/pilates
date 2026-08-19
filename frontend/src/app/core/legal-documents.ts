import { CONTACT_DETAILS } from './contact-details';

/**
 * Treść dokumentów prawnych: regulaminu i polityki prywatności.
 *
 * Dlaczego w kodzie, a nie w bazie z panelem do edycji: te dokumenty zmieniają się
 * raz na rok albo rzadziej, a każda ich wersja powinna dać się odtworzyć - historia
 * gita robi to za darmo. W bazie mielibyśmy tylko wersję bieżącą i żadnego śladu po
 * tym, na co zgadzały się osoby zapisane rok temu.
 *
 * UWAGA - REGULAMIN JEST SZKIELETEM DO WYPEŁNIENIA. Punkty oznaczone jako
 * `doUzupelnienia` mają widoczny znacznik, żeby nie dało się ich przeoczyć i opublikować
 * strony z pustymi zasadami. Treść musi pochodzić od właścicielki albo jej prawnika -
 * to jej zobowiązania wobec klientek, nie nasze przypuszczenia.
 *
 * Polityka prywatności jest opisem tego, co system faktycznie robi z danymi, i pod tym
 * względem jest dokładna. Nie zastępuje to przeglądu przez kogoś z uprawnieniami:
 * podstawy prawne i sformułowania powinien potwierdzić prawnik.
 */

export interface LegalSection {
	/** Nagłówek sekcji. Pomijamy przy tekście wstępnym. */
	heading?: { pl: string; en: string };
	/** Akapity. Puste tablice są dozwolone, gdy sekcja ma tylko listę. */
	paragraphs?: { pl: string; en: string }[];
	/** Lista wypunktowana pod akapitami. */
	bullets?: { pl: string; en: string }[];
	/** Sekcja czeka na treść od właścicielki - strona pokaże to wyraźnie. */
	doUzupelnienia?: boolean;
}

export interface LegalDocument {
	title: { pl: string; en: string };
	/** Data ostatniej zmiany. Przy dokumencie prawnym to nie ozdoba - pokazuje, czy jest aktualny. */
	updated: string;
	intro?: { pl: string; en: string };
	sections: LegalSection[];
}

const ADRES = `${CONTACT_DETAILS.street}, ${CONTACT_DETAILS.city}`;

export const PRIVACY_POLICY: LegalDocument = {
	title: { pl: 'Polityka prywatności', en: 'Privacy policy' },
	updated: '2026-08-19',
	intro: {
		pl:
			'Ten dokument opisuje, jakie dane zbieramy za pośrednictwem strony babapilates.pl, po co je zbieramy, ' +
			'komu je powierzamy i jak długo je przechowujemy. Staraliśmy się napisać go zrozumiale, bez zasłaniania ' +
			'się formułkami.',
		en:
			'This document explains what data we collect through babapilates.pl, why we collect it, who we share it ' +
			'with and how long we keep it. We have tried to write it plainly, without hiding behind legal formulas.'
	},
	sections: [
		{
			heading: { pl: 'Kto odpowiada za Twoje dane', en: 'Who is responsible for your data' },
			paragraphs: [
				{
					pl:
						`Administratorem danych jest BABA Studio, ${ADRES}. W sprawach dotyczących danych osobowych ` +
						`napisz na ${CONTACT_DETAILS.email}.`,
					en:
						`The data controller is BABA Studio, ${ADRES}, Poland. For any matter concerning personal data ` +
						`write to ${CONTACT_DETAILS.email}.`
				}
			],
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Formularz kontaktowy', en: 'Contact form' },
			paragraphs: [
				{
					pl:
						'Wypełniając formularz na stronie Kontakt, podajesz imię, adres e-mail i treść wiadomości. ' +
						'Numer telefonu i temat są nieobowiązkowe. Używamy tych danych wyłącznie po to, żeby odpowiedzieć ' +
						'na Twoją wiadomość.',
					en:
						'When you fill in the form on the Contact page you provide your name, email address and a message. ' +
						'Phone number and subject are optional. We use this data only to reply to you.'
				},
				{
					pl:
						'Wiadomość trafia do dwóch miejsc naraz: na naszą skrzynkę pocztową oraz do bazy strony, gdzie ' +
						'widzi ją osoba zalogowana do panelu. Po roku od wysłania wiadomość kasuje się automatycznie. ' +
						'Możesz też poprosić o usunięcie jej wcześniej.',
					en:
						'Your message goes to two places at once: our mailbox and the site database, where it is visible to ' +
						'a logged-in administrator. Messages are deleted automatically one year after they are sent. ' +
						'You can also ask us to delete yours sooner.'
				}
			]
		},
		{
			heading: { pl: 'Newsletter', en: 'Newsletter' },
			paragraphs: [
				{
					pl:
						'Zapisując się do newslettera, podajesz adres e-mail i opcjonalnie imię. Zapisujemy również treść ' +
						'zgody, którą zaznaczyłaś, oraz datę - to nasz dowód na to, na co dokładnie się zgodziłaś.',
					en:
						'When you subscribe to the newsletter you provide an email address and optionally your name. We also ' +
						'store the wording of the consent you ticked and its date - this is our record of what exactly you agreed to.'
				},
				{
					pl:
						'Adresy przekazujemy do serwisu GetResponse, który wysyła za nas wiadomości. Zgodę możesz wycofać ' +
						`w każdej chwili - wystarczy odnośnik na dole każdej wiadomości albo e-mail na ${CONTACT_DETAILS.email}. ` +
						'Wycofanie zgody nie wpływa na to, co wysłaliśmy wcześniej.',
					en:
						'Addresses are passed to GetResponse, which sends the messages on our behalf. You can withdraw your ' +
						`consent at any time - use the link at the bottom of any message or write to ${CONTACT_DETAILS.email}. ` +
						'Withdrawing consent does not affect messages sent before.'
				}
			]
		},
		{
			heading: { pl: 'Zapisy na zajęcia', en: 'Class bookings' },
			paragraphs: [
				{
					pl:
						'Grafik i zapisy obsługuje zewnętrzny system Fitssey, osadzony na podstronie Grafik. Dane, które ' +
						'podajesz przy zakładaniu konta i rezerwacji, trafiają bezpośrednio do Fitssey - nie przechodzą ' +
						'przez tę stronę i nie mamy do nich dostępu z jej poziomu. Obowiązuje tam polityka prywatności Fitssey.',
					en:
						'The schedule and bookings are handled by Fitssey, an external system embedded on the Schedule page. ' +
						'Data you enter when creating an account or booking a class goes directly to Fitssey - it does not pass ' +
						'through this website. Fitssey’s own privacy policy applies there.'
				}
			]
		},
		{
			heading: { pl: 'Bezpieczeństwo i adresy IP', en: 'Security and IP addresses' },
			paragraphs: [
				{
					pl:
						'Żeby formularz kontaktowy i zapis do newslettera nie stały się narzędziem do rozsyłania spamu, ' +
						'ograniczamy liczbę zgłoszeń z jednego adresu IP. Adres jest w tym celu trzymany wyłącznie w pamięci ' +
						'serwera przez kilkanaście minut i nie trafia do bazy ani do żadnego pliku.',
					en:
						'To stop the contact form and newsletter signup from being abused for spam, we limit how many ' +
						'submissions can come from one IP address. The address is held in server memory for a few minutes only ' +
						'and is never written to the database or any file.'
				}
			]
		},
		{
			heading: { pl: 'Komu powierzamy dane', en: 'Who we share data with' },
			paragraphs: [
				{
					pl: 'Poza nami dostęp do części danych mają podmioty, bez których strona nie mogłaby działać:',
					en: 'Besides us, the following parties have access to some of the data, as the site could not work without them:'
				}
			],
			bullets: [
				{
					pl: 'OVH - firma hostingowa, na której serwerze stoi strona i baza danych.',
					en: 'OVH - the hosting provider whose server runs the site and its database.'
				},
				{
					pl: 'GetResponse - obsługa wysyłki newslettera. Trafiają tam wyłącznie adresy osób zapisanych.',
					en: 'GetResponse - newsletter delivery. Only the addresses of subscribers are sent there.'
				},
				{
					pl: 'Dostawca poczty studia - przez niego przechodzą wiadomości z formularza kontaktowego.',
					en: 'The studio’s email provider - contact form messages pass through it.'
				},
				{
					pl: 'Fitssey - system zapisów na zajęcia, z własną polityką prywatności.',
					en: 'Fitssey - the class booking system, with its own privacy policy.'
				}
			]
		},
		{
			heading: { pl: 'Kopie zapasowe', en: 'Backups' },
			paragraphs: [
				{
					pl:
						'Codziennie robimy kopię zapasową bazy. Kopie przechowujemy przez czternaście dni, po czym kasują ' +
						'się same. Oznacza to, że po usunięciu Twoich danych z bazy mogą one jeszcze przez ten czas istnieć ' +
						'w kopii - to techniczna konieczność, a nie sposób na obejście Twojego wniosku.',
					en:
						'We back up the database daily. Backups are kept for fourteen days and then deleted automatically. ' +
						'This means that after your data is removed from the database it may still exist in a backup for that ' +
						'period - a technical necessity, not a way of working around your request.'
				}
			]
		},
		{
			heading: { pl: 'Twoje prawa', en: 'Your rights' },
			paragraphs: [
				{
					pl:
						`W każdej chwili możesz napisać na ${CONTACT_DETAILS.email} i poprosić o dostęp do swoich danych, ` +
						'ich poprawienie, usunięcie lub ograniczenie przetwarzania. Możesz też wycofać zgodę i wnieść sprzeciw. ' +
						'Jeśli uznasz, że postępujemy niewłaściwie, przysługuje Ci skarga do Prezesa Urzędu Ochrony Danych Osobowych.',
					en:
						`You can write to ${CONTACT_DETAILS.email} at any time to request access to your data, its correction, ` +
						'deletion or restriction of processing. You may also withdraw consent and object to processing. If you ' +
						'believe we are handling your data improperly, you may lodge a complaint with the Polish Data Protection Authority.'
				}
			]
		},
		{
			heading: { pl: 'Pliki cookie', en: 'Cookies' },
			paragraphs: [
				{
					pl:
						'Sama strona nie zapisuje w Twojej przeglądarce plików służących do śledzenia ani do reklam. ' +
						'Osadzony grafik Fitssey korzysta z własnych plików, niezbędnych do jego działania - opisuje je ' +
						'polityka prywatności Fitssey.',
					en:
						'The website itself does not store tracking or advertising cookies in your browser. The embedded ' +
						'Fitssey schedule uses its own cookies, required for it to work - these are described in Fitssey’s ' +
						'privacy policy.'
				}
			],
			doUzupelnienia: true
		}
	]
};

export const TERMS: LegalDocument = {
	title: { pl: 'Regulamin', en: 'Terms and conditions' },
	updated: '2026-08-19',
	intro: {
		pl:
			'Regulamin opisuje zasady korzystania ze studia: zapisy, odwoływanie zajęć, spóźnienia i sprawy ' +
			'bezpieczeństwa. Warto go przeczytać przed pierwszą wizytą.',
		en:
			'These terms describe how the studio works: bookings, cancellations, late arrivals and safety. ' +
			'It is worth reading before your first visit.'
	},
	sections: [
		{
			heading: { pl: 'Postanowienia ogólne', en: 'General provisions' },
			paragraphs: [
				{
					pl: `Studio prowadzi BABA Studio z siedzibą pod adresem ${ADRES}.`,
					en: `The studio is operated by BABA Studio, ${ADRES}, Poland.`
				}
			],
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Zapisy na zajęcia', en: 'Booking classes' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Odwoływanie i przenoszenie rezerwacji', en: 'Cancelling and moving bookings' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Spóźnienia i nieobecności', en: 'Late arrivals and no-shows' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Karnety i płatności', en: 'Passes and payments' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Bezpieczeństwo i przeciwwskazania zdrowotne', en: 'Safety and health contraindications' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Zasady obowiązujące w studiu', en: 'Studio rules' },
			doUzupelnienia: true
		},
		{
			heading: { pl: 'Reklamacje', en: 'Complaints' },
			doUzupelnienia: true
		}
	]
};

export const LEGAL_DOCUMENTS = {
	regulamin: TERMS,
	'polityka-prywatnosci': PRIVACY_POLICY
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENTS;
