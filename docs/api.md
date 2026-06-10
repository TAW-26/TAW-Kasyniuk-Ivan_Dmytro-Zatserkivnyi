# API Bazarek

Domyślny lokalny base URL: `http://localhost:5000`.

Chronione endpointy wymagają nagłówka:

```http
Authorization: Bearer <accessToken>
```

Access token jest ważny 15 minut. Refresh token jest ważny 7 dni i jest przechowywany w httpOnly cookie pod ścieżką `/api/auth`.

## Auth i konto

| Metoda | Endpoint | Dostęp | Opis |
|--------|----------|--------|------|
| POST | `/api/auth/register` | publiczny, rate limit | Rejestracja użytkownika |
| POST | `/api/auth/login` | publiczny, rate limit | Zwraca `user` i `accessToken`, ustawia refresh cookie |
| POST | `/api/auth/refresh` | refresh cookie | Nowy access token |
| POST | `/api/auth/logout` | refresh cookie | Wylogowanie i unieważnienie refresh tokenu |
| GET | `/api/auth/verify/:token` | publiczny | Weryfikacja email |
| GET | `/api/auth/me` | JWT | Profil zalogowanego użytkownika |
| PUT | `/api/auth/me` | JWT | Aktualizacja `username`, `phone` i `avatar` |
| PUT | `/api/auth/me/password` | JWT | Zmiana hasła |
| DELETE | `/api/auth/me` | JWT | Usunięcie konta, ogłoszeń i wiadomości |
| POST | `/api/auth/favorites/toggle/:id` | JWT | Dodanie lub usunięcie ulubionego |
| DELETE | `/api/auth/favorites` | JWT | Wyczyszczenie ulubionych |

Przykład logowania:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jan@example.com",
  "password": "haslo123"
}
```

```json
{
  "user": {
    "_id": "664a...",
    "username": "Jan Kowalski",
    "email": "jan@example.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

W trybie `production` nowy użytkownik nie może się zalogować przed weryfikacją email. Link weryfikacyjny jest generowany w logach backendu.

## Ogłoszenia

| Metoda | Endpoint | Dostęp | Opis |
|--------|----------|--------|------|
| GET | `/api/listings` | publiczny | Lista, filtry, sortowanie i paginacja |
| GET | `/api/listings/:id` | publiczny | Szczegóły ogłoszenia |
| GET | `/api/listings/user/my` | JWT | Własne ogłoszenia |
| POST | `/api/listings` | JWT | Dodanie ogłoszenia |
| POST | `/api/listings/:id/mark-sold` | JWT, właściciel | Oznaczenie jako sprzedane |
| PUT | `/api/listings/:id` | JWT, właściciel | Edycja ogłoszenia |
| DELETE | `/api/listings/:id` | JWT, właściciel lub admin | Usunięcie ogłoszenia |

Parametry `GET /api/listings`:

| Parametr | Opis |
|----------|------|
| `search` | Wyszukiwanie w tytule i opisie |
| `category` | ID kategorii |
| `status` | `active`, `inactive` lub `sold` |
| `sort` | `price_asc` lub `price_desc`; domyślnie najnowsze |
| `page` | Numer strony, minimum 1 |
| `limit` | Liczba wyników, od 1 do 100 |
| `minPrice`, `maxPrice` | Zakres ceny |
| `location` | Lokalizacja, bez rozróżniania wielkości liter |
| `ids` | Lista ID rozdzielona przecinkami |

Dodawanie i edycja obsługują do 5 zdjęć po maksymalnie 2 MB, przekazanych jako data URL.

## Kategorie

| Metoda | Endpoint | Dostęp | Opis |
|--------|----------|--------|------|
| GET | `/api/categories` | publiczny | Lista kategorii |
| POST | `/api/categories` | JWT + admin | Dodanie kategorii |
| PUT | `/api/categories/:id` | JWT + admin | Edycja kategorii |
| DELETE | `/api/categories/:id` | JWT + admin | Usunięcie kategorii |

## Wiadomości

| Metoda | Endpoint | Dostęp | Opis |
|--------|----------|--------|------|
| GET | `/api/messages` | JWT | Lista rozmów |
| GET | `/api/messages/unread-count` | JWT | Licznik nieprzeczytanych |
| GET | `/api/messages/with/:userId` | JWT | Rozmowa z użytkownikiem i oznaczenie jako przeczytane |
| POST | `/api/messages` | JWT | Wysłanie wiadomości |

Treść `POST /api/messages`:

```json
{
  "to": "ID_ODBIORCY",
  "content": "Czy ogłoszenie jest aktualne?",
  "listing_id": "OPCJONALNE_ID_OGLOSZENIA"
}
```

## Administracja

Wszystkie endpointy wymagają JWT użytkownika z rolą `admin`.

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/admin/users` | Lista użytkowników |
| GET | `/api/admin/users/:id` | Szczegóły użytkownika |
| PUT | `/api/admin/users/:id/role` | Zmiana roli na `user` lub `admin` |
| DELETE | `/api/admin/users/:id` | Usunięcie użytkownika, jego ogłoszeń i wiadomości |

## Monitoring

| Metoda | Endpoint | Dostęp | Opis |
|--------|----------|--------|------|
| GET | `/health` | publiczny | Status backendu i MongoDB |
| GET | `/metrics` | `METRICS_TOKEN` lub JWT admina | Metryki Prometheus |
| GET | `/api/monitoring/events.json` | `METRICS_TOKEN` lub JWT admina | Bufor ostatnich zdarzeń |
| GET | `/api/monitoring/events.rss` | `METRICS_TOKEN` lub JWT admina | Zdarzenia w RSS |

## Najważniejsze kody odpowiedzi

| Kod | Znaczenie |
|-----|-----------|
| 200 | Operacja zakończona poprawnie |
| 201 | Zasób utworzony |
| 400 | Niepoprawne dane wejściowe |
| 401 | Brak lub wygaśnięcie wymaganych danych uwierzytelniających |
| 403 | Brak uprawnień albo niezweryfikowane konto |
| 404 | Zasób nie istnieje |
| 429 | Przekroczony limit prób logowania/rejestracji |
| 500 | Nieobsłużony błąd serwera |
