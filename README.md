# Bazarek — Inteligentny system ogłoszeń lokalnych

Aplikacja webowa do publikowania i przeglądania ogłoszeń lokalnych z wbudowanym czatem, panelem administratora oraz trybem ciemnym.

**Autorzy:** Ivan Kasyniuk (37696), Dmytro Zatserkivnyi (37751)

## Funkcjonalności

- Rejestracja i logowanie (JWT access token 15 min + refresh token 7 dni w httpOnly cookie)
- Weryfikacja email przy rejestracji (auto-weryfikacja w trybie dev; w produkcji link na maila)
- Ogłoszenia: dodawanie, edycja, usuwanie, wyszukiwanie, filtrowanie (kategoria, lokalizacja, cena), sortowanie i paginacja
- Właściciel oznacza ogłoszenie jako sprzedane (`/mark-sold`)
- Przycisk „Chcę kupić" otwiera czat z pre-wypełnioną wiadomością do sprzedawcy
- Kategorie (CRUD — tylko administrator)
- Ulubione ogłoszenia (synchronizowane z bazą danych dla zalogowanych; localStorage dla gości)
- Czat 1-na-1 z licznikiem nieprzeczytanych i automatyczną odpowiedzią przy pierwszej wiadomości
- Profil użytkownika z avatarem (PNG/JPG/WebP, max 2 MB)
- Ustawienia konta: zmiana hasła (unieważnia wszystkie sesje), usunięcie konta, przełącznik motywu
- Panel administratora: zarządzanie użytkownikami, rolami i ogłoszeniami

## Bezpieczeństwo

| Środek | Opis |
|--------|------|
| Access token 15 min | Krótki czas życia ogranicza skutki wycieku |
| Refresh token httpOnly cookie | JS nie może odczytać tokenu odświeżającego |
| Auto-refresh w interceptorze | 401 → cicha wymiana tokenu, użytkownik nie zauważa |
| Unieważnienie refresh token | Logout i zmiana hasła usuwają token z bazy |
| Rate limiting | Max 10 prób logowania / rejestracji na 15 min |
| Email weryfikacja | Konto blokowane do potwierdzenia (produkcja) |
| Email sprzedawcy ukryty | API nie zwraca emaila w publicznych endpointach |
| Walidacja zdjęć | Max 5 zdjęć, max 2 MB każde |
| Oznaczanie jako sprzedane | Tylko właściciel (nie kupujący) |
| Walidacja ObjectId | Endpointy z parametrem ID weryfikują format MongoDB ObjectId |

## Wymagania

- Node.js >= 18
- npm >= 9
- Angular CLI >= 17 → `npm install -g @angular/cli`
- MongoDB (lokalnie lub Atlas)

### Zmienne środowiskowe (`backend/.env`)

| Zmienna              | Opis                                                    | Wymagana |
|----------------------|---------------------------------------------------------|----------|
| `MONGO_URI`          | Connection string do MongoDB                            | tak      |
| `JWT_SECRET`         | Sekret do podpisywania access tokenów                   | tak      |
| `JWT_REFRESH_SECRET` | Sekret do podpisywania refresh tokenów                  | tak      |
| `PORT`               | Port serwera (domyślnie `5000`)                         | nie      |
| `FRONTEND_URL`       | Adres frontendu dla CORS (wymagany w produkcji)         | prod     |
| `NODE_ENV`           | `production` włącza weryfikację email i secure cookies  | nie      |

> Serwer nie uruchomi się bez `MONGO_URI`, `JWT_SECRET` i `JWT_REFRESH_SECRET`. W trybie `production` wymagany jest też `FRONTEND_URL`.

Wzór: `backend/env.example` (skopiuj do `backend/.env`).

## Uruchomienie

### 1. Klonowanie

```bash
git clone https://github.com/TAW-26/TAW-Kasyniuk-Ivan_Dmytro-Zatserkivnyi.git
cd TAW-Kasyniuk-Ivan_Dmytro-Zatserkivnyi
```

### 2. Backend

```bash
cd backend
npm install
cp env.example .env     # uzupełnij MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm run seed            # inicjalizacja bazy (admin, kategorie, przykładowe ogłoszenia)
npm run dev             # http://localhost:5000 (nodemon)
# alternatywnie:
# npm start             # bez nodemon
```

### 3. Frontend

```bash
cd frontend
npm install
npx ng serve            # http://localhost:4200
```

