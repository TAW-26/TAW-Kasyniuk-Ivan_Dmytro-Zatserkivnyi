# LokalneOgłoszenia — Frontend (Angular 17)

Frontend aplikacji ogłoszeniowej zintegrowany z backendem REST (Node/Express + MongoDB).

## Wymagania

- Node.js >= 18
- npm >= 9
- Działający backend na `http://localhost:5000` (zob. `../backend`)

## Uruchomienie

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

Frontend automatycznie łączy się z `http://localhost:5000/api`. Adres można zmienić
w pliku `src/environments/environment.ts`.

## Struktura

```
src/
├── app/
│   ├── app.component.ts          # root + toasty
│   ├── app.config.ts             # provider'y (router, http, interceptor)
│   ├── app.routes.ts             # routing (lazy-loaded standalone components)
│   ├── core/
│   │   ├── guards/auth.guard.ts          # authGuard, guestGuard
│   │   ├── interceptors/auth.interceptor.ts # JWT + 401 → /login
│   │   ├── models/                       # User, Listing, Category
│   │   └── services/                     # auth, listing, category, favorites, images, notifications
│   ├── layout/
│   │   └── main-layout.component.ts      # sidebar + header
│   ├── pages/
│   │   ├── login/login.component.ts
│   │   ├── register/register.component.ts
│   │   ├── ads/ads.component.ts          # lista ogłoszeń + filtry
│   │   ├── ad-detail/ad-detail.component.ts
│   │   ├── favorites/favorites.component.ts
│   │   ├── add-ad/add-ad.component.ts
│   │   ├── profile/profile.component.ts  # mój profil + moje ogłoszenia
│   │   └── settings/settings.component.ts # zakładki: Konto / Powiadomienia / Prywatność
│   └── shared/components/
│       ├── ad-card/                      # karta ogłoszenia
│       └── stats-mini/                   # górne statystyki
├── environments/environment.ts
├── main.ts
├── index.html
└── styles.css                            # globalne style (zachowana paleta z makiety HTML)
```

## Mapowanie funkcji frontendu na backend

| UI                       | API                                          |
|--------------------------|----------------------------------------------|
| Login                    | `POST /api/auth/login`                       |
| Rejestracja              | `POST /api/auth/register`                    |
| Lista ogłoszeń + filtry  | `GET /api/listings?search&category&sort`     |
| Szczegóły ogłoszenia     | `GET /api/listings/:id`                      |
| Dodanie ogłoszenia       | `POST /api/listings` (JWT)                   |
| Usunięcie ogłoszenia     | `DELETE /api/listings/:id` (JWT)             |
| Moje ogłoszenia (Profil) | `GET /api/listings/user/my` (JWT)            |
| Kategorie (formularz)    | `GET /api/categories`                        |

Dodatkowo:
- **Ulubione** — przechowywane w `localStorage` (klucz `favorites`).
- **Zdjęcia** — backend nie obsługuje uploadu; obrazki są zapisywane lokalnie w `localStorage` (klucz `listing_images`).

## Trasy

| Ścieżka       | Komponent              | Dostęp           |
|---------------|------------------------|------------------|
| `/login`      | LoginComponent         | tylko niezalogowani |
| `/register`   | RegisterComponent      | tylko niezalogowani |
| `/ads`        | AdsComponent           | JWT              |
| `/ads/:id`    | AdDetailComponent      | JWT              |
| `/favorites`  | FavoritesComponent     | JWT              |
| `/add-ad`     | AddAdComponent         | JWT              |
| `/profile`    | ProfileComponent       | JWT              |
| `/settings`   | SettingsComponent      | JWT              |

## Konto testowe (z seed.js)

```
email:    admin@listapp.pl
hasło:    admin123
```
