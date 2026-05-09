import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../core/models/category.model';
import { Listing, ListingPayload } from '../../core/models/listing.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ImagesService } from '../../core/services/images.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-add-ad',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .content-section {
        padding: 2rem;
      }
      @media (max-width: 768px) {
        .content-section {
          padding: 1rem;
        }
      }
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .form-card {
        max-width: 600px;
        background: var(--card);
        border: 1px solid var(--border);
        padding: 2rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }
      .hidden-input {
        display: none;
      }
    `,
  ],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">{{ isEditMode() ? 'Edytuj ogłoszenie' : 'Dodaj nowe ogłoszenie' }}</div>
      </div>

      <form class="form-grid form-card" [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Tytuł ogłoszenia</mat-label>
          <input matInput formControlName="title" placeholder="Np. Mieszkanie 3 pokoje do wynajęcia" />
          @if (showError('title', 'required')) {
            <mat-error>Tytuł jest wymagany</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Kategoria</mat-label>
          <mat-select formControlName="category_id">
            @if (categories().length === 0) {
              <mat-option disabled value="">Brak dostępnych kategorii</mat-option>
            }
            @for (cat of categories(); track cat._id) {
              <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
            }
          </mat-select>
          @if (showError('category_id', 'required')) {
            <mat-error>Wybierz kategorię</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cena (zł)</mat-label>
          <input matInput type="number" min="0" formControlName="price" placeholder="np. 1500" />
          @if (showError('price', 'required')) {
            <mat-error>Cena jest wymagana</mat-error>
          }
          @if (showError('price', 'min')) {
            <mat-error>Cena nie może być ujemna</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Lokalizacja</mat-label>
          <mat-icon matPrefix>location_on</mat-icon>
          <input matInput formControlName="location" placeholder="Miasto, dzielnica" />
          @if (showError('location', 'required')) {
            <mat-error>Lokalizacja jest wymagana</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Opis</mat-label>
          <textarea
            matInput
            rows="5"
            formControlName="description"
            placeholder="Szczegółowy opis ogłoszenia..."
          ></textarea>
          @if (showError('description', 'required')) {
            <mat-error>Opis jest wymagany</mat-error>
          }
        </mat-form-field>

        @if (isEditMode()) {
          <mat-form-field appearance="outline">
            <mat-label>Status ogłoszenia</mat-label>
            <mat-select formControlName="status">
              <mat-option value="active">Aktywne</mat-option>
              <mat-option value="inactive">Nieaktywne</mat-option>
              <mat-option value="sold">Sprzedane</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <div class="form-group">
          <label>Zdjęcia</label>
          <div class="image-upload-area" (click)="fileInput.click()">
            <mat-icon>add_photo_alternate</mat-icon>
            Kliknij, aby dodać zdjęcia
          </div>
          <input
            #fileInput
            type="file"
            multiple
            accept="image/*"
            class="hidden-input"
            (change)="onFilesSelected($event)"
          />
          <div class="image-preview-container">
            @for (img of images(); track $index) {
              <div class="image-preview">
                <img [src]="img" alt="Preview" />
                <button type="button" class="remove-image" (click)="removeImage($index)">×</button>
              </div>
            }
          </div>
        </div>

        <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            {{ isEditMode() ? 'Zapisz zmiany' : 'Opublikuj ogłoszenie' }}
          }
        </button>
      </form>
    </div>
  `,
})
export class AddAdComponent implements OnInit {
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly imagesService = inject(ImagesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly images = signal<string[]>([]);
  protected readonly isEditMode = computed(() => !!this.id());

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    category_id: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    location: ['', [Validators.required]],
    description: ['', [Validators.required]],
    status: ['active' as 'active' | 'inactive' | 'sold'],
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notifications.show('Nie udało się pobrać kategorii'),
    });
    if (this.id()) {
      this.loadForEdit(this.id()!);
    }
  }

  showError(field: 'title' | 'category_id' | 'price' | 'location' | 'description' | 'status', error: string): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.touched && ctrl.hasError(error);
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const dataUrls = await Promise.all(files.map((f) => this.imagesService.fileToDataUrl(f)));
    this.images.update((current) => [...current, ...dataUrls]);
    input.value = '';
  }

  removeImage(index: number): void {
    this.images.update((list) => list.filter((_, i) => i !== index));
  }

  private loadForEdit(id: string): void {
    this.loading.set(true);
    this.listingService.getOne(id).subscribe({
      next: (listing) => {
        if (!this.isOwner(listing)) {
          this.loading.set(false);
          this.notifications.show('Możesz edytować tylko własne ogłoszenia');
          this.router.navigate(['/ads', id]);
          return;
        }
        this.form.patchValue({
          title: listing.title,
          category_id: typeof listing.category_id === 'string' ? listing.category_id : listing.category_id._id,
          price: listing.price ?? 0,
          location: listing.location ?? '',
          description: listing.description,
          status: listing.status,
        });
        this.images.set(listing.images ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszenia');
        this.router.navigate(['/ads']);
      },
    });
  }

  private isOwner(listing: Listing): boolean {
    const user = this.auth.user();
    if (!user) return false;
    const ownerId = typeof listing.user_id === 'string' ? listing.user_id : (listing.user_id as User)._id;
    return ownerId === user._id;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();
    const payload: ListingPayload = {
      title: value.title,
      description: value.description,
      price: Number(value.price),
      location: value.location,
      category_id: value.category_id,
      images: this.images(),
      ...(this.id() ? { status: value.status } : {}),
    };
    const request = this.id() ? this.listingService.update(this.id()!, payload) : this.listingService.create(payload);

    request.subscribe({
      next: (created) => {
        this.loading.set(false);
        this.notifications.show(
          this.isEditMode() ? 'Ogłoszenie zostało zaktualizowane' : 'Ogłoszenie zostało opublikowane',
        );
        this.router.navigate(['/ads', created._id]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.notifications.show(err.error?.message ?? 'Błąd publikowania');
      },
    });
  }
}
