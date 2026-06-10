# Uruchomienie i weryfikacja środowiska produkcyjnego

## Status demo

Aktualny adres:

- [https://accessibility-agenda-frank-organizational.trycloudflare.com](https://accessibility-agenda-frank-organizational.trycloudflare.com)

Status sprawdzony 11 czerwca 2026: strona, `/health` i `/api/listings` są dostępne przez HTTPS.

Adres `trycloudflare.com` jest tymczasowym Cloudflare Quick Tunnel. Działa wyłącznie, gdy komputer autorów, backend, production demo server i `cloudflared` są uruchomione. Po ponownym utworzeniu Quick Tunnel adres może się zmienić.

## Wymagane zmienne backendu

Utwórz `backend/.env`:

```dotenv
MONGO_URI=<connection-string-do-MongoDB>
JWT_SECRET=<długi-losowy-sekret>
JWT_REFRESH_SECRET=<inny-długi-losowy-sekret>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://twoja-domena.example
METRICS_TOKEN=<opcjonalny-token-monitoringu>
```

Backend nie uruchomi się bez `MONGO_URI`, `JWT_SECRET` i `JWT_REFRESH_SECRET`. `FRONTEND_URL` jest potrzebny przy osobnych originach; dla jednego serwisu Render może pozostać pusty.

## Lokalna walidacja konfiguracji produkcyjnej

Ta procedura sprawdza produkcyjny build frontendu i backend uruchomiony z `NODE_ENV=production`. Angular nadal korzysta tutaj z lokalnego dev servera, dlatego nie jest to docelowe publiczne wdrożenie.

Do pełnej weryfikacji secure refresh cookie użyj HTTPS. Test przez zwykłe lokalne HTTP służy głównie do walidacji buildu, API i podstawowego przepływu E2E.

```powershell
# terminal 1
cd backend
npm install
$env:NODE_ENV="production"
$env:FRONTEND_URL="http://localhost:4200"
$env:PORT="5000"
npm start
```

```powershell
# terminal 2
cd frontend
npm install
npm run build -- --configuration production
npm start -- --configuration production
```

Sprawdź backend:

```powershell
Invoke-RestMethod http://localhost:5000/health
```

Oczekiwany wynik zawiera:

```text
status: ok
db: connected
```

Następnie otwórz `http://localhost:4200` i sprawdź co najmniej:

1. publiczną listę oraz szczegóły ogłoszeń,
2. logowanie,
3. wyszukiwanie i filtrowanie,
4. dodanie, edycję i usunięcie własnego ogłoszenia,
5. ulubione i wiadomości,
6. wylogowanie,
7. brak błędów w konsoli przeglądarki.

## Docelowe publiczne wdrożenie

1. Zbuduj frontend:

   ```bash
   cd frontend
   npm ci
   npm run build -- --configuration production
   ```

2. Uruchom backend:

   ```bash
   cd backend
   npm ci --omit=dev
   NODE_ENV=production npm start
   ```

3. Udostępnij katalog `frontend/dist/frontend/browser` przez Nginx, Caddy albo platformę hostującą pliki statyczne.
4. Skonfiguruj fallback SPA: każda nieznana ścieżka frontendu powinna zwracać `index.html`.
5. Skonfiguruj reverse proxy:
   - `/api/*` do backendu,
   - `/health` do backendu,
   - `/metrics` do backendu, ale wyłącznie z kontrolowanym dostępem.
6. Włącz HTTPS. Jest wymagany dla refresh cookie oznaczonego jako `secure`.
7. Ustaw `FRONTEND_URL` dokładnie na publiczny origin frontendu, np. `https://bazarek.example`.

## Stałe wdrożenie na Render

Plik `render.yaml` definiuje jeden web-service, który buduje Angular frontend, uruchamia backend i udostępnia oba elementy pod jednym stałym adresem `https://<nazwa>.onrender.com`.

1. Wypchnij aktualny kod do repozytorium GitHub.
2. W Render wybierz **New → Blueprint** i wskaż repozytorium.
3. Render odczyta `render.yaml`.
4. Wprowadź wyłącznie w panelu Render:
   - `MONGO_URI`,
   - `JWT_SECRET`,
   - `JWT_REFRESH_SECRET`,
   - `METRICS_TOKEN`.
5. Po wdrożeniu sprawdź `/health`, stronę główną i logowanie.

Nie wpisuj sekretów do `render.yaml`, README ani repozytorium.

## Tymczasowe demo przez Cloudflare Quick Tunnel

Po wykonaniu production buildu uruchom production demo server:

```powershell
cd backend
$env:DEMO_PORT="4201"
$env:BACKEND_PORT="5001"
npm run serve-demo
```

Następnie utwórz tunel:

```powershell
cloudflared tunnel --url http://127.0.0.1:4201 --no-autoupdate
```

Skopiuj wygenerowany adres `https://*.trycloudflare.com` i uruchom backend z tym adresem:

```powershell
cd backend
$env:NODE_ENV="production"
$env:FRONTEND_URL="https://wygenerowany-adres.trycloudflare.com"
$env:PORT="5001"
npm start
```

Sprawdź publicznie:

- `https://wygenerowany-adres.trycloudflare.com/`,
- `https://wygenerowany-adres.trycloudflare.com/health`,
- `https://wygenerowany-adres.trycloudflare.com/api/listings`.

## Czyszczenie danych testowych

Przed prezentacją lub wdrożeniem sprawdź `MONGO_URI`, a następnie uruchom:

```bash
cd backend
npm run cleanup-test-data
```

Skrypt usuwa tylko rekordy rozpoznawane przez filtry w `backend/scripts/cleanupTestData.js`. Nietypowe dane testowe należy najpierw jednoznacznie zidentyfikować.

## Znane ograniczenia produkcyjne

- Demo korzysta z Cloudflare Quick Tunnel bez gwarancji dostępności; brak stałego hostingu i domeny.
- Brak zewnętrznego dostawcy email; link weryfikacyjny jest zapisywany w logach backendu.
- Brak object storage dla zdjęć i avatarów.
- Brak gotowej konfiguracji reverse proxy, automatycznego HTTPS i CI/CD.
- Monitoring Prometheus/Grafana wymaga osobnego uruchomienia i zabezpieczenia.