> Frontend korzysta z proxy (`proxy.conf.json`) — zapytania `/api/*` są przekierowywane do `http://localhost:5000`. Nie ma potrzeby ręcznej konfiguracji CORS w przeglądarce.

## Technologie

| Warstwa      | Technologie                                                              |
|--------------|--------------------------------------------------------------------------|
| Frontend     | Angular 17 (standalone, signals, OnPush), TypeScript, Angular Material   |
| Backend      | Node.js, Express 5, JWT, Mongoose, bcrypt, cookie-parser, express-rate-limit |
| Baza danych  | MongoDB (Atlas lub lokalnie)                                             |

## Struktura projektu

```
backend/
├── config/
│   └── db.js                    # połączenie z MongoDB
├── controllers/
│   ├── authController.js        # rejestracja, logowanie, refresh, logout,
│   │                            # weryfikacja email, profil, zmiana hasła,
│   │                            # usuwanie konta, ulubione
│   ├── listingController.js     # CRUD ogłoszeń, walidacja zdjęć, mark-sold,
│   │                            # filtrowanie (minPrice, maxPrice, location, ids)
│   ├── categoryController.js    # CRUD kategorii (tylko admin)
│   ├── messageController.js     # czat: rozmowy, wiadomości, auto-reply, licznik
│   └── adminController.js       # zarządzanie użytkownikami i rolami
├── middleware/
│   ├── authMiddleware.js        # weryfikacja JWT (401 TOKEN_EXPIRED / 403 invalid)
│   ├── adminMiddleware.js       # weryfikacja roli administratora
│   └── errorHandler.js         # globalny handler błędów
├── models/
│   ├── User.js                  # użytkownik (avatar, telefon, rola, isVerified,
│   │                            # refreshToken, favorites[])
│   ├── Listing.js               # ogłoszenie
│   ├── Category.js              # kategoria
│   └── Message.js               # wiadomość czatu
├── routes/
│   ├── auth.js                  # endpointy autoryzacji (z rate limiterem)
│   ├── listings.js              # endpointy ogłoszeń
│   ├── categories.js            # endpointy kategorii
│   ├── messages.js              # endpointy czatu
│   └── admin.js                 # endpointy panelu admina
├── seed.js                      # skrypt inicjalizujący bazę danych
├── server.js                    # główny plik serwera
└── package.json

frontend/src/app/
├── core/
│   ├── interceptors/auth.interceptor.ts  # dodaje token, auto-refresh przy 401
│   ├── models/                           # interfejsy TypeScript
│   └── services/                        # auth, listing, messages, favorites, ...
├── layout/                      # main-layout z menu i nagłówkiem
├── pages/                       # ads, ad-detail, add-ad, favorites, home,
│                                # login, messages, profile, register, settings
└── shared/                      # komponenty współdzielone (ad-card, stats-mini, ...)
```

## API Endpoints

### Auth i konto

| Metoda | Endpoint                          | Opis                                                   | Dostęp    |
|--------|-----------------------------------|--------------------------------------------------------|-----------|
| POST   | `/api/auth/register`              | Rejestracja (rate limited, auto-weryfikacja w dev)     | publiczny |
| POST   | `/api/auth/login`                 | Logowanie → `accessToken` + httpOnly refresh cookie    | publiczny |
| POST   | `/api/auth/refresh`               | Wymiana refresh tokenu na nowy access token            | cookie    |
| POST   | `/api/auth/logout`                | Wylogowanie (usuwa refresh token z bazy i cookie)      | cookie    |
| GET    | `/api/auth/verify/:token`         | Weryfikacja adresu email                               | publiczny |
| GET    | `/api/auth/me`                    | Profil zalogowanego użytkownika (z listą favorites)    | JWT       |
| PUT    | `/api/auth/me`                    | Aktualizacja profilu (username, telefon, avatar)       | JWT       |
| PUT    | `/api/auth/me/password`           | Zmiana hasła (unieważnia wszystkie sesje)              | JWT       |
| DELETE | `/api/auth/me`                    | Usunięcie konta (wraz z ogłoszeniami i wiadomościami)  | JWT       |
| POST   | `/api/auth/favorites/toggle/:id`  | Dodanie / usunięcie ogłoszenia z ulubionych            | JWT       |
| DELETE | `/api/auth/favorites`             | Wyczyszczenie wszystkich ulubionych                    | JWT       |

### Listings (Ogłoszenia)

