import { MediaAsset } from './landing-content';

/** Dni o identycznym zestawie godzin, pogrupowane już przez backend. */
export interface SaunaSessionGroup {
  dayNumbers: number[];
  times: string[];
}

export interface SaunaSessionItem {
  id: string;
  dayOfWeek: number;
  time: string;
}

export interface SaunaContent {
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageAlt: string;
  descriptionEn: string | null;
  ctaLabelEn: string | null;
  imageAltEn: string | null;
  image: MediaAsset | null;
  sessionGroups: SaunaSessionGroup[];
}

export interface UpdateSaunaInput {
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageAlt: string;
  descriptionEn: string;
  ctaLabelEn: string;
  imageAltEn: string;
  image?: File | null;
}

export interface BarOpeningDay {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}

export interface BarContent {
  description: string;
  imageAlt: string;
  descriptionEn: string | null;
  imageAltEn: string | null;
  image: MediaAsset | null;
  openingHours: BarOpeningDay[];
}

export interface UpdateBarInput {
  description: string;
  imageAlt: string;
  descriptionEn: string;
  imageAltEn: string;
  image?: File | null;
}

export interface SiteSettings {
  instagramUrl: string | null;
  facebookUrl: string | null;
}

/** 1 to poniedziałek, zgodnie z numeracją w bazie. */
export const DAY_NAMES = [
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
  'niedziela'
] as const;

export function dayName(dayOfWeek: number) {
  return DAY_NAMES[dayOfWeek - 1] ?? '';
}

/**
 * Zwija ciąg następujących po sobie dni w zakres, tak jak w makiecie:
 * [1,2,3,4,5] daje "poniedziałek-piątek", a [1,3,5] "poniedziałek, środa, piątek".
 */
export function formatDayList(dayNumbers: number[]) {
  const sorted = [...dayNumbers].sort((first, second) => first - second);
  const ranges: string[] = [];
  let rangeStart = 0;

  for (let index = 0; index < sorted.length; index++) {
    const isLast = index === sorted.length - 1;
    const breaksSequence = !isLast && sorted[index + 1] !== sorted[index] + 1;

    if (isLast || breaksSequence) {
      const from = sorted[rangeStart];
      const to = sorted[index];

      if (index - rangeStart >= 2) {
        ranges.push(`${dayName(from)}-${dayName(to)}`);
      }
      else {
        for (let day = rangeStart; day <= index; day++) {
          ranges.push(dayName(sorted[day]));
        }
      }

      rangeStart = index + 1;
    }
  }

  return ranges.join(', ');
}
