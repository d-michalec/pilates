/**
 * Dane kontaktowe studia w jednym miejscu.
 *
 * Adres i telefon są tymczasowe - przed otwarciem studia trzeba je podmienić.
 * Trzymamy je tutaj, bo pojawiają się w stopce i na stronie kontaktu, a rozjazd
 * między tymi miejscami byłby trudny do zauważenia.
 *
 * Uwaga: to jest adres *wyświetlany* na stronie. Adres, na który przychodzą
 * wiadomości z formularza, ustawia backend zmienną CONTACT_TO_EMAIL i jest to
 * osobna rzecz - te dwa adresy nie muszą być takie same.
 */
export const CONTACT_DETAILS = {
	email: 'biuro@babapilates.pl',
	mediaEmail: 'management@babapilates.pl',

	/** Wersja ze stopki - makieta pokazuje tam numer bez kierunkowego. */
	phone: '123 456 789',

	/** Wersja ze strony kontaktu - makieta pokazuje tam numer z kierunkowym. */
	phoneDisplay: '+48 123 456 789',

	/** Wersja do odnośnika tel: - bez spacji, z numerem kierunkowym kraju. */
	phoneLink: '+48123456789',

	street: 'ul. Polskiej Organizacji Wojskowej 25',
	city: '90-248 Łódź'
} as const;
