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