import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Category } from '../../core/models/category.model';
import { Listing, ListingFilters } from '../../core/models/listing.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AdCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .public-shell {
      min-height: 100vh;
      background: var(--gray-50);
    }

    .topbar {
      background: white;
      border-bottom: 1px solid var(--gray-200);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-brand {
      font-size: 1.4rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .topbar-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .topbar-actions .username {
      color: var(--gray-700);
      font-weight: 500;
      margin-right: 0.5rem;
    }

    .hero {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 2rem 1rem;
    }

    .hero h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .hero p {
      color: var(--gray-600);
      font-size: 1rem;
      max-width: 640px;
    }

    .listings-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem 3rem;
    }

    @media (max-width: 768px) {
      .topbar { padding: 0.75rem 1rem; }
      .hero { padding: 1.5rem 1rem 0.5rem; }
      .listings-section { padding: 0.5rem 1rem 2rem; }
      .ads-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <div class="public-shell">
      <header class="topbar">
        <a class="topbar-brand" routerLink="/">LokalneOgłoszenia</a>
        <div class="topbar-actions">
          @if (auth.isLoggedIn()) {
            <span class="username">{{ auth.user()?.username }}</span>
            <a class="btn btn-primary" routerLink="/ads">Przejdź do panelu</a>
          } @else {
            <a class="btn btn-outline" routerLink="/login">Zaloguj się</a>
            <a class="btn btn-primary" routerLink="/register">Załóż konto</a>
          }
        </div>
      </header>

      <section class="hero">
        <h1>Ogłoszenia lokalne w Twojej okolicy</h1>
        <p>
          Przeglądaj aktualne ogłoszenia, znajdź interesujące Cię oferty, a po założeniu
          konta dodawaj własne i kontaktuj się ze sprzedawcami przez wbudowany czat.
        </p>
      </section>

      <section class="listings-section">
        <form class="filter-bar" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <select formControlName="category">
            <option value="">Wszystkie kategorie</option>
            @for (cat of categories(); track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>
          <input type="text" placeholder="Szukaj ogłoszeń..." formControlName="search" />
          <select formControlName="sort">
            <option value="">Najnowsze</option>
            <option value="price_asc">Cena: rosnąco</option>
            <option value="price_desc">Cena: malejąco</option>
          </select>
          <button class="btn btn-primary" type="submit">Szukaj</button>
          <button class="btn btn-outline" type="button" (click)="resetFilters()">Wyczyść</button>
        </form>

        @if (loading()) {
          <div class="empty-state">
            <h3>Ładowanie ogłoszeń...</h3>
          </div>
        } @else if (ads().length === 0) {
          <div class="empty-state">
            <h3>Brak ogłoszeń spełniających kryteria</h3>
          </div>
        } @else {
          <div class="ads-grid">
            @for (ad of ads(); track ad._id) {
              <app-ad-card [ad]="ad" />
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly ads = signal<Listing[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: '',
    category: '',
    sort: '',
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/ads']);
      return;
    }
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notifications.show('Nie udało się pobrać kategorii'),
    });
    this.load();
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.filtersForm.reset({ search: '', category: '', sort: '' });
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: ListingFilters = {};
    if (raw.search) filters.search = raw.search;
    if (raw.category) filters.category = raw.category;
    if (raw.sort === 'price_asc' || raw.sort === 'price_desc') filters.sort = raw.sort;

    this.listingService.getAll(filters).subscribe({
      next: (list) => {
        this.ads.set(list);
        this.favorites.syncWithExisting(list.map((ad) => ad._id));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszeń');
      },
    });
  }
}