| Metoda | Endpoint                        | Opis                                                      | Dostęp    |
|--------|---------------------------------|-----------------------------------------------------------|-----------|
| GET    | `/api/listings`                 | Lista z filtrami: `search`, `category`, `status`, `sort`, `page`, `limit`, `minPrice`, `maxPrice`, `location`, `ids` | publiczny |
| GET    | `/api/listings/:id`             | Szczegóły ogłoszenia (email sprzedawcy ukryty)            | publiczny |
| GET    | `/api/listings/user/my`         | Ogłoszenia zalogowanego użytkownika                       | JWT       |
| POST   | `/api/listings`                 | Dodanie ogłoszenia (max 5 zdjęć, max 2 MB)               | JWT       |
| POST   | `/api/listings/:id/mark-sold`   | Oznaczenie jako sprzedane (tylko właściciel)              | JWT       |
| PUT    | `/api/listings/:id`             | Edycja (właściciel lub admin)                             | JWT       |
| DELETE | `/api/listings/:id`             | Usunięcie (właściciel lub admin)                          | JWT       |

**Parametry filtrowania GET `/api/listings`:**

| Parametr    | Typ    | Opis                                          |
|-------------|--------|-----------------------------------------------|
| `search`    | string | Wyszukiwanie w tytule i opisie                |
| `category`  | string | ID kategorii                                  |
| `status`    | string | `active` \| `inactive` \| `sold`              |
| `sort`      | string | `price_asc` \| `price_desc`                   |
| `page`      | number | Numer strony (domyślnie `1`)                  |
| `limit`     | number | Wyników na stronę (domyślnie `20`)            |
| `minPrice`  | number | Minimalna cena                                |
| `maxPrice`  | number | Maksymalna cena                               |
| `location`  | string | Filtr lokalizacji (regex, case-insensitive)   |
| `ids`       | string | Lista ID po przecinku — zwraca tylko te rekordy |

### Categories

| Metoda | Endpoint                | Opis                  | Dostęp      |
|--------|-------------------------|-----------------------|-------------|
| GET    | `/api/categories`       | Lista kategorii       | publiczny   |
| POST   | `/api/categories`       | Dodanie kategorii     | JWT + admin |
| PUT    | `/api/categories/:id`   | Edycja kategorii      | JWT + admin |
| DELETE | `/api/categories/:id`   | Usunięcie kategorii   | JWT + admin |

### Messages (Czat)

| Metoda | Endpoint                          | Opis                                                        | Dostęp |
|--------|-----------------------------------|-------------------------------------------------------------|--------|
| GET    | `/api/messages`                   | Lista rozmów (z licznikiem nieprzeczytanych)                | JWT    |
| GET    | `/api/messages/unread-count`      | Liczba nieprzeczytanych wiadomości                          | JWT    |
| GET    | `/api/messages/with/:userId`      | Konwersacja z użytkownikiem (oznacza jako przeczytane)      | JWT    |
| POST   | `/api/messages`                   | Wysłanie wiadomości (auto-reply przy pierwszej wiadomości)  | JWT    |

### Admin

| Metoda | Endpoint                       | Opis                      | Dostęp      |
|--------|--------------------------------|---------------------------|-------------|
| GET    | `/api/admin/users`             | Lista użytkowników        | JWT + admin |
| GET    | `/api/admin/users/:id`         | Szczegóły użytkownika     | JWT + admin |
| PUT    | `/api/admin/users/:id/role`    | Zmiana roli użytkownika   | JWT + admin |
| DELETE | `/api/admin/users/:id`         | Usunięcie użytkownika (wraz z ogłoszeniami i wiadomościami) | JWT + admin |

## Autoryzacja

Chronione endpointy wymagają nagłówka:

```
Authorization: Bearer <access_token>
```

Access token ważny **15 minut**. Po wygaśnięciu Angular interceptor automatycznie wywołuje `POST /api/auth/refresh` (używając httpOnly cookie) i ponawia zapytanie — użytkownik nie zauważa przerwy.

## Seed — dane początkowe

Komenda `npm run seed` tworzy:

- **Konto admina** — `admin@listapp.pl` / `admin123`
- **10 kategorii** — Elektronika, Motoryzacja, Nieruchomości, Praca, Usługi, Moda, Dom i Ogród, Sport, Muzyka, Inne
- **3 przykładowe ogłoszenia**

Skrypt jest idempotentny — nie duplikuje danych przy ponownym uruchomieniu.

## Dokumentacja

- [Diagram ERD](docs/ERD_DIAGRAM.png)
- [Diagram Use Case](docs/Use_Case.png)
- [Kolekcja Postman](docs/ListApp.postman_collection.json)
