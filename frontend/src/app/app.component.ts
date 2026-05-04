import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    @for (toast of notifications.toasts(); track toast.id) {
      <div class="toast">{{ toast.message }}</div>
    }
  `,
})
export class AppComponent {
  protected readonly notifications = inject(NotificationService);
}
