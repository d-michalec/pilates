#!/usr/bin/env bash
#
# Kopia zapasowa BABA Studio: zrzut bazy i archiwum wgranych zdjęć.
#
# Zabezpieczamy dwie rzeczy, bo są od siebie niezależne. W bazie leżą treści
# strony, wiadomości z formularza i zapisy do newslettera, ale zdjęcia są w niej
# tylko z nazwy - same pliki siedzą w wolumenie "uploads". Odtworzenie samej bazy
# daje stronę, na której każde zdjęcie zwraca 404.
#
# Uruchomienie ręczne:
#     cd ~/pilates/infra && ./backup.sh
#
# Uruchomienie z crona - patrz DEPLOY.md, rozdział o kopii zapasowej.

# Ustawienia interpretera, po kolei:
#   -e            przerwij przy pierwszym błędzie
#   -u            przerwij przy użyciu niezdefiniowanej zmiennej
#   -o pipefail   błąd w środku potoku psuje cały potok, a nie tylko swój krok
#
# Ostatnia opcja jest tu najważniejsza. Bez niej "pg_dump | gzip" kończy się
# powodzeniem także wtedy, gdy pg_dump padnie - bo gzip swoją część wykonał
# bez zarzutu. Powstaje wtedy poprawne archiwum z pustą albo uciętą bazą
# w środku, a skrypt melduje sukces. Taka kopia jest gorsza niż jej brak,
# bo daje fałszywe poczucie bezpieczeństwa aż do dnia, w którym trzeba jej użyć.
set -euo pipefail

KATALOG_SKRYPTU="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$KATALOG_SKRYPTU"

# Domyślnie kopie lądują obok projektu, nie w nim - żeby "git status" nie
# pokazywał ich jako nieznanych plików i żeby nie dało się ich przypadkiem
# zacommitować. Zawierają dane osobowe.
KATALOG_KOPII="${KATALOG_KOPII:-/var/backups/babastudio}"
DNI_PRZECHOWYWANIA="${DNI_PRZECHOWYWANIA:-14}"

DATA="$(date +%Y-%m-%d_%H%M)"

# Katalog domyślny należy do roota, a skrypt uruchamia użytkownik ubuntu. Zamiast
# wywracać się z niejasnym błędem uprawnień w środku pracy, sprawdzamy to na
# wejściu i mówimy wprost, co zrobić.
if ! mkdir -p "$KATALOG_KOPII" 2>/dev/null || [[ ! -w "$KATALOG_KOPII" ]]; then
	echo "Nie mogę pisać do $KATALOG_KOPII." >&2
	echo "Załóż katalog i nadaj mu właściciela:" >&2
	echo "    sudo mkdir -p $KATALOG_KOPII && sudo chown \$USER:\$USER $KATALOG_KOPII" >&2
	echo "Albo wskaż inne miejsce: KATALOG_KOPII=~/kopie ./backup.sh" >&2
	exit 1
fi

# Nazwa projektu Compose - stąd biorą się nazwy wolumenów (babastudio_uploads).
NAZWA_PROJEKTU="$(docker compose config --format json 2>/dev/null | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -1)"
NAZWA_PROJEKTU="${NAZWA_PROJEKTU:-babastudio}"

# Login i nazwa bazy muszą się zgadzać z tym, czym baza została założona.
# Bierzemy je z .env, żeby nie powielać wartości w dwóch miejscach.
if [[ -f .env ]]; then
	# shellcheck disable=SC1091
	set -a; source .env; set +a
fi
UZYTKOWNIK_BAZY="${POSTGRES_USER:-babastudio}"
NAZWA_BAZY="${POSTGRES_DB:-babastudio}"

PLIK_BAZY="$KATALOG_KOPII/baza-$DATA.sql.gz"
PLIK_ZDJEC="$KATALOG_KOPII/uploads-$DATA.tar.gz"

echo "Kopia zapasowa BABA Studio, $DATA"
echo "Katalog docelowy: $KATALOG_KOPII"

# --- Baza -------------------------------------------------------------------
# Piszemy najpierw do pliku tymczasowego. Gdyby zrzut padł w połowie, w katalogu
# zostanie plik z rozszerzeniem .czesciowy, którego nie da się pomylić z gotową
# kopią - a nie obcięty plik wyglądający jak każdy inny.
echo -n "  baza danych... "
docker compose exec -T postgres pg_dump -U "$UZYTKOWNIK_BAZY" "$NAZWA_BAZY" \
	| gzip > "$PLIK_BAZY.czesciowy"
mv "$PLIK_BAZY.czesciowy" "$PLIK_BAZY"
echo "$(du -h "$PLIK_BAZY" | cut -f1)"

# --- Zdjęcia ----------------------------------------------------------------
# Wolumen podpinamy do jednorazowego kontenera, bo z zewnątrz nie ma do niego
# dostępu przez zwykłą ścieżkę. Alpine wystarczy - potrzebujemy tylko tar-a.
echo -n "  zdjęcia... "
docker run --rm \
	-v "${NAZWA_PROJEKTU}_uploads:/dane:ro" \
	-v "$KATALOG_KOPII:/kopia" \
	alpine tar czf "/kopia/$(basename "$PLIK_ZDJEC").czesciowy" -C /dane .
mv "$PLIK_ZDJEC.czesciowy" "$PLIK_ZDJEC"
echo "$(du -h "$PLIK_ZDJEC" | cut -f1)"

# --- Sprawdzenie ------------------------------------------------------------
# Samo powstanie pliku nic nie znaczy. Zrzut pustej bazy też jest poprawnym
# plikiem gzip. Szukamy więc w środku tabeli, która musi tam być.
echo -n "  sprawdzenie zawartości... "
if ! gzip -dc "$PLIK_BAZY" | grep -q 'CREATE TABLE'; then
	echo "BŁĄD"
	echo "Zrzut bazy nie zawiera żadnej tabeli. Kopia jest bezużyteczna." >&2
	exit 1
fi
if ! tar tzf "$PLIK_ZDJEC" > /dev/null; then
	echo "BŁĄD"
	echo "Archiwum zdjęć jest uszkodzone." >&2
	exit 1
fi
echo "ok"

# --- Sprzątanie -------------------------------------------------------------
# Kasujemy dopiero na końcu i tylko wtedy, gdy nowa kopia powstała i przeszła
# sprawdzenie. Odwrotna kolejność oznaczałaby, że nieudany backup zostawia nas
# bez starych kopii i bez nowej.
USUNIETE="$(find "$KATALOG_KOPII" -maxdepth 1 -name '*.gz' -mtime "+$DNI_PRZECHOWYWANIA" -print -delete | wc -l)"
echo "  usunięto kopii starszych niż $DNI_PRZECHOWYWANIA dni: $USUNIETE"

echo "Gotowe."
