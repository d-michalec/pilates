/**
 * Dane kontaktowe studia w jednym miejscu.
 *
 * Trzymamy je tutaj, bo pojawiają się w stopce i na stronie kontaktu, a rozjazd
 * między tymi miejscami byłby trudny do zauważenia.
 *
 * Uwaga: to jest adres *wyświetlany* na stronie. Adres, na który przychodzą
 * wiadomości z formularza, ustawia backend zmienną CONTACT_TO_EMAIL i jest to
 * osobna rzecz - te dwa adresy nie muszą być takie same.
 *
 * TELEFON JEST NADAL ZMYŚLONY - do podmiany przed otwarciem studia.
 */
export const CONTACT_DETAILS = {
	// Uwaga na domenę: strona stoi pod babapilates.pl, ale poczta studia działa
	// na baba-studio.pl. To nie pomyłka, tylko dwie osobne domeny.
	email: 'aleksandrakurasik@baba-studio.pl',

	// Makieta przewiduje osobny adres do współpracy i mediów. Póki go nie ma,
	// obie pozycje prowadzą do tej samej skrzynki - lepiej to niż adres, który
	// nie istnieje.
	mediaEmail: 'aleksandrakurasik@baba-studio.pl',

	/** Wersja ze stopki - makieta pokazuje tam numer bez kierunkowego. */
	phone: '123 456 789',

	/** Wersja ze strony kontaktu - makieta pokazuje tam numer z kierunkowym. */
	phoneDisplay: '+48 123 456 789',

	/** Wersja do odnośnika tel: - bez spacji, z numerem kierunkowym kraju. */
	phoneLink: '+48123456789',

	street: 'ul. Polskiej Organizacji Wojskowej 25',
	city: '90-248 Łódź'
} as const;
