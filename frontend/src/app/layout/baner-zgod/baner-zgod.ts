import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { ZgodyService } from '../../core/zgody.service';

/**
 * Baner zgód na pliki cookie.
 *
 * Forma: pasek przy dolnej krawędzi, nie okno na środku. Strona otwiera się
 * pełnoekranowym zdjęciem i to ono ma być pierwszą rzeczą, którą widać -
 * przyciemnione okno modalne zasłoniłoby wejście każdej osobie, także tej,
 * która trafiła tu z wizytówki po godziny otwarcia.
 *
 * Trzy przyciski są równorzędne wizualnie: "Odrzucam" nie jest schowane ani
 * wyszarzone względem "Akceptuję". Odmowa ma być tak samo łatwa jak zgoda,
 * inaczej zgoda nie jest dobrowolna.
 */
@Component({
	selector: 'app-baner-zgod',
	imports: [LocalizePathPipe, RouterLink, TranslatePipe],
	templateUrl: './baner-zgod.html',
	styleUrl: './baner-zgod.scss'
})
export class BanerZgod {
	protected readonly zgody = inject(ZgodyService);

	/** Rozwinięty panel z kategoriami. */
	protected readonly ustawieniaOtwarte = signal(false);

	/** Przełącznik w panelu ustawień - stan roboczy, przed zapisaniem. */
	protected readonly marketingWybrany = signal(false);

	protected otworzUstawienia() {
		// Panel startuje od tego, co jest zapisane - a gdy nic nie ma, od odmowy.
		this.marketingWybrany.set(this.zgody.zapisanyStan()?.marketing ?? false);
		this.ustawieniaOtwarte.set(true);
	}

	protected przelaczMarketing(wlaczony: boolean) {
		this.marketingWybrany.set(wlaczony);
	}

	protected akceptuj() {
		this.zgody.zaakceptujWszystko();
		this.ustawieniaOtwarte.set(false);
	}

	protected odrzuc() {
		this.zgody.odrzucWszystko();
		this.ustawieniaOtwarte.set(false);
	}

	protected zapiszWybor() {
		this.zgody.zapisz({ marketing: this.marketingWybrany() });
		this.ustawieniaOtwarte.set(false);
	}
}
