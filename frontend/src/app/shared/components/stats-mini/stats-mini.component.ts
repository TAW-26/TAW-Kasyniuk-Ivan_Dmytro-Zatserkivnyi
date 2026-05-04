import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-stats-mini',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-mini">
      <div class="stat-mini-item">
        <div class="stat-mini-value">{{ activeCount() }}</div>
        <div class="stat-mini-label">Aktywne ogłoszenia</div>
      </div>
      <div class="stat-mini-item">
        <div class="stat-mini-value">{{ favorites.count() }}</div>
        <div class="stat-mini-label">Ulubione</div>
      </div>
    </div>
  `,
})
export class StatsMiniComponent {
  readonly activeCount = input<number>(0);
  protected readonly favorites = inject(FavoritesService);
}
