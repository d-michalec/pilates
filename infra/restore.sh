#!/usr/bin/env bash
#
# Odtworzenie BABA Studio z kopii zapasowej.
#
# Ten skrypt istnieje przede wszystkim po to, żeby dało się go przećwiczyć na
# spokojnie. Odtwarzanie wymyślane po raz pierwszy w chwili awarii idzie źle
# zawsze - a kopia, której nikt nie próbował odtworzyć, jest tylko
# przypuszczeniem, że dane da się odzyskać.
#
#     ./restore.sh /var/backups/babastudio/baza-2026-08-19_0300.sql.gz
#
# Archiwum zdjęć z tej samej chwili znajduje się samo, po nazwie.

set -euo pipefail

KATALOG_SKRYPTU="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$KATALOG_SKRYPTU"

PLIK_BAZY="${1:-}"
if [[ -z "$PLIK_BAZY" ]]; then
	echo "Użycie: $0 <ścieżka do baza-RRRR-MM-DD_GGMM.sql.gz>" >&2
	echo "" >&2
	echo "Dostępne kopie:" >&2
	ls -1t /var/backups/babastudio/baza-*.sql.gz 2>/dev/null | head -20 >&2 || echo "  (brak)" >&2
	exit 1
fi

if [[ ! -f "$PLIK_BAZY" ]]; then
	echo "Nie ma pliku: $PLIK_BAZY" >&2
	exit 1
fi

# Archiwum zdjęć rozpoznajemy po tym samym znaczniku czasu. Jeśli go nie ma,
# idziemy dalej - lepiej odtworzyć samą bazę niż nic, ale trzeba o tym wiedzieć,
# bo strona będzie wtedy bez zdjęć.
ZNACZNIK="$(basename "$PLIK_BAZY" | sed 's/^baza-//; s/\.sql\.gz$//')"
PLIK_ZDJEC="$(dirname "$PLIK_BAZY")/uploads-$ZNACZNIK.tar.gz"

if [[ -f "$PLIK_ZDJEC" ]]; then
	echo "Kopia bazy:    $PLIK_BAZY"
	echo "Kopia zdjęć:   $PLIK_ZDJEC"
else
	echo "Kopia bazy:    $PLIK_BAZY"
	echo "Kopia zdjęć:   BRAK - odtworzę samą bazę, zdjęcia będą zwracały 404."
fi

echo ""
echo "To skasuje obecną zawartość bazy i katalogu ze zdjęciami."
read -r -p "Wpisz 'tak', żeby kontynuować: " ODPOWIEDZ
if [[ "$ODPOWIEDZ" != "tak" ]]; then
	echo "Przerwane."
	exit 1
fi

if [[ -f .env ]]; then
	# shellcheck disable=SC1091
	set -a; source .env; set +a
fi
UZYTKOWNIK_BAZY="${POSTGRES_USER:-babastudio}"
NAZWA_BAZY="${POSTGRES_DB:-babastudio}"

NAZWA_PROJEKTU="$(docker compose config --format json 2>/dev/null | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -1)"
NAZWA_PROJEKTU="${NAZWA_PROJEKTU:-babastudio}"

# Backend musi stać. Gdyby działał w trakcie, Flyway albo JPA mogłyby pisać do
# bazy w środku odtwarzania, a Hibernate trzyma w pamięci stan, który po
# podmianie danych przestaje się zgadzać.
echo "Zatrzymuję backend..."
docker compose stop backend

echo "Odtwarzam bazę..."
# Kasujemy i zakładamy schemat od nowa, zamiast wgrywać zrzut na istniejące
# tabele. Bez tego wiersze usunięte po zrobieniu kopii zostałyby w bazie, a
# odtworzenie dałoby stan, którego nigdy nie było.
docker compose exec -T postgres psql -U "$UZYTKOWNIK_BAZY" -d "$NAZWA_BAZY" \
	-c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
gzip -dc "$PLIK_BAZY" | docker compose exec -T postgres psql -U "$UZYTKOWNIK_BAZY" -d "$NAZWA_BAZY"

if [[ -f "$PLIK_ZDJEC" ]]; then
	echo "Odtwarzam zdjęcia..."
	docker run --rm \
		-v "${NAZWA_PROJEKTU}_uploads:/dane" \
		-v "$(cd "$(dirname "$PLIK_ZDJEC")" && pwd):/kopia:ro" \
		alpine sh -c "rm -rf /dane/* && tar xzf '/kopia/$(basename "$PLIK_ZDJEC")' -C /dane"
fi

echo "Uruchamiam backend..."
docker compose start backend

echo ""
echo "Gotowe. Sprawdź stronę i panel administracyjny."
echo "Jeśli strony wydarzeń mają wrócić do wyników wyszukiwania, przebuduj front:"
echo "    docker compose up -d --build web"
