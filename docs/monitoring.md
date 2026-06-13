# Monitoring aplikacji Bazarek (List-App)

## 1. Narzędzia monitoringu

| Warstwa | Narzędzie | Funkcja |
|---------|-----------|---------|
| Eksport metryk | prom-client (Node.js) | Counter/Histogram/Gauge + metryki Node.js |
| Zbieranie metryk | Prometheus 3.12.0 | Pull /metrics co 15s |
| Wizualizacja | Grafana 13.0.1 | Dashboard z wykresami |
| Logowanie | pino + pino-http + pino-roll | Logi JSON z rotacją dzienną |
| Health-check | GET /health | Status DB + uptime |
| Audit log | event w logach JSON | Logowanie krytycznych operacji |
| Kontrola dostępu | metricsAuthMiddleware | /metrics chroniony tokenem Bearer lub JWT admin |

## 2. Endpointy monitoringu

| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/metrics` | GET | Bearer token lub JWT admin | Metryki Prometheus |
| `/health` | GET | Brak | Status aplikacji (publiczny) |
| `/api/monitoring/events.json` | GET | Bearer token lub JWT admin | Ostatnie zdarzenia jako JSON |
| `/api/monitoring/events.rss` | GET | Bearer token lub JWT admin | Ostatnie zdarzenia jako RSS |

## 3. Metryki

### Customowe HTTP
- `http_requests_total` (Counter) - etykiety: method, route, status_code
- `http_request_duration_ms` (Histogram) - kubełki: 5/10/25/50/100/250/500/1000 ms
- `active_connections` (Gauge)

### Domyślne Node.js
- `process_cpu_user_seconds_total`, `process_cpu_system_seconds_total`
- `process_resident_memory_bytes` (RSS)
- `nodejs_heap_size_total_bytes`, `nodejs_heap_size_used_bytes`
- `nodejs_eventloop_lag_seconds`
- `nodejs_gc_duration_seconds`

## 4. Logi strukturalne (pino)

Format JSON, jedna linia = jedno zdarzenie.

### Lokalizacja
- Katalog: `backend/logs/`
- Rotacja: codziennie + przy 20 MB

### Audit log (pole `event`)
| event | poziom | kiedy |
|-------|--------|-------|
| `auth.register` | info | rejestracja |
| `auth.login` | info | logowanie |
| `auth.login.failed` | warn | nieudane logowanie |
| `auth.logout` | info | wylogowanie |
| `listing.deleted` | info | usunięcie ogłoszenia |
| `listing.delete.forbidden` | warn | próba usunięcia bez praw |
| `http.error` | error/warn | błąd HTTP |

### Redact (dane wrażliwe)
Automatycznie maskowane: `req.headers.authorization`, `req.headers.cookie`, `req.body.password`, `res.headers["set-cookie"]`

## 5. Health-check

`GET /health` → odpowiedź:
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 3621,
  "timestamp": "2026-05-31T18:42:11.123Z"
}
```

Pola: `status` (`ok` / `error`), `db` (`connected` / `disconnected`), `uptime` (sekundy działania procesu), `timestamp` (ISO 8601).

## 6. Konfiguracja Prometheus + Grafana (Windows, bez Dockera)

Pełny przepływ krok po kroku znajduje się w sekcji „Monitoring" w [`README.md`](../README.md). Skrót konfiguracji:

### Prometheus

