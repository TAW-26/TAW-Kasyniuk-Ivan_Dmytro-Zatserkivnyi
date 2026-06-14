# Scenariusz demonstracji na żywo — Bazarek

> Towarzyszy prezentacji `Bazarek-prezentacja.pptx` (slajd 7 „Demonstracja działania").
> Demo: https://bazarek-taw.onrender.com

## Przed prezentacją (ważne)
- **Rozgrzej instancję 2–3 min wcześniej**: otwórz `https://bazarek-taw.onrender.com` i `/health`.
  Darmowy Render usypia — pierwsze żądanie po przerwie trwa ~50 s. Po rozgrzaniu działa płynnie.
- Przygotuj **dwa konta** (lub jedno na laptopie, drugie w trybie incognito) do pokazania czatu.
- Konto admina do części administracyjnej.
- Miej otwartą kartę zapasową ze zrzutami ekranu (na wypadek problemów z siecią).

## Przebieg (ok. 4–5 min)

1. **Strona główna (gość)** — lista ogłoszeń, wyszukiwanie po słowie, filtr kategorii i lokalizacji,
   sortowanie po cenie. Podkreśl: dostępne bez logowania.

2. **Szczegóły ogłoszenia** — wejdź w ogłoszenie ze zdjęciami → galeria (miniatury + główne zdjęcie).
   Zwróć uwagę: telefon sprzedawcy widoczny dopiero po zalogowaniu (prywatność).

3. **Logowanie + dodanie ogłoszenia** — zaloguj się, „Dodaj ogłoszenie".
   Pokaż walidację zdjęć (próba dodania >5 lub pliku >2 MB → komunikat) i badge „Główne" na pierwszym zdjęciu.
   Opublikuj → przejście do nowego ogłoszenia.

4. **Sprzedane / przywrócenie** — na własnym ogłoszeniu „Oznacz jako sprzedane"
   (karta przygasa, badge „Sprzedane") → następnie „Przywróć jako aktywne".

5. **Czat + ulubione** — na cudzym ogłoszeniu „Chcę kupić" → wyślij wiadomość →
   pokaż automatyczną odpowiedź (oznaczoną jako „Automatyczna odpowiedź"). Dodaj kilka ogłoszeń do ulubionych,
   wejdź w zakładkę Ulubione.

6. **Tryb ciemny + admin** — przełącznik motywu w nagłówku (odśwież F5 — motyw zostaje).
   Zaloguj się jako admin → usuwanie dowolnego ogłoszenia oraz panel/monitoring w Ustawieniach
   (`/health`, zdarzenia).

## Bonus (jeśli starczy czasu)
- **Reset hasła**: „Nie pamiętasz hasła?" → podaj e-mail → pokaż, że link generowany jest w logach backendu
  (brak zewnętrznego SMTP — świadome ograniczenie).
- **Monitoring**: krótko Grafana / `/metrics` (jeśli uruchomione lokalnie).

## Plan awaryjny
- Jeśli prod nie odpowiada (cold start) — mów dalej, instancja wstanie w ~50 s; w razie potrzeby pokaż
  lokalnie (`npm run dev` + `ng serve`) albo zrzuty ekranu z karty zapasowej.
