# API Documentation — ListApp

Base URL: `http://localhost:5000`

---

## Auth

### POST /api/auth/register

Rejestracja nowego uzytkownika.

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "Jan Kowalski",
  "email": "jan@example.com",
  "password": "haslo123"
}
```

**201 Created**
```json
{
  "_id": "664a...",
  "username": "Jan Kowalski",
  "email": "jan@example.com",
  "phone": "",
  "role": "user",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**400** — brakujace pola lub email juz istnieje.

---

### POST /api/auth/login

Logowanie — zwraca JWT token.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jan@example.com",
  "password": "haslo123"
}
```

**200 OK**
```json
{
  "user": {
    "_id": "664a...",
    "username": "Jan Kowalski",
    "email": "jan@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**400** — brakujace pola lub nieprawidlowe haslo.
**404** — uzytkownik nie znaleziony.

---

## Listings

### GET /api/listings

Lista ogloszen (publiczny).

```http
GET /api/listings
GET /api/listings?search=laptop
GET /api/listings?category=664a...&status=active&sort=price_asc
```

Query params:
| Param      | Opis                                          |
|------------|-----------------------------------------------|
| `search`   | Szukaj w tytule i opisie (regex, case-insensitive) |
| `category` | Filtruj po `category_id`                      |
| `status`   | `active`, `inactive`, `sold`                  |
| `sort`     | `price_asc`, `price_desc` (domyslnie: najnowsze) |

**200 OK** — tablica ogloszen z populowanymi `user_id` i `category_id`.

---

### GET /api/listings/:id

Pojedyncze ogloszenie (publiczny).

```http
GET /api/listings/664a1234abcd5678ef901234
```

**200 OK** — obiekt ogloszenia.
**404** — ogloszenie nie znalezione.

---

### GET /api/listings/user/my

Ogloszenia zalogowanego uzytkownika. **Wymaga JWT.**

```http
GET /api/listings/user/my
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — tablica ogloszen uzytkownika.

---

### POST /api/listings

Dodanie ogloszenia. **Wymaga JWT.**

```http
POST /api/listings
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "Laptop Dell XPS 15",
  "description": "16GB RAM, 512GB SSD, stan bardzo dobry",
  "price": 3500,
  "location": "Warszawa",
  "category_id": "664a..."
}
```

**201 Created** — utworzone ogloszenie.
**400** — brakujace wymagane pola (title, description, category_id).

---

### PUT /api/listings/:id

Edycja ogloszenia (tylko wlasciciel). **Wymaga JWT.**

```http
PUT /api/listings/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "Laptop Dell XPS 15 — OBNIZKA",
  "price": 2900,
  "status": "active"
}
```

**200 OK** — zaktualizowane ogloszenie.
**403** — brak uprawnien (nie jestes wlascicielem).
**404** — ogloszenie nie znalezione.

---

### DELETE /api/listings/:id

Usuniecie ogloszenia (wlasciciel lub admin). **Wymaga JWT.**

```http
DELETE /api/listings/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — `{ "message": "Ogloszenie usuniete" }`
**403** — brak uprawnien.
**404** — ogloszenie nie znalezione.

---

## Categories

### GET /api/categories

Lista kategorii (publiczny).

```http
GET /api/categories
```

**200 OK** — tablica kategorii posortowana po nazwie.

---

### POST /api/categories

Dodanie kategorii. **Wymaga JWT.**

```http
POST /api/categories
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Elektronika"
}
```

**201 Created** — utworzona kategoria.
**400** — brak nazwy lub kategoria juz istnieje.

---

### PUT /api/categories/:id

Edycja kategorii. **Wymaga JWT.**

```http
PUT /api/categories/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Elektronika i Gadgety"
}
```

**200 OK** — zaktualizowana kategoria.
**400** — brak nazwy lub nazwa juz zajeta.
**404** — kategoria nie znaleziona.

---

### DELETE /api/categories/:id

Usuniecie kategorii. **Wymaga JWT.**

```http
DELETE /api/categories/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — `{ "message": "Kategoria usunieta" }`
**404** — kategoria nie znaleziona.

---

## Admin

Wszystkie endpointy wymagaja JWT + rola `admin`.

### GET /api/admin/users

Lista uzytkownikow.

```http
GET /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — tablica uzytkownikow (bez hasel).

---

### GET /api/admin/users/:id

Pojedynczy uzytkownik.

```http
GET /api/admin/users/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — obiekt uzytkownika.
**404** — uzytkownik nie znaleziony.

---

### PUT /api/admin/users/:id/role

Zmiana roli uzytkownika.

```http
PUT /api/admin/users/664a1234abcd5678ef901234/role
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "role": "admin"
}
```

**200 OK** — zaktualizowany uzytkownik.
**400** — nieprawidlowa rola (dozwolone: `user`, `admin`).
**404** — uzytkownik nie znaleziony.

---

### DELETE /api/admin/users/:id

Usuniecie uzytkownika i wszystkich jego ogloszen.

```http
DELETE /api/admin/users/664a1234abcd5678ef901234
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**200 OK** — `{ "message": "Uzytkownik i jego ogloszenia usuniete" }`
**404** — uzytkownik nie znaleziony.

---

## Kody odpowiedzi — podsumowanie

| Kod | Znaczenie                          |
|-----|------------------------------------|
| 200 | Sukces                             |
| 201 | Zasob utworzony                     |
| 400 | Bledne dane wejsciowe / walidacja  |
| 401 | Brak tokenu autoryzacji            |
| 403 | Brak uprawnien / nieprawidlowy token |
| 404 | Zasob nie znaleziony               |
| 500 | Blad serwera                       |

---

## Autoryzacja

Chronione endpointy wymagaja naglowka:

```
Authorization: Bearer <token_z_logowania>
```

Token JWT wazny 7 dni. Uzyskiwany przez `POST /api/auth/login`.
