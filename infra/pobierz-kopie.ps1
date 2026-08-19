# Ściąga najnowszą kopię zapasową z serwera na ten komputer.
#
# Kopia leżąca wyłącznie na serwerze nie chroni przed utratą samego serwera.
# To polecenie robi z niej kopię poza serwerem - warto puścić je po każdej
# większej zmianie treści, a poza tym raz na jakiś czas.
#
#     .\pobierz-kopie.ps1
#     .\pobierz-kopie.ps1 -Serwer root@51.83.0.1 -Docelowy D:\kopie\baba
#
# Wymaga klienta scp, który w Windowsie 10 i 11 jest wbudowany.

param(
	# Adres serwera w postaci użytkownik@host. Domyślną wartość podmień po
	# zakupie VPS-a, żeby dało się uruchamiać skrypt bez argumentów.
	[string]$Serwer = "root@babapilates.pl",

	# Katalog na serwerze, do którego pisze backup.sh.
	[string]$KatalogZdalny = "/var/backups/babastudio",

	# Gdzie zapisać kopie na tym komputerze.
	[string]$Docelowy = "$env:USERPROFILE\Kopie\babastudio"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $Docelowy | Out-Null

Write-Host "Szukam najnowszej kopii na $Serwer..."

# Nazwę pliku ustala serwer, nie my. Data w nazwie kopii to data jej wykonania,
# a nie dzisiejsza - gdyby nocny backup nie wystartował, ściągnęlibyśmy plik,
# którego nie ma, i skrypt zgłosiłby to zamiast udawać, że wszystko gra.
$nazwaBazy = ssh $Serwer "ls -1t $KatalogZdalny/baza-*.sql.gz 2>/dev/null | head -1"
if ([string]::IsNullOrWhiteSpace($nazwaBazy)) {
	Write-Error "Na serwerze nie ma żadnej kopii bazy w $KatalogZdalny. Czy backup.sh w ogóle się uruchomił?"
	exit 1
}

$znacznik = [System.IO.Path]::GetFileName($nazwaBazy) -replace '^baza-', '' -replace '\.sql\.gz$', ''
$nazwaZdjec = "$KatalogZdalny/uploads-$znacznik.tar.gz"

Write-Host "Znaleziona kopia z: $znacznik"
Write-Host "Ściągam bazę..."
scp "${Serwer}:${nazwaBazy}" $Docelowy

Write-Host "Ściągam zdjęcia..."
scp "${Serwer}:${nazwaZdjec}" $Docelowy

Write-Host ""
Write-Host "Gotowe. Pliki są w: $Docelowy"
Get-ChildItem $Docelowy -Filter "*$znacznik*" | Format-Table Name, @{Name="Rozmiar"; Expression={"{0:N1} MB" -f ($_.Length / 1MB)}}

Write-Host "Pamiętaj: te pliki zawierają dane osobowe z formularza kontaktowego" -ForegroundColor Yellow
Write-Host "i listy newslettera. Nie zostawiaj ich na pulpicie na zawsze." -ForegroundColor Yellow
