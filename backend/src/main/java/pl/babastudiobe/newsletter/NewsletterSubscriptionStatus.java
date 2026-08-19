package pl.babastudiobe.newsletter;

enum NewsletterSubscriptionStatus {
	LOCAL_ONLY,

	/**
	 * GetResponse przyjął kontakt do kolejki. Uwaga na nazwę: to nie znaczy, że
	 * adres jest na liście - ich API odpowiada 202, a odrzucenie na dalszym etapie
	 * przetwarzania nie wraca do nas w żaden sposób.
	 */
	GETRESPONSE_ACCEPTED,

	/**
	 * GetResponse odmówił trwale, najczęściej dlatego, że ta osoba sama się kiedyś
	 * wypisała. Ponawianie nie ma sensu i o tym właśnie mówi ten stan - inaczej niż
	 * FAILED, który oznacza usterkę możliwą do powtórzenia.
	 */
	GETRESPONSE_REJECTED,

	FAILED,
	/**
	 * Osoba zrezygnowała. Wiersz zostaje, a nie znika od razu, bo jest dowodem na
	 * to, że zgoda kiedyś była i kiedy została wycofana. Zadanie sprzątające kasuje
	 * takie wpisy po roku.
	 */
	UNSUBSCRIBED
}
