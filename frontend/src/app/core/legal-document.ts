/**
 * Regulamin i polityka prywatności.
 *
 * Treść przychodzi z bazy i jest edytowalna w panelu. Wcześniej stała
 * w pliku `legal-documents.ts` - punktem zerowym historii zmian jest teraz
 * migracja V16 (czyli git), a każdy kolejny zapis z panelu dokłada wiersz
 * w tabeli rewizji.
 *
 * Sekcja ma jeden blok tekstu na język: pusta linia rozdziela akapity,
 * a wiersz zaczynający się od "- " jest punktem listy. Ta sama umowa
 * obowiązuje w opisach sauny, baru i kadry.
 */

/** Klucze dokumentów - te same, które stoją w adresach podstron. */
export type LegalDocumentKey = 'regulamin' | 'polityka-prywatnosci';

export interface LegalSection {
  heading: string | null;
  headingEn: string | null;
  body: string;
  bodyEn: string | null;
  /** Sekcja czeka na treść - strona pokazuje przy niej widoczny znacznik. */
  needsContent: boolean;
  sortOrder: number;
}

export interface LegalDocument {
  docKey: string;
  title: string;
  titleEn: string | null;
  intro: string | null;
  introEn: string | null;
  updatedAt: string;
  sections: LegalSection[];
}

export interface LegalSectionInput {
  heading: string;
  headingEn: string;
  body: string;
  bodyEn: string;
  needsContent: boolean;
}

export interface LegalDocumentInput {
  title: string;
  titleEn: string;
  intro: string;
  introEn: string;
  sections: LegalSectionInput[];
}

/** Lista dla panelu - bez treści, tylko tytuł i data ostatniej zmiany. */
export interface LegalDocumentSummary {
  docKey: string;
  title: string;
  updatedAt: string;
}

/** Wiersz zaczynający się od "- " jest punktem listy. */
const PUNKT = /^-\s+/;

export interface LegalBlock {
  kind: 'paragraph' | 'list';
  /** Akapit ma jeden wpis, lista tyle, ile punktów. */
  items: string[];
}

/**
 * Rozkłada blok tekstu sekcji na akapity i listy w kolejności, w jakiej
 * wystąpiły. Dzięki temu lista może stać w środku sekcji, a nie tylko na jej
 * końcu - poprzedni model danych na to nie pozwalał.
 */
export function splitLegalBody(body: string | null | undefined): LegalBlock[] {
  if (!body?.trim()) {
    return [];
  }

  const bloki: LegalBlock[] = [];

  for (const czesc of body.split(/\n\s*\n/)) {
    const wiersze = czesc.split('\n').map((wiersz) => wiersz.trim()).filter(Boolean);

    if (wiersze.length === 0) {
      continue;
    }

    // Blok jest listą, gdy zaczyna się od punktu. Wiersze bez kreski wewnątrz
    // takiego bloku doklejamy do ostatniego punktu - ktoś złamał długi punkt
    // enterem, a nie dopisał akapitu.
    if (PUNKT.test(wiersze[0])) {
      const punkty: string[] = [];

      for (const wiersz of wiersze) {
        if (PUNKT.test(wiersz)) {
          punkty.push(wiersz.replace(PUNKT, ''));
        } else if (punkty.length > 0) {
          punkty[punkty.length - 1] += ` ${wiersz}`;
        }
      }

      bloki.push({ kind: 'list', items: punkty });
      continue;
    }

    bloki.push({ kind: 'paragraph', items: [wiersze.join(' ')] });
  }

  return bloki;
}
