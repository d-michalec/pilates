# syntax=docker/dockerfile:1

# --- Budowanie ---------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /build

# Najpierw same zależności - zmiana kodu nie unieważnia wtedy warstwy z npm ci.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# outputMode "static" w angular.json sprawia, że build wypluwa gotowy HTML dla
# każdej trasy. Dzięki temu w produkcji nie potrzebujemy procesu Node - wystarczy
# serwer plików statycznych.
RUN npm run build

# --- Uruchomienie ------------------------------------------------------------
# Caddy pełni tu dwie role naraz: serwuje pliki strony i jest bramą do backendu.
# Konfiguracja przychodzi z infra/Caddyfile jako wolumen, żeby zmiana reguł nie
# wymagała przebudowania obrazu.
FROM caddy:2-alpine AS runtime

COPY --from=build /build/dist/babastudio-frontend/browser /srv

EXPOSE 80 443
