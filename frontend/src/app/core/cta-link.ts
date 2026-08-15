/**
 * Odnośniki wezwań do działania mogą prowadzić w dwa miejsca: na naszą podstronę
 * albo na zewnętrzny adres, na przykład wprost do zapisów w Fitssey. Rozróżnienie
 * ma znaczenie, bo tylko adres wewnętrzny wolno podać do routerLink - inaczej
 * przeglądarka przeładowuje całą stronę i użytkownik wypada z wersji językowej,
 * w której był.
 */
export function isExternalUrl(url: string | null | undefined): boolean {
	if (!url) {
		return false;
	}

	return url.startsWith('http://') || url.startsWith('https://');
}
