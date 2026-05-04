import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { ImagesService } from '../../core/services/images.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-add-ad',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .content-section { padding: 2rem; }
    @media (max-width: 768px) {
      .content-section { padding: 1rem; }
    }
    .section-header { display: flex; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; }
    .form-card {
      max-width: 600px;
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }
    .hidden-input {
      display: none;
    }
  `],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Dodaj nowe ogłoszenie</div>
      </div>

      <form class="form-grid form-card" [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label>Tytuł ogłoszenia *</label>
          <input type="text" formControlName="title" placeholder="Np. Mieszkanie 3 pokoje do wynajęcia" />
          @if (showError('title', 'required')) {
            <span class="error-text">Tytuł jest wymagany</span>
          }
        </div>

        <div class="form-group">
          <label>Kategoria *</label>
          <select formControlName="category_id">
            <option value="" disabled>-- wybierz --</option>
            @for (cat of categories(); track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>
          @if (showError('category_id', 'required')) {
            <span class="error-text">Wybierz kategorię</span>
          }
        </div>

        <div class="form-group">
          <label>Cena (zł) *</label>
          <input type="number" min="0" formControlName="price" placeholder="Cena w zł" />
          @if (showError('price', 'required')) {
            <span class="error-text">Cena jest wymagana</span>
          }
          @if (showError('price', 'min')) {
            <span class="error-text">Cena nie może być ujemna</span>
          }
        </div>

        <div class="form-group">
          <label>Lokalizacja *</label>
          <input type="text" formControlName="location" placeholder="Miasto, dzielnica" />
          @if (showError('location', 'required')) {
            <span class="error-text">Lokalizacja jest wymagana</span>
          }
        </div>

        <div class="form-group">
          <label>Opis *</label>
          <textarea rows="5" formControlName="description" placeholder="Szczegółowy opis ogłoszenia..."></textarea>
          @if (showError('description', 'required')) {
            <span class="error-text">Opis jest wymagany</span>
          }
        </div>

        <div class="form-group">
          <label>Zdjęcia</label>
          <div class="image-upload-area" (click)="fileInput.click()">
            Kliknij, aby dodać zdjęcia
          </div>
          <input
            #fileInput
            type="file"
            multiple
            accept="image/*"
            class="hidden-input"
            (change)="onFilesSelected($event)" />
          <div class="image-preview-container">
            @for (img of images(); track $index) {
              <div class="image-preview">
                <img [src]="img" alt="Preview" />
                <button type="button" class="remove-image" (click)="removeImage($index)">×</button>
              </div>
            }
          </div>
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Publikowanie...' : 'Opublikuj ogłoszenie' }}
        </button>
      </form>
    </div>
  `,
})
export class AddAdComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly imagesService = inject(ImagesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly images = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    category_id: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    location: ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notifications.show('Nie udało się pobrać kategorii'),
    });
  }

  showError(
    field: 'title' | 'category_id' | 'price' | 'location' | 'description',
    error: string
  ): boolean {
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();
    this.listingService
      .create({
        title: value.title,
        description: value.description,
        price: Number(value.price),
        location: value.location,
        category_id: value.category_id,
        images: this.images(),
      })
      .subscribe({
        next: (created) => {
          this.loading.set(false);
          this.notifications.show('Ogłoszenie zostało opublikowane');
          this.router.navigate(['/ads', created._id]);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.notifications.show(err.error?.message ?? 'Błąd publikowania');
        },
      });
  }
}
