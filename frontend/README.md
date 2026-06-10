# Bazarek — frontend Angular 19

Frontend aplikacji ogłoszeń lokalnych. Korzysta ze standalone components, lazy loadingu, signals, strategii `OnPush` oraz Angular Material.

## Finalne funkcjonalności

- publiczna strona główna, lista i szczegóły ogłoszeń,
- rejestracja, logowanie, wylogowanie i ekran weryfikacji email,
- automatyczne odświeżanie access tokenu,
- wyszukiwanie, filtrowanie, sortowanie i paginacja ogłoszeń,
- dodawanie, edycja, usuwanie oraz oznaczanie ogłoszeń jako sprzedane,
- galeria zdjęć,
- ulubione dla gości i zalogowanych użytkowników,
- profil, ustawienia konta i motyw ciemny,
- czat oraz licznik nieprzeczytanych wiadomości,
- funkcje administracyjne dostępne zgodnie z rolą użytkownika.

## Wymagania

- Node.js >= 18,
- npm >= 9,
- działający backend na `http://localhost:5000`.

## Uruchomienie developerskie

```bash
cd frontend
npm install
npm start
```

Frontend jest dostępny pod `http://localhost:4200`. Plik `proxy.conf.json` przekazuje `/api` oraz `/health` do backendu na porcie `5000`.

## Build produkcyjny

```bash
cd frontend
npm install
npm run build -- --configuration production
```

Gotowe pliki znajdują się w `dist/frontend/browser`. W docelowym wdrożeniu katalog należy udostępnić przez serwer statyczny z fallbackiem SPA do `index.html` oraz reverse proxy `/api` do backendu.

Pełna instrukcja: [`../docs/production.md`](../docs/production.md).

## Trasy

| Ścieżka | Dostęp | Opis |
|---------|--------|------|
| `/` | publiczny | Strona główna i lista ogłoszeń |
| `/ads/:id` | publiczny | Szczegóły ogłoszenia |
| `/login` | gość | Logowanie |
| `/register` | gość | Rejestracja |
| `/verify-email` | publiczny | Weryfikacja tokenu email |
| `/ads` | JWT | Lista ogłoszeń w panelu |
| `/favorites` | JWT | Ulubione |
| `/add-ad` | JWT | Dodawanie ogłoszenia |
| `/ads/:id/edit` | JWT | Edycja własnego ogłoszenia |
| `/profile` | JWT | Profil i własne ogłoszenia |
| `/settings` | JWT | Ustawienia konta |
| `/messages` | JWT | Wiadomości |

## Dane i API

- Frontend używa relatywnego adresu API `/api`.
- Ulubione zalogowanych są synchronizowane z backendem; ulubione gości są zapisane w `localStorage`.
- Zdjęcia są konwertowane do data URL i zapisywane wraz z ogłoszeniem w MongoDB.
- Motyw jest zapisywany lokalnie w przeglądarce.

## Testy i jakość

```bash
npm test
npm run lint
npm run build -- --configuration production
```

Aktualny zestaw zawiera 11 testów komponentów w 5 plikach `*.spec.ts`.

## Znane ograniczenia

- Frontend używa relatywnego `/api`, dlatego osobne wdrożenie frontendu wymaga reverse proxy albo zmiany konfiguracji.
- Zdjęcia są przechowywane jako data URL, bez object storage i automatycznej optymalizacji.
- `ng serve --configuration production` służy tylko do lokalnej walidacji i nie zastępuje serwera statycznego z HTTPS.
- Publiczne demo działa na bezpłatnej instancji Render, która może usypiać przy braku aktywności.
