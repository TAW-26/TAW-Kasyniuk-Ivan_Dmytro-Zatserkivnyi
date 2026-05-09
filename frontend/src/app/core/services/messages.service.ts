import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationSummary, Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/messages`;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  listConversations(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(this.baseUrl);
  }

  getConversation(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/with/${userId}`).pipe(
      tap(() => this.refreshUnreadCount()),
    );
  }

  send(payload: { to: string; content: string; listing_id?: string | null }): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, payload);
  }

  refreshUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`).subscribe({
      next: (res) => this._unreadCount.set(res.count),
      error: (err) => {
        if (err.status !== 401) console.error('[MessagesService] unread-count:', err.message);
        this._unreadCount.set(0);
      },
    });
  }

  resetUnreadCount(): void {
    this._unreadCount.set(0);
  }
}
