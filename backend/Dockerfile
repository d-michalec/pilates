# syntax=docker/dockerfile:1

# --- Budowanie ---------------------------------------------------------------
# Zależności kopiujemy przed źródłami, żeby zmiana kodu nie unieważniała warstwy
# z pobranymi bibliotekami. Przy tym projekcie to różnica kilku minut na build.
FROM eclipse-temurin:21-jdk AS build

WORKDIR /build

COPY gradlew ./
COPY gradle ./gradle
COPY settings.gradle build.gradle ./

RUN chmod +x gradlew && ./gradlew --no-daemon dependencies

COPY src ./src

# Testy pomijamy świadomie: wymagają bazy, a obraz ma powstawać także wtedy, gdy
# jej nie ma. Testy należą do potoku CI, nie do budowania obrazu.
RUN ./gradlew --no-daemon clean bootJar -x test

# --- Uruchomienie ------------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime

# Obraz JRE nie zawiera curla, a healthcheck musi czymś odpytać aplikację.
RUN apt-get update \
	&& apt-get install --no-install-recommends -y curl \
	&& rm -rf /var/lib/apt/lists/*

# Aplikacja nie potrzebuje roota, a kontener bez niego jest trudniejszy do przejęcia.
RUN groupadd --system babastudio && useradd --system --gid babastudio babastudio

WORKDIR /app

COPY --from=build /build/build/libs/*.jar app.jar

# Katalog na pliki wgrane z panelu. Montowany jako wolumen - bez tego znikałyby
# przy każdym odtworzeniu kontenera.
RUN mkdir -p /app/uploads && chown -R babastudio:babastudio /app

USER babastudio

EXPOSE 8080

ENV UPLOADS_DIR=/app/uploads

# Odpytujemy publiczny endpoint ustawień: odpowiada dopiero, gdy wstał kontekst
# Springa i baza jest osiągalna, więc mówi o czymś więcej niż otwarty port.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
	CMD curl --fail --silent --output /dev/null http://localhost:8080/api/settings || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
