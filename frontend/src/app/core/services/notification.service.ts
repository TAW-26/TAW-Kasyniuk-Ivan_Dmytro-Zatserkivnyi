import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(message: string, durationMs: number = 3000): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, message }]);
    setTimeout(() => {
      this._toasts.update((list) => list.filter((t) => t.id !== id));
    }, durationMs);
  }
}
