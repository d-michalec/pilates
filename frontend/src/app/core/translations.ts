/**
 * Słownik tekstów interfejsu. Świadomie nie używamy wbudowanego i18n Angulara,
 * bo wymaga osobnego builda na każdy język, a my mamy jeden statyczny prerender
 * i przełącznik działający w locie.
 *
 * Treści redagowane przez właścicielkę (zajęcia, eventy, kadra, sauna, bar, FAQ)
 * NIE są tutaj - te mają angielskie kolumny w bazie i panel do ich uzupełniania.
 */
interface Translation {
  pl: string;
  en: string;
}

export const TRANSLATIONS = {
  // Menu i nawigacja
  'menu.open': { pl: 'Menu', en: 'Menu' },
  'menu.openAria': { pl: 'Otwórz menu', en: 'Open menu' },
  'menu.closeAria': { pl: 'Zamknij menu', en: 'Close menu' },
  'menu.label': { pl: 'Menu strony', en: 'Site menu' },
  'menu.home': { pl: 'Home', en: 'Home' },
  'menu.pilates': { pl: 'Pilates', en: 'Pilates' },
  'menu.sauna': { pl: 'Sauna', en: 'Sauna' },
  'menu.events': { pl: 'Wydarzenia', en: 'Events' },
  'menu.bar': { pl: 'Bar', en: 'Bar' },
  'menu.schedule': { pl: 'Grafik', en: 'Schedule' },
  'menu.team': { pl: 'Zespół', en: 'Team' },
  'menu.faq': { pl: 'FAQ', en: 'FAQ' },
  'menu.contact': { pl: 'Kontakt', en: 'Contact' },
  'menu.signUp': { pl: 'Zapisz się', en: 'Book now' },

  // Przełącznik języka
  'language.switchAria': { pl: 'Zmień język na angielski', en: 'Switch language to Polish' },
  'language.current': { pl: 'PL', en: 'EN' },
  'language.other': { pl: 'EN', en: 'PL' },

  // Stany wspólne
  'state.loading': { pl: 'Ładowanie...', en: 'Loading...' },
  'state.error': { pl: 'Nie udało się pobrać danych. Odśwież stronę.', en: 'Could not load the data. Please refresh.' },

  // Landing
  'landing.ctaFallback': { pl: 'Zarezerwuj sesję', en: 'Book a session' },
  'landing.about.label': { pl: 'O marce', en: 'About us' },
  'landing.about.intro': {
    pl: 'BABA to miejsce dla ruchu, regeneracji i wspólnoty. Łączymy pilates, spokojne tempo i codzienne rytuały, które pomagają wracać do ciała z czułością.',
    en: 'BABA is a place for movement, recovery and community. We bring together pilates, an unhurried pace and everyday rituals that help you come back to your body with kindness.'
  },
  'landing.about.first': {
    pl: 'Pracujemy w kameralnych grupach, z uwagą na technikę i oddech. To studio ma być blisko ludzi, nie trendów.',
    en: 'We work in small groups, with attention to technique and breath. This studio is meant to stay close to people, not to trends.'
  },
  'landing.about.second': {
    pl: 'W planie są zajęcia pilates, sauna, wydarzenia, kobieca społeczność i oferta barowa jako naturalne przedłużenie wizyty.',
    en: 'We offer pilates classes, a sauna, events, a womens community and a cafe as a natural extension of your visit.'
  },
  'landing.offer.label': { pl: 'Co przygotowaliśmy?', en: 'What we offer' },
  'landing.offer.pilates.title': { pl: 'trening pilates', en: 'pilates training' },
  'landing.offer.pilates.text': {
    pl: 'Kameralne zajęcia prowadzone w rytmie, który daje siłę bez presji.',
    en: 'Small group classes at a pace that builds strength without pressure.'
  },
  'landing.offer.sauna.title': { pl: 'sauna', en: 'sauna' },
  'landing.offer.sauna.text': {
    pl: 'Regeneracja po treningu albo osobny rytuał wyciszenia.',
    en: 'Recovery after training, or a quiet ritual of its own.'
  },
  'landing.offer.community.title': { pl: 'kobieca społeczność', en: 'womens community' },
  'landing.offer.community.text': {
    pl: 'Warsztaty, spotkania i przestrzeń do bycia razem.',
    en: 'Workshops, meetups and space to be together.'
  },
  'landing.offer.bar.title': { pl: 'oferta barowa', en: 'cafe menu' },
  'landing.offer.bar.text': {
    pl: 'Kawa, napary i rzeczy, które dobrze domykają wizytę.',
    en: 'Coffee, infusions and small things that round off a visit.'
  },
  'landing.questions.label': { pl: 'Masz pytania?', en: 'Any questions?' },
  'landing.questions.heading': {
    pl: 'Napisz do nas albo od razu przejdź do grafiku.',
    en: 'Write to us, or go straight to the schedule.'
  },
  'landing.questions.faq': { pl: 'Sprawdź FAQ', en: 'Read the FAQ' },
  'landing.questions.schedule': { pl: 'Grafik zajęć', en: 'Class schedule' },

  // Formularz kontaktowy
  'contact.name': { pl: 'Imię i nazwisko', en: 'Full name' },
  'contact.email': { pl: 'E-mail', en: 'Email' },
  'contact.phone': { pl: 'Telefon', en: 'Phone' },
  'contact.subject': { pl: 'Temat', en: 'Subject' },
  'contact.message': { pl: 'Wiadomość', en: 'Message' },
  'contact.website': { pl: 'Strona internetowa', en: 'Website' },
  'contact.send': { pl: 'Wyślij wiadomość', en: 'Send message' },
  'contact.invalid': { pl: 'Uzupełnij poprawnie formularz kontaktowy.', en: 'Please complete the form correctly.' },
  'contact.success': {
    pl: 'Dziękujemy za wiadomość. Odezwemy się tak szybko, jak to możliwe.',
    en: 'Thank you for your message. We will get back to you as soon as we can.'
  },
  'form.tooManyRequests': {
    pl: 'Wysłano już kilka wiadomości z tego miejsca. Spróbuj ponownie za kilkanaście minut.',
    en: 'Several messages have already been sent from here. Please try again in a few minutes.'
  },
  'contact.failure': { pl: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.', en: 'Could not send the message. Please try again.' },

  // Newsletter w stopce
  'newsletter.title': { pl: 'Newsletter', en: 'Newsletter' },
  'newsletter.lead': {
    pl: 'Informacje o zajęciach, wydarzeniach i spokojnych nowościach.',
    en: 'News about classes, events and quiet updates.'
  },
  'newsletter.emailPlaceholder': { pl: 'e-mail', en: 'email' },
  'newsletter.submit': { pl: 'Zapisz się', en: 'Subscribe' },
  'newsletter.invalid': { pl: 'Podaj poprawny e-mail.', en: 'Please enter a valid email address.' },
  'newsletter.success': { pl: 'Dziękujemy za zapis.', en: 'Thank you for subscribing.' },
  'newsletter.failure': { pl: 'Nie udało się zapisać do newslettera.', en: 'Could not subscribe. Please try again.' },

  // Stopka
  'footer.contactLabel': { pl: 'kontakt:', en: 'contact:' },
  'footer.terms': { pl: 'Regulamin', en: 'Terms' },
  'footer.privacy': { pl: 'Polityka prywatności', en: 'Privacy policy' },

  // Dokumenty prawne
  'legal.updated': { pl: 'Ostatnia zmiana:', en: 'Last updated:' },
  'legal.missing': {
    pl: 'TREŚĆ DO UZUPEŁNIENIA PRZED OTWARCIEM STUDIA.',
    en: 'CONTENT TO BE COMPLETED BEFORE THE STUDIO OPENS.'
  },
  'legal.check': {
    pl: 'DO POTWIERDZENIA PRZED OTWARCIEM STUDIA.',
    en: 'TO BE CONFIRMED BEFORE THE STUDIO OPENS.'
  },
  'legal.questions': { pl: 'Masz pytania?', en: 'Any questions?' },
  'legal.contactLink': { pl: 'Napisz do nas', en: 'Write to us' },

  // Zgody
  'consent.newsletter': {
    pl: 'Chcę dostawać newsletter BABA Studio. Wiem, że mogę wycofać zgodę w każdej chwili.',
    en: 'I want to receive the BABA Studio newsletter. I know I can withdraw my consent at any time.'
  },
  'consent.required': {
    pl: 'Zaznacz zgodę, żeby zapisać się do newslettera.',
    en: 'Please tick the consent box to subscribe.'
  },
  'consent.privacyNote': {
    pl: 'Twoje dane przetwarzamy zgodnie z',
    en: 'We process your data in line with our'
  },
  'consent.privacyLink': { pl: 'polityką prywatności', en: 'privacy policy' },

  // Rezygnacja z newslettera
  'unsubscribe.title': { pl: 'Rezygnacja', en: 'Unsubscribe' },
  'unsubscribe.lead': {
    pl: 'Potwierdź, że nie chcesz już dostawać newslettera BABA Studio.',
    en: 'Confirm that you no longer want to receive the BABA Studio newsletter.'
  },
  'unsubscribe.confirm': { pl: 'Wypisz mnie', en: 'Unsubscribe me' },
  'unsubscribe.doneTitle': { pl: 'Wypisaliśmy Cię', en: 'You are unsubscribed' },
  'unsubscribe.doneText': {
    pl: 'Nie będziemy już wysyłać newslettera na ten adres. Jeśli zmienisz zdanie, możesz zapisać się ponownie w stopce strony.',
    en: 'We will not send the newsletter to this address any more. If you change your mind, you can subscribe again in the site footer.'
  },
  'unsubscribe.missingToken': {
    pl: 'Ten odnośnik jest niepełny - programy pocztowe czasem łamią długie adresy. Otwórz go jeszcze raz z wiadomości albo napisz do nas, a wypiszemy Cię ręcznie.',
    en: 'This link is incomplete - email clients sometimes break long addresses. Open it again from the message or write to us and we will unsubscribe you manually.'
  },
  'unsubscribe.failure': {
    pl: 'Nie udało się wypisać. Spróbuj ponownie albo napisz do nas.',
    en: 'Could not unsubscribe. Please try again or write to us.'
  },
  'unsubscribe.back': { pl: 'Wróć na stronę', en: 'Back to the site' },

  // Podstrony
  'pilates.title': { pl: 'Pilates', en: 'Pilates' },
  'sauna.label': { pl: 'Sauna', en: 'Sauna' },
  'sauna.sessions': { pl: 'Aktualne godziny seansów', en: 'Current session times' },
  'sauna.error': {
    pl: 'Nie udało się pobrać informacji o saunie. Odśwież stronę albo napisz do nas.',
    en: 'Could not load sauna information. Please refresh, or write to us.'
  },
  'bar.label': { pl: 'Bar', en: 'Bar' },
  'bar.hours': { pl: 'Godziny otwarcia kawiarni', en: 'Cafe opening hours' },
  'bar.closed': { pl: 'zamknięte', en: 'closed' },
  'bar.error': {
    pl: 'Nie udało się pobrać informacji o barze. Odśwież stronę albo napisz do nas.',
    en: 'Could not load cafe information. Please refresh, or write to us.'
  },
  'schedule.title': { pl: 'Grafik', en: 'Schedule' },
  'schedule.loading': { pl: 'Ładujemy grafik rezerwacji...', en: 'Loading the booking schedule...' },
  'schedule.frameTitle': { pl: 'Grafik zajęć BABA Studio', en: 'BABA Studio class schedule' },
  'team.empty': { pl: 'Kadra pojawi się wkrótce.', en: 'Our team will appear here soon.' },
  'team.srHeading': { pl: 'Kadra BABA Studio', en: 'BABA Studio team' },
  'events.upcoming': { pl: 'Harmonogram wydarzeń', en: 'Upcoming events' },
  'events.past': { pl: 'Minione wydarzenia', en: 'Past events' },
  'events.pastPagination': { pl: 'Strony minionych wydarzeń', en: 'Past events pages' },
  'events.none': { pl: 'Brak nadchodzących wydarzeń.', en: 'No upcoming events.' },
  'faq.title': { pl: 'FAQ', en: 'FAQ' },
  'faq.empty': { pl: 'Pytania pojawią się wkrótce.', en: 'Questions will appear here soon.' },
  'faq.contactLead': { pl: 'Nie znalazłaś odpowiedzi na swoje pytanie?', en: 'Did not find the answer you were looking for?' },
  'faq.contactLink': { pl: 'Skontaktuj się z nami - chętnie odpowiemy', en: 'Get in touch, we are happy to help' },
  'contactPage.title': { pl: 'Kontakt', en: 'Contact' },
  'contactPage.general': { pl: 'Sprawy ogólne', en: 'General enquiries' },
  'contactPage.media': { pl: 'Współpraca i media', en: 'Partnerships and press' },
  'contactPage.address': { pl: 'Adres', en: 'Address' },
  'contactPage.formLead': { pl: 'Masz pytania?', en: 'Any questions?' },
  'contactPage.formHeading': { pl: 'Napisz do nas', en: 'Write to us' },
  'contactPage.formText': {
    pl: 'Odpowiemy w sprawie zajęć, wydarzeń, sauny, współpracy albo pierwszej wizyty w studio.',
    en: 'We will get back to you about classes, events, the sauna, partnerships or your first visit.'
  },

  // Pilates
  'pilates.lead': {
    pl: 'Nie możesz zdecydować, które zajęcia będą dla Ciebie najlepsze?',
    en: 'Not sure which class is right for you?'
  },
  'pilates.leadLink': { pl: 'Skontaktuj się z nami', en: 'Get in touch' },
  'pilates.leadTail': { pl: ', chętnie podpowiemy.', en: ', we are happy to help.' },
  'pilates.cta': { pl: 'Zarezerwuj zajęcia', en: 'Book a class' },
  'pilates.loading': { pl: 'Ładowanie zajęć...', en: 'Loading classes...' },
  'pilates.fallback.beginner.level': { pl: 'Początkujący', en: 'Beginner' },
  'pilates.fallback.beginner.text': {
    pl: 'Spokojne wejście w podstawy, oddech i precyzyjny ruch.',
    en: 'A calm introduction to the basics, breath and precise movement.'
  },
  'pilates.fallback.mat.text': {
    pl: 'Zajęcia dla osób, które chcą budować siłę, stabilność i lekkość w codziennym ruchu.',
    en: 'For those who want to build strength, stability and ease in everyday movement.'
  },
  'pilates.fallback.stretch.text': {
    pl: 'Łagodniejsza praktyka na dni, kiedy ciało potrzebuje przestrzeni i spokojnego tempa.',
    en: 'A gentler practice for days when the body needs space and a slower pace.'
  },

  // Wydarzenia
  'event.join': { pl: 'Weź udział', en: 'Take part' },
  'event.notFound': { pl: 'Nie udało się pobrać wydarzenia.', en: 'Could not load the event.' },
  'events.error': { pl: 'Nie udało się pobrać wydarzeń.', en: 'Could not load events.' },
  'team.error': { pl: 'Nie udało się pobrać listy kadry.', en: 'Could not load the team.' },
  'classes.error': { pl: 'Nie udało się pobrać zajęć.', en: 'Could not load classes.' },
  'faq.error': { pl: 'Nie udało się pobrać pytań.', en: 'Could not load the questions.' },

  // Tytuły i opisy stron
  'seo.home.title': { pl: 'BABA Studio | Pilates, regeneracja i kobieca społeczność', en: 'BABA Studio | Pilates, recovery and womens community' },
  'seo.home.description': {
    pl: 'BABA Studio to kameralne miejsce dla pilatesu, regeneracji, wydarzeń i spokojnego powrotu do ciała.',
    en: 'BABA Studio is an intimate space for pilates, recovery, events and a calm return to your body.'
  },
  'seo.pilates.title': { pl: 'Pilates | BABA Studio', en: 'Pilates | BABA Studio' },
  'seo.pilates.description': {
    pl: 'Kameralne zajęcia pilates w BABA Studio. Wybierz poziom i zarezerwuj miejsce.',
    en: 'Small group pilates classes at BABA Studio. Choose your level and book a place.'
  },
  'seo.sauna.title': { pl: 'Sauna | BABA Studio', en: 'Sauna | BABA Studio' },
  'seo.sauna.description': {
    pl: 'Sauna w BABA Studio w Łodzi. Sprawdź aktualne godziny seansów i zarezerwuj miejsce.',
    en: 'The sauna at BABA Studio in Lodz. Check current session times and book your spot.'
  },
  'seo.bar.title': { pl: 'Bar | BABA Studio', en: 'Cafe | BABA Studio' },
  'seo.bar.description': {
    pl: 'Kawiarnia w BABA Studio w Łodzi. Sprawdź godziny otwarcia i wpadnij na kawę.',
    en: 'The cafe at BABA Studio in Lodz. Check the opening hours and drop in for a coffee.'
  },
  'seo.schedule.title': { pl: 'Grafik | BABA Studio', en: 'Schedule | BABA Studio' },
  'seo.schedule.description': {
    pl: 'Aktualny grafik zajęć i rezerwacje w BABA Studio.',
    en: 'Current class schedule and bookings at BABA Studio.'
  },
  'seo.team.title': { pl: 'Kadra | BABA Studio', en: 'Team | BABA Studio' },
  'seo.team.description': {
    pl: 'Poznaj osoby prowadzące zajęcia i spotkania w BABA Studio.',
    en: 'Meet the people who lead classes and gatherings at BABA Studio.'
  },
  'seo.events.title': { pl: 'Wydarzenia | BABA Studio', en: 'Events | BABA Studio' },
  'seo.events.description': {
    pl: 'Warsztaty, spotkania i wydarzenia w BABA Studio w Łodzi. Sprawdź nadchodzące terminy i zapisz się na miejsce.',
    en: 'Workshops, meetups and events at BABA Studio in Lodz. See upcoming dates and book a place.'
  },
  'seo.faq.title': { pl: 'FAQ | BABA Studio', en: 'FAQ | BABA Studio' },
  'seo.faq.description': {
    pl: 'Odpowiedzi na najczęstsze pytania o zajęcia, zapisy, saunę i wizyty w BABA Studio.',
    en: 'Answers to common questions about classes, bookings, the sauna and visiting BABA Studio.'
  },
  'seo.contact.title': { pl: 'Kontakt | BABA Studio', en: 'Contact | BABA Studio' },
  'seo.contact.description': {
    pl: 'Kontakt do BABA Studio w Łodzi. Napisz do nas w sprawie zajęć i wydarzeń.',
    en: 'Contact BABA Studio in Lodz. Write to us about classes and events.'
  }
} as const satisfies Record<string, Translation>;

export type TranslationKey = keyof typeof TRANSLATIONS;
