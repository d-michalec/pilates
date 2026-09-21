/*
 * TYPOGRAFIA TEKSTU Z PANELU
 *
 * W polskim składzie nie zostawia się na końcu wiersza "sierotki" - krótkiego
 * wyrazu, który należy do następnego ("... zapraszamy do \n studia"). Obowiązkowe
 * są jednoliterowe (a, i, o, u, w, z), a w dobrym składzie pilnuje się też
 * krótkich przyimków w rodzaju "do", "na", "za".
 *
 * Rozwiązaniem nie jest łamanie wiersza przed takim wyrazem - to zostawia
 * ucięty, krótki wiersz i psuje się przy innej szerokości okna, a cała strona
 * jest płynna (wszystko w vw), więc łamanie dobre dla 1708 px z makiety na
 * laptopie wypada w połowie zdania. Rozwiązaniem jest spacja nierozdzielająca:
 * przeglądarka przenosi wtedy oba wyrazy razem na następny wiersz i sama
 * rozciąga poprzedni. Nie widać, że cokolwiek robiono ręcznie.
 *
 * Stąd dwie warstwy:
 *
 * 1. Automat - `zlozTekst` sam skleja jednoliterowe wyrazy i krótkie przyimki
 *    z następnym słowem. Działa na wszystkim, co już jest w bazie, i nie wymaga
 *    od nikogo w panelu żadnej pracy.
 *
 * 2. Ręcznie - tyldą. `50~zł`, `Aleksandra~Kurasik`, `prowadząca:~Ola`: tylda
 *    zamienia się w spację nierozdzielającą. Panel ma przycisk, który ją
 *    wstawia, więc nikt nie musi pamiętać składni.
 *
 * Tylda jest wyłącznie zapisem formatowania. Wszędzie tam, gdzie tekst idzie
 * jako wartość, a nie jako skład - atrybut alt, opis strony dla wyszukiwarki,
 * lista w panelu - trzeba użyć `tekstSurowy`.
 */

/** Spacja nierozdzielająca (U+00A0). */
export const TWARDA_SPACJA = ' ';

/*
 * Znacznik dla osoby wypełniającej panel: tylda w miejscu spacji.
 *
 * Liczy się tylko tylda *między* znakami, a nie każda. Inaczej cena wpisana
 * jako "~50 zł" straciłaby swoje "około", a to zapis, którego nikt nie
 * spodziewa się zmieniać.
 */
const ZNACZNIK_TWARDEJ_SPACJI = /(\S)~(\S)/g;

/*
 * Wyrazy, które nie powinny kończyć wiersza.
 *
 * Jednoliterowe są w polskiej typografii błędem, nie kwestią gustu. Przyimki
 * dwu- i trzyliterowe to już konwencja dobrego składu - zostawiam tylko te
 * naprawdę krótkie, bo każdy taki wyraz wydłuża nierozerwalny kawałek tekstu,
 * a w wąskiej kolumnie na telefonie to zaczyna przeszkadzać.
 *
 * Lista obejmuje też wersje z wielkiej litery (początek zdania).
 */
const SIEROTKI = [
  'a', 'i', 'o', 'u', 'w', 'z',
  'do', 'na', 'za', 'od', 'po', 'we', 'ze', 'ku',
  'nad', 'pod', 'bez', 'dla', 'przy'
];

/*
 * Skróty, po których łamanie wiersza czyta się jak błąd, bo skrót należy do
 * tego, co po nim następuje.
 */
const SKROTY = ['np', 'tj', 'tzn', 'ok', 'm\\.in', 'itp', 'nr', 'ul', 'godz'];

/*
 * Wzorce nie mogą pożerać znaku przed wyrazem, bo wtedy dwa krótkie wyrazy
 * z rzędu ("w i o tym") rozjechałyby się na pierwszym przejściu. Dlatego granica
 * jest w grupie, a `zlozTekst` powtarza podmianę do skutku - zamiast lookbehind,
 * którego starsze Safari nie potrafi skompilować i wywala się na całym wzorcu.
 */
const GRANICA = '(^|[\\s(\\[„"’‘„–—/])';

const WZORZEC_SIEROTEK = new RegExp(
  `${GRANICA}((?:${SIEROTKI.join('|')}|${SIEROTKI.map(duzaLitera).join('|')}))[ \\t]+`,
  'g'
);

const WZORZEC_SKROTOW = new RegExp(`${GRANICA}((?:${SKROTY.join('|')})\\.)[ \\t]+`, 'gi');

/*
 * Inicjał ("A. Kurasik") i liczba z jednostką ("50 zł", "60 min", "2 h") też
 * trzymają się razem. Liczba kończąca wiersz bez swojej jednostki wygląda jak
 * urwana, a przy cenach czyta się wręcz nieprzyjemnie.
 */
const WZORZEC_INICJALU = new RegExp(`${GRANICA}([A-ZĄĆĘŁŃÓŚŹŻ]\\.)[ \\t]+`, 'g');
const WZORZEC_JEDNOSTKI = /(\d)[ \t]+(zł|złotych|min|h|godz\.?|os\.?|%|km|m|kg|szt\.?|PLN)(?![\wąćęłńóśźż])/gi;

function duzaLitera(wyraz: string): string {
  return wyraz.charAt(0).toUpperCase() + wyraz.slice(1);
}

/**
 * Składa tekst do wyświetlenia: zamienia tyldy na spacje nierozdzielające
 * i sam skleja wyrazy, które nie powinny kończyć wiersza.
 *
 * Funkcja jest czysta i tania - można ją wołać wprost z szablonu (potok `typo`).
 */
export function zlozTekst(tekst: string | null | undefined): string {
  if (!tekst) {
    return '';
  }

  let wynik = podmieniajDoSkutku(tekst, ZNACZNIK_TWARDEJ_SPACJI, `$1${TWARDA_SPACJA}$2`);

  wynik = podmieniajDoSkutku(wynik, WZORZEC_SIEROTEK, `$1$2${TWARDA_SPACJA}`);
  wynik = podmieniajDoSkutku(wynik, WZORZEC_SKROTOW, `$1$2${TWARDA_SPACJA}`);
  wynik = podmieniajDoSkutku(wynik, WZORZEC_INICJALU, `$1$2${TWARDA_SPACJA}`);

  return wynik.replace(WZORZEC_JEDNOSTKI, `$1${TWARDA_SPACJA}$2`);
}

/**
 * Tekst bez znaczników formatowania - do atrybutów, opisów dla wyszukiwarki
 * i list w panelu. Tylda znika, spacje nierozdzielające wracają na zwykłe,
 * żeby nigdzie nie wyciekł znak, którego nikt nie wpisał.
 */
export function tekstSurowy(tekst: string | null | undefined): string {
  if (!tekst) {
    return '';
  }

  return podmieniajDoSkutku(tekst, ZNACZNIK_TWARDEJ_SPACJI, '$1 $2')
    .split(TWARDA_SPACJA)
    .join(' ');
}

/*
 * Podmiana biegnie do skutku, bo wzorce obejmują znak przed wyrazem: dwa krótkie
 * wyrazy z rzędu ("w i o tym") albo łańcuch sklejeń ("a~b~c") rozjechałyby się
 * na pierwszym przejściu. Kolejne przejścia domykają to, co zostało.
 */
function podmieniajDoSkutku(tekst: string, wzorzec: RegExp, zamiennik: string): string {
  let wynik = tekst;
  let poprzedni: string;

  do {
    poprzedni = wynik;
    wynik = wynik.replace(wzorzec, zamiennik);
  } while (wynik !== poprzedni);

  return wynik;
}
