/**
 * Dane kontaktowe studia w jednym miejscu.
 *
 * Trzymamy je tutaj, bo pojawiają się w stopce i na stronie kontaktu, a rozjazd
 * między tymi miejscami byłby trudny do zauważenia.
 *
 * Uwaga: to jest adres *wyświetlany* na stronie. Adres, na który przychodzą
 * wiadomości z formularza, ustawia backend zmienną CONTACT_TO_EMAIL i jest to
 * osobna rzecz - te dwa adresy nie muszą być takie same.
 */
export const CONTACT_DETAILS = {
	email: 'aleksandrakurasik@baba-studio.pl',

	// Makieta przewiduje osobny adres do współpracy i mediów. Póki go nie ma,
	// obie pozycje prowadzą do tej samej skrzynki - lepiej to niż adres, który
	// nie istnieje.
	mediaEmail: 'aleksandrakurasik@baba-studio.pl',

	/** Wersja ze stopki - makieta pokazuje tam numer bez kierunkowego. */
	phone: '695 060 301',

	/** Wersja ze strony kontaktu - makieta pokazuje tam numer z kierunkowym. */
	phoneDisplay: '+48 695 060 301',

	/** Wersja do odnośnika tel: - bez spacji, z numerem kierunkowym kraju. */
	phoneLink: '+48695060301',

	street: 'ul. Polskiej Organizacji Wojskowej 25',
	city: '90-248 Łódź'
} as const;