1. Pobierz Prometheusa dla Windows z [prometheus.io/download](https://prometheus.io/download/) i rozpakuj (np. `C:\tools\prometheus`).
2. Użyj gotowego pliku `backend/prometheus.yml` z repozytorium — definiuje scrape targetu `list-app-backend` co 15 s.
3. Ten sam token ustaw w dwóch miejscach:
   - `backend/.env` → `METRICS_TOKEN=...`,
   - `prometheus.yml` → `authorization.credentials: '...'`.
4. Uruchom: `prometheus.exe --config.file=<ścieżka>\backend\prometheus.yml`.
5. UI: <http://localhost:9090> → **Status → Targets** → target powinien być `UP`.

### Grafana

1. Pobierz Grafana OSS dla Windows z [grafana.com/grafana/download](https://grafana.com/grafana/download?platform=windows).
2. Uruchom (domyślnie <http://localhost:3000>, login `admin` / `admin`).
3. Dodaj datasource **Prometheus** → URL `http://localhost:9090` → **Save & Test**.
4. Importuj dashboard z `backend/grafana-dashboard.json` (Dashboards → New → Import → Upload JSON file).

Dashboard pokazuje: request rate, p50/p95/p99 latency, active connections, status codes, RSS/heap, CPU.

## 7. Monitorowanie czasu odpowiedzi

Czas odpowiedzi mierzy [`backend/middleware/metricsMiddleware.js`](../backend/middleware/metricsMiddleware.js):

- każde żądanie jest mierzone przez `process.hrtime.bigint()` i zapisywane do histogramu `http_request_duration_ms`,
- żądanie wolniejsze niż `SLOW_REQUEST_THRESHOLD_MS` (domyślnie `500` ms) zwiększa licznik `slow_requests_total`, generuje log `event: "http.slow"` (poziom `warn`) oraz wpis w buforze zdarzeń (`/api/monitoring/events.json`),
- próg można zmienić zmienną środowiskową `SLOW_REQUEST_THRESHOLD_MS`.

W Grafanie czas odpowiedzi obserwuje się na panelach p50/p95/p99 latency, a wolne żądania — przez wzrost `slow_requests_total`.

## 8. Testy stabilności pod obciążeniem

Skrypt [`backend/scripts/loadtest.js`](../backend/scripts/loadtest.js) (oparty na `autocannon`) sprawdza stabilność backendu pod obciążeniem.

### Uruchomienie

```powershell
cd backend
npm run loadtest
# z innymi parametrami:
$env:TARGET="https://bazarek-taw.onrender.com"; $env:DURATION="30"; $env:CONNECTIONS="50"; npm run loadtest
```

### Parametry (zmienne środowiskowe)

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `TARGET` | `http://localhost:5000` | Adres testowanej instancji |
| `DURATION` | `20` | Czas trwania każdego scenariusza (s) |
| `CONNECTIONS` | `50` | Liczba równoległych połączeń |
| `PIPELINING` | `1` | Liczba żądań w pipeline |
| `P99_MAX_MS` | `4000` | Próg p99 dla zaliczenia |
| `RPS_MIN` | `20` | Minimalny RPS dla zaliczenia |

### Scenariusze

`GET /`, `GET /health`, `GET /api/listings?limit=20`, `GET /api/categories`.

### Progi zaliczenia (PASS/FAIL)

- błędy (`errors + timeouts + non2xx`) ≤ **1 %**,
- p99 latency ≤ **4000 ms**,
- średni RPS ≥ **20**.

Skrypt drukuje tabelę z RPS, p50/p95/p99, % błędów i kończy się kodem `0` (PASSED) albo `1` (FAILED), co pozwala użyć go w CI.

## 9. Zewnętrzny uptime (UptimeRobot)

Niezależnie od lokalnego stosu Prometheus/Grafana zalecany jest zewnętrzny monitor dostępności:

1. Załóż konto w [UptimeRobot](https://uptimerobot.com/) i dodaj monitor typu **HTTP(s)**.
2. URL: `https://bazarek-taw.onrender.com/health`.
3. Interwał: 5 minut.
4. Keyword check: monitor ma wykrywać słowo `ok` w odpowiedzi (`"status":"ok"`).
5. Skonfiguruj powiadomienie e-mail przy statusie `DOWN`.

Monitor zewnętrzny wykrywa niedostępność (np. uśpienie instancji Render) nawet wtedy, gdy lokalny Prometheus nie działa.

## 10. Smoke-testy i alerty

### Smoke-testy

Szybka weryfikacja po wdrożeniu (PowerShell):

```powershell
Invoke-RestMethod https://bazarek-taw.onrender.com/health
Invoke-RestMethod https://bazarek-taw.onrender.com/api/listings?limit=1
Invoke-RestMethod https://bazarek-taw.onrender.com/api/categories
```

Oczekiwane: `/health` zwraca `status: ok` i `db: connected`, pozostałe endpointy zwracają dane bez błędu.

### Alerty

- **UptimeRobot** — e-mail przy `DOWN` na `/health` (podstawowy alert dostępności).
- **Grafana** — opcjonalne reguły alertów na panelach: p99 latency powyżej progu oraz wzrost `http_errors_total{error_class="server"}`.
- **Logi pino** — zdarzenia `severity: "error"` w `backend/logs/` oraz wpisy `http.error` i `http.slow` w buforze zdarzeń (`/api/monitoring/events.json` / `.rss`) służą jako źródło alertów po stronie aplikacji.
