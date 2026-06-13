import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Category } from '../../core/models/category.model';
import { Listing, ListingFilters } from '../../core/models/listing.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdCardComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .shell {
        min-height: 100vh;
        background: var(--bg);
        display: flex;
        flex-direction: column;
      }

      :host ::ng-deep .app-toolbar {
        background: var(--card) !important;
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 50;
        gap: 0.5rem;
        padding: 0 1.5rem;
      }
      .brand {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--primary);
        letter-spacing: -0.5px;
        text-decoration: none;
      }
      .flex-spacer {
        flex: 1 1 auto;
      }

      .hero {
        background: linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 60%, var(--primary-light) 100%);
        color: #fff;
        padding: 5rem 2rem 6rem;
        text-align: center;
      }
      .hero-inner {
        max-width: 680px;
        margin: 0 auto;
      }
      .hero h1 {
        font-size: clamp(1.75rem, 4vw, 2.75rem);
        font-weight: 800;
        line-height: 1.2;
        margin: 0 0 1rem;
        letter-spacing: -0.5px;
      }
      .hero p {
        font-size: 1.05rem;
        opacity: 0.9;
        margin: 0 0 2.25rem;
        line-height: 1.65;
      }
      .hero-cta {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .hero-cta .btn-white {
        background-color: #fff !important;
        color: var(--primary) !important;
      }
      .hero-cta .btn-outline-white {
        color: #fff !important;
        border-color: rgba(255, 255, 255, 0.65) !important;
      }
      .hero-cta .btn-outline-white:hover {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      .filter-section {
        background: var(--card);
        border-bottom: 1px solid var(--border);
        padding: 0.75rem 2rem;
      }
      .filter-bar mat-form-field {
        flex: 1;
        min-width: 130px;
      }
      .filter-bar mat-form-field.grow {
        flex: 2;
        min-width: 200px;
      }
      .filter-bar button[mat-stroked-button] {
        height: 56px;
        border-color: var(--border);
        color: var(--text);
        font-size: 0.875rem;
      }
      .filter-bar button[mat-stroked-button]:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--primary-50);
      }

      .trust-row {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.75rem 2rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
      }
      :host ::ng-deep .trust-row .mat-mdc-chip {
        background: var(--card) !important;
        color: var(--gray-500) !important;
        border: 1px solid var(--border) !important;
        pointer-events: none;
      }
      :host ::ng-deep .trust-row .mat-mdc-chip .mat-icon {
        color: var(--primary);
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }

      .section {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2.5rem 2rem 0;
      }
      .section-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin-bottom: 0.875rem;
      }
      :host ::ng-deep .cat-chip-list .mat-mdc-chip-option {
        font-weight: 600;
        white-space: nowrap;
      }
      :host ::ng-deep .cat-chip-list .mat-mdc-chip-option.mat-mdc-chip-selected,
      :host ::ng-deep .cat-chip-list .mat-mdc-chip-option:focus {
        background: var(--primary-50) !important;
        color: var(--primary) !important;
      }
      :host ::ng-deep .cat-chip-list .mdc-evolution-chip__checkmark {
        display: none;
      }

      .listings-section {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 2rem 4rem;
      }
      :host ::ng-deep .listings-section .ads-grid {
        display: flex !important;
        flex-wrap: nowrap !important;
        overflow-x: auto;
        gap: 1rem;
        padding-bottom: 0.75rem;
        scrollbar-width: thin;
        scrollbar-color: var(--border) transparent;
      }
      :host ::ng-deep .listings-section .ads-grid > * {
        min-width: 260px;
        max-width: 260px;
        flex-shrink: 0;
      }
      .listings-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .listings-title {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .listings-count {
        font-size: 0.8rem;
        color: var(--gray-400);
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--gray-400);
      }

      .cta-wrap {
        max-width: 1200px;
        width: calc(100% - 4rem);
        margin: 0 auto 4rem;
      }
      :host ::ng-deep .cta-card {
        background: linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 100%) !important;
        color: #fff;
        text-align: center;
      }
      :host ::ng-deep .cta-card .mat-mdc-card-content {
        padding: 2.5rem 2rem !important;
      }
      .cta-card h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
        color: #fff;
      }
      .cta-card p {
        opacity: 0.88;
        margin: 0 0 1.75rem;
        font-size: 0.95rem;
        color: #fff;
      }
      .btn-cta-white {
        background-color: #fff !important;
        color: var(--primary) !important;
        font-weight: 700 !important;
        padding: 0 1.75rem !important;
        height: 44px !important;
      }

      @media (max-width: 860px) {
        .filter-section {
          padding: 0.75rem 1rem;
        }
      }
      @media (max-width: 600px) {
        :host ::ng-deep .app-toolbar {
          padding: 0 1rem;
        }
        .hero {
          padding: 3rem 1rem 4.5rem;
        }
        .filter-section {
          padding: 0.5rem 1rem;
        }
        .section {
          padding: 2rem 1rem 0;
        }
        .listings-section {
          padding: 1.5rem 1rem 3rem;
        }
        .cta-wrap {
          width: calc(100% - 2rem);
          margin: 0 auto 3rem;
        }
        :host ::ng-deep .cta-card .mat-mdc-card-content {
          padding: 2rem 1.25rem !important;
        }
      }
    `,
  ],
  template: `
    <div class="shell">
      <mat-toolbar class="app-toolbar">
        <a class="brand" routerLink="/">Bazarek</a>
        <span class="flex-spacer"></span>
        <button
          mat-icon-button
          [matTooltip]="darkMode() ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'"
          [attr.aria-label]="darkMode() ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'"
          (click)="toggleTheme()"
        >
          <mat-icon>{{ darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <a mat-stroked-button routerLink="/login">Zaloguj się</a>
        <a mat-flat-button color="primary" routerLink="/register">Zarejestruj się</a>
      </mat-toolbar>
      <section class="hero">
        <div class="hero-inner">
          <h1>Kupuj i sprzedawaj lokalnie<br />bez prowizji i pośredników</h1>
          <p>
            Tysiące ogłoszeń w Twojej okolicy. Kontaktuj się bezpośrednio ze sprzedawcą — szybko, bezpiecznie i za
            darmo.
          </p>
          <div class="hero-cta">
            <a mat-flat-button class="btn-white" routerLink="/register">
              <mat-icon>add_circle</mat-icon>
              Dodaj ogłoszenie za darmo
            </a>
            <a mat-stroked-button class="btn-outline-white" routerLink="/login">
              <mat-icon>login</mat-icon>
              Zaloguj się
            </a>
          </div>
        </div>
      </section>
      <div class="filter-section">
        <form class="filter-bar" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
          <mat-form-field appearance="outline">
            <mat-label>Kategoria</mat-label>
            <mat-select formControlName="category">
              <mat-option value="">Wszystkie kategorie</mat-option>
              @for (cat of categories(); track cat._id) {
                <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="grow">
            <mat-label>Szukaj ogłoszeń</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput formControlName="search" placeholder="Wpisz słowo kluczowe..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lokalizacja</mat-label>
            <mat-icon matPrefix>location_on</mat-icon>
            <input matInput formControlName="location" placeholder="Miasto..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cena od (zł)</mat-label>
            <input matInput type="number" min="0" formControlName="minPrice" placeholder="0" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cena do (zł)</mat-label>
            <input matInput type="number" min="0" formControlName="maxPrice" placeholder="bez limitu" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sortuj</mat-label>
            <mat-select formControlName="sort">
              <mat-option value="">Najnowsze</mat-option>
              <mat-option value="price_asc">Cena: rosnąco</mat-option>
              <mat-option value="price_desc">Cena: malejąco</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button type="submit"><mat-icon>search</mat-icon> Szukaj</button>
          <button mat-stroked-button type="button" (click)="resetFilters()"><mat-icon>clear</mat-icon> Wyczyść</button>
        </form>
      </div>
      <mat-divider />
      <div class="trust-row">
        <mat-chip-set>
          <mat-chip><mat-icon matChipAvatar>verified</mat-icon> Bezpłatne ogłoszenia</mat-chip>
          <mat-chip><mat-icon matChipAvatar>lock</mat-icon> Bezpieczny kontakt</mat-chip>
          <mat-chip><mat-icon matChipAvatar>location_on</mat-icon> Ogłoszenia lokalne</mat-chip>
          <mat-chip><mat-icon matChipAvatar>chat_bubble</mat-icon> Czat z ogłoszeniodawcą</mat-chip>
        </mat-chip-set>
      </div>
      <mat-divider />
      @if (categories().length > 0) {
        <div class="section">
          <div class="section-label">Przeglądaj kategorie</div>
          <mat-chip-listbox
            class="cat-chip-list"
            [value]="activeCategory()"
            (change)="selectCategory($event.value ?? '')"
          >
            <mat-chip-option value="">Wszystkie</mat-chip-option>
            @for (cat of categories(); track cat._id) {
              <mat-chip-option [value]="cat._id">{{ cat.name }}</mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }
      <div class="listings-section">
        <div class="listings-header">
          <div class="listings-title">
            {{ activeCategory() ? categoryName(activeCategory()) : 'Najnowsze ogłoszenia' }}
          </div>
          @if (!loading()) {
            <div class="listings-count">{{ ads().length }} ogłoszeń</div>
          }
        </div>

        @if (loading()) {
          <div class="ads-grid">
            @for (s of [1, 2, 3, 4, 5, 6]; track s) {
              <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton-body">
                  <div class="skeleton skeleton-line"></div>
                  <div class="skeleton skeleton-line short"></div>
                  <div class="skeleton skeleton-line price"></div>
                </div>
              </div>
            }
          </div>
        } @else if (ads().length === 0) {
          <div class="empty">
            <p>Brak ogłoszeń spełniających kryteria. Spróbuj zmienić filtry.</p>
          </div>
        } @else {
          <div class="ads-grid">
            @for (ad of ads(); track ad._id) {
              <app-ad-card [ad]="ad" />
            }
          </div>
        }
      </div>
      <div class="cta-wrap">
        <mat-card class="cta-card">
          <mat-card-content>
            <h2>Masz coś do sprzedania?</h2>
            <p>Dodaj ogłoszenie w 2 minuty — całkowicie za darmo, bez prowizji.</p>
            <a mat-flat-button class="btn-cta-white" routerLink="/register">
              <mat-icon>add_circle</mat-icon>
              Zacznij teraz
            </a>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  protected readonly ads = signal<Listing[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly darkMode = this.theme.darkMode;
  protected readonly activeCategory = signal('');

  protected readonly filtersForm = this.fb.nonNullable.group({
    category: '',
    search: '',
    location: '',
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    sort: '',
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/ads']);
      return;
    }
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {},
    });
    this.load();
  }

  applyFilters(): void {
    this.activeCategory.set(this.filtersForm.getRawValue().category);
    this.load();
  }

  resetFilters(): void {
    this.filtersForm.reset({ category: '', search: '', location: '', minPrice: null, maxPrice: null, sort: '' });
    this.activeCategory.set('');
    this.load();
  }

  selectCategory(id: string): void {
    this.activeCategory.set(id);
    this.filtersForm.patchValue({ category: id });
    this.load();
  }

  categoryName(id: string): string {
    return this.categories().find((category) => category._id === id)?.name ?? '';
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  private load(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: ListingFilters = { limit: 20 };
    if (raw.search) filters.search = raw.search;
    if (raw.category) filters.category = raw.category;
    if (raw.location) filters.location = raw.location;
    if (raw.minPrice !== null && raw.minPrice !== undefined) filters.minPrice = raw.minPrice;
    if (raw.maxPrice !== null && raw.maxPrice !== undefined) filters.maxPrice = raw.maxPrice;
    if (raw.sort) filters.sort = raw.sort as 'price_asc' | 'price_desc';

    this.listingService.getAll(filters).subscribe({
      next: (list) => {
        this.ads.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszeń');
      },
    });
  }
}
