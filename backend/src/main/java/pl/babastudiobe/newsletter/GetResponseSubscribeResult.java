package pl.babastudiobe.newsletter;

/**
 * Wynik próby dodania kontaktu do listy w GetResponse.
 *
 * Trzy stany zamiast "udało się / nie udało", bo GetResponse zwraca dwa różne kody
 * błędu w sytuacjach, które błędem nie są, i jeden kod powodzenia, który nie oznacza
 * powodzenia.
 */
enum GetResponseSubscribeResult {

	/**
	 * Odpowiedź 202: przyjęte do kolejki. Kontakt MOŻE jeszcze odpaść na dalszym
	 * etapie przetwarzania i GetResponse nam o tym nie powie. To najwięcej, co da
	 * się wiedzieć od razu.
	 */
	QUEUED,

	/**
	 * Odpowiedź 409: ten adres jest już na liście. Zwykły skutek ponownego zapisu
	 * przez formularz - cel osiągnięty, nie ma czego naprawiać.
	 */
	ALREADY_ON_LIST,

	/**
	 * Odpowiedź 400 z kodem 1002: GetResponse odmawia trwale. Najczęstszy powód to
	 * osoba, która sama się kiedyś wypisała albo zgłosiła wiadomość jako spam -
	 * takich kontaktów nie da się dodać z powrotem przez API i jest to zamierzone,
	 * bo chroni ich decyzję. Ponawianie nic nie zmieni.
	 */
	REJECTED
}
