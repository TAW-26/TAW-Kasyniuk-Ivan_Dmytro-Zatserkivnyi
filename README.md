# Inteligentny system ogłoszeń lokalnych

Aplikacja webowa umożliwiająca publikowanie i przeglądanie ogłoszeń lokalnych.

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
cp .env.example .env   # uzupełnij MONGO_URI i JWT_SECRET
npm run dev             # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve                # http://localhost:4200
```

## Technologie

| Warstwa      | Technologie                          |
|--------------|--------------------------------------|
| Frontend     | Angular 17, TypeScript, Angular Material |
| Backend      | Node.js, Express, JWT, Mongoose      |
| Baza danych  | MongoDB                              |

## Struktura projektu

```
list-app/
├── config/
│   └── db.js                # połączenie z MongoDB
├── controllers/
│   └── authController.js    # logika rejestracji i logowania
├── middleware/
│   └── authMiddleware.js    # weryfikacja tokenów JWT
├── models/
│   └── User.js              # schemat użytkownika
├── routes/
│   └── auth.js              # endpointy autoryzacji
├── server.js                # główny plik serwera
└── package.json
```

## API Endpoints

| Metoda | Endpoint             | Opis                |
|--------|----------------------|---------------------|
| GET    | `/`                  | Health check        |
| POST   | `/api/auth/register` | Rejestracja         |
| POST   | `/api/auth/login`    | Logowanie (zwraca JWT) |

## Dokumentacja

- [Diagram ERD](docs/ERD_DIAGRAM.png)
- [Diagram Use Case](docs/Use_Case.png)
