# Inteligentny system ogloszen lokalnych

Aplikacja webowa umozliwiajaca publikowanie i przegladanie ogloszen lokalnych.

**Autorzy:** Ivan Kasyniuk (37696), Dmytro Zatserkivnyi (37751)

## Wymagania

- Node.js >= 18
- npm >= 9
- Angular CLI >= 17 → `npm install -g @angular/cli`
- MongoDB (lokalnie lub Atlas)

## Uruchomienie

### 1. Klonowanie

```bash
git clone https://github.com/TAW-26/TAW-Kasyniuk-Ivan_Dmytro-Zatserkivnyi.git
cd TAW-Kasyniuk-Ivan_Dmytro-Zatserkivnyi
```

### 2. Backend

```bash
cd list-app
npm install
cp .env.example .env   # uzupelnij MONGO_URI i JWT_SECRET
npm run seed            # inicjalizacja bazy (admin, kategorie, przykladowe ogloszenia)
npm run dev             # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve                # http://localhost:4200
```

## Technologie

| Warstwa      | Technologie                              |
|--------------|------------------------------------------|
| Frontend     | Angular 17, TypeScript, Angular Material |
| Backend      | Node.js, Express, JWT, Mongoose          |
| Baza danych  | MongoDB (Atlas)                          |

## Struktura projektu

```
list-app/
├── config/
│   └── db.js                    # polaczenie z MongoDB
├── controllers/
│   ├── authController.js        # rejestracja i logowanie
│   ├── listingController.js     # CRUD ogloszen, wyszukiwanie, filtrowanie
│   ├── categoryController.js    # CRUD kategorii
│   └── adminController.js       # zarzadzanie uzytkownikami i rolami
├── middleware/
│   ├── authMiddleware.js        # weryfikacja tokenow JWT
│   └── adminMiddleware.js       # weryfikacja roli administratora
├── models/
│   ├── User.js                  # schemat uzytkownika
│   ├── Listing.js               # schemat ogloszenia
│   └── Category.js              # schemat kategorii
├── routes/
│   ├── auth.js                  # endpointy autoryzacji
│   ├── listings.js              # endpointy ogloszen
│   ├── categories.js            # endpointy kategorii
│   └── admin.js                 # endpointy panelu admina
├── seed.js                      # skrypt inicjalizujacy baze danych
├── server.js                    # glowny plik serwera
└── package.json
```

## API Endpoints

### Auth

| Metoda | Endpoint              | Opis                      | Dostep   |
|--------|-----------------------|---------------------------|----------|
| POST   | `/api/auth/register`  | Rejestracja uzytkownika   | publiczny |
| POST   | `/api/auth/login`     | Logowanie (zwraca JWT)    | publiczny |

### Listings (Ogloszenia)

| Metoda | Endpoint                 | Opis                          | Dostep       |
|--------|--------------------------|-------------------------------|--------------|
| GET    | `/api/listings`          | Lista ogloszen (filtrowanie, sortowanie) | publiczny |
| GET    | `/api/listings/:id`      | Szczegoly ogloszenia          | publiczny    |
| GET    | `/api/listings/user/my`  | Ogloszenia zalogowanego usera | JWT          |
| POST   | `/api/listings`          | Dodanie ogloszenia            | JWT          |
| PUT    | `/api/listings/:id`      | Edycja ogloszenia (wlasciciel)| JWT          |
| DELETE | `/api/listings/:id`      | Usuniecie (wlasciciel/admin)  | JWT          |

### Categories (Kategorie)

| Metoda | Endpoint                | Opis                  | Dostep    |
|--------|-------------------------|-----------------------|-----------|
| GET    | `/api/categories`       | Lista kategorii       | publiczny |
| POST   | `/api/categories`       | Dodanie kategorii     | JWT       |
| PUT    | `/api/categories/:id`   | Edycja kategorii      | JWT       |
| DELETE | `/api/categories/:id`   | Usuniecie kategorii   | JWT       |

### Admin

| Metoda | Endpoint                       | Opis                      | Dostep     |
|--------|--------------------------------|---------------------------|------------|
| GET    | `/api/admin/users`             | Lista uzytkownikow        | JWT + admin |
| GET    | `/api/admin/users/:id`         | Szczegoly uzytkownika     | JWT + admin |
| PUT    | `/api/admin/users/:id/role`    | Zmiana roli uzytkownika   | JWT + admin |
| DELETE | `/api/admin/users/:id`         | Usuniecie uzytkownika     | JWT + admin |

## Autoryzacja

Chronione endpointy wymagaja naglowka:

```
Authorization: Bearer <token_z_logowania>
```

Token JWT wazny 7 dni. Uzyskiwany przez `POST /api/auth/login`.

## Seed — dane poczatkowe

Komenda `npm run seed` tworzy:

- **Konto admina** — `admin@listapp.pl` / `admin123`
- **10 kategorii** — Elektronika, Motoryzacja, Nieruchomosci, Praca, Uslugi, Moda, Dom i Ogrod, Sport, Muzyka, Inne
- **3 przykladowe ogloszenia**

Skrypt jest idempotentny — nie duplikuje danych przy ponownym uruchomieniu.

## Testowanie API

Kolekcja Postman: [`docs/ListApp.postman_collection.json`](docs/ListApp.postman_collection.json)

Import: Postman → File → Import → wybierz plik.

Pelna dokumentacja API z przykladami zapytan: [`docs/api.md`](docs/api.md)

## Dokumentacja

- [Diagram ERD](docs/ERD_DIAGRAM.png)
- [Diagram Use Case](docs/Use_Case.png)
- [Dokumentacja API](docs/api.md)
- [Kolekcja Postman](docs/ListApp.postman_collection.json)
