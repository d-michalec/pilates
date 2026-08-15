import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Motyw PrimeNG dopasowany do BABA.
 *
 * Aura w wersji domyślnej używa zieleni, przez co przyciski w panelu i na stronie
 * nie miały nic wspólnego z resztą projektu. Podmieniamy paletę wiodącą na
 * czerwień BABA (--baba-red, #942319) rozciągniętą na skalę 50-950, której
 * oczekują komponenty: jaśniejsze odcienie idą na tła i stany najechania,
 * ciemniejsze na obramowania i tekst.
 *
 * Zmieniamy wyłącznie kolory. Kształty, odstępy i zachowanie zostają z Aury,
 * bo panel nie ma makiety i nie ma powodu odchodzić od sensownych wartości
 * domyślnych.
 */
export const BabaPreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '#faf4f4',
			100: '#f4e9e8',
			200: '#e7cfcc',
			300: '#d6aba8',
			400: '#bf7b75',
			500: '#a74b42',
			600: '#942319',
			700: '#821f16',
			800: '#6e1a12',
			900: '#59150f',
			950: '#3e0f0b'
		},

		colorScheme: {
			light: {
				primary: {
					// Wypełnienie przycisku bierzemy z odcienia 600, czyli dokładnie
					// z koloru marki - 500 byłby o ton za jasny wobec reszty strony.
					color: '{primary.600}',
					contrastColor: '#ffffff',
					hoverColor: '{primary.700}',
					activeColor: '{primary.800}'
				},
				highlight: {
					background: '{primary.50}',
					focusBackground: '{primary.100}',
					color: '{primary.800}',
					focusColor: '{primary.900}'
				},
				formField: {
					// Obwódka zaznaczenia musi być widoczna - to jedyny sygnał dla osób
					// poruszających się po formularzu klawiaturą.
					focusBorderColor: '{primary.600}'
				}
			}
		}
	}
});
