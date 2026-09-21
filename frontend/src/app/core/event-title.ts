import { tekstSurowy } from './typografia';

/*
 * KOLOROWANIE SŁÓW W NAZWIE WYDARZENIA
 *
 * W makiecie nazwa wydarzenia na kafelku jest dwukolorowa: część słów jest
 * biała, część błękitna ("SPORT & HORMONY - TRENUJ W RYTMIE HORMONÓW I CYKLU
 * MENSTRUACYJNEGO" ma błękitne "SPORT", "HORMONY" i "CYKLU"). To wybór
 * redakcyjny, którego nie da się wyliczyć z tekstu, więc musi go zapisać osoba
 * dodająca wydarzenie.
 *
 * Zapis jest jednym polem, a nie drugą kolumną w bazie: fragmenty do
 * wyróżnienia otacza się gwiazdkami, tak jak w wiadomościach.
 *
 *   *SPORT* & *HORMONY* - trenuj w rytmie hormonów i *cyklu* menstruacyjnego
 *
 * Domyślnie tekst jest biały - błękit trzeba zaznaczyć, bo w projekcie
 * wyróżnionych słów jest mniej niż zwykłych. Panel administratora ma przycisk,
 * który otacza zaznaczony fragment gwiazdkami, więc nikt nie musi pamiętać
 * składni.
 *
 * Gwiazdki są wyłącznie zapisem formatowania: wszędzie tam, gdzie tytuł idzie
 * jako czysty tekst (atrybut alt, znacznik title strony, lista w panelu),
 * trzeba użyć `plainEventTitle`.
 */

/** Kawałek nazwy wydarzenia razem z informacją, czy ma być błękitny. */
export interface EventTitlePart {
  text: string;
  highlighted: boolean;
}

/*
 * Para gwiazdek musi obejmować jakiś znak, stąd `+` zamiast `*` w środku -
 * inaczej "**" byłoby pustym wyróżnieniem. Wzorzec jest nienasycony, więc
 * "*a* i *b*" daje dwa wyróżnienia, a nie jedno obejmujące " i ".
 */
const WYROZNIENIE = /\*([^*]+)\*/g;

/**
 * Rozkłada nazwę wydarzenia na kawałki do wyświetlenia.
 *
 * Nieparzysta gwiazdka nie jest błędem - zostaje w tekście jako zwykły znak,
 * bo lepiej pokazać na stronie jedną gwiazdkę za dużo niż uciąć nazwę.
 */
export function splitEventTitle(title: string | null | undefined): EventTitlePart[] {
  if (!title) {
    return [];
  }

  const parts: EventTitlePart[] = [];
  let ostatniKoniec = 0;

  for (const dopasowanie of title.matchAll(WYROZNIENIE)) {
    const start = dopasowanie.index ?? 0;

    if (start > ostatniKoniec) {
      parts.push({ text: title.slice(ostatniKoniec, start), highlighted: false });
    }

    parts.push({ text: dopasowanie[1], highlighted: true });
    ostatniKoniec = start + dopasowanie[0].length;
  }

  if (ostatniKoniec < title.length) {
    parts.push({ text: title.slice(ostatniKoniec), highlighted: false });
  }

  return parts;
}

/** Nazwa wydarzenia bez znaczników - do atrybutów, tytułu strony i listy w panelu. */
export function plainEventTitle(title: string | null | undefined): string {
  return title ? tekstSurowy(title.replace(WYROZNIENIE, '$1')) : '';
}
