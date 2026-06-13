import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConversationSummary, Message } from '../../core/models/message.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MessagesService } from '../../core/services/messages.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .chat-shell {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        padding: 1.5rem 2rem;
        height: calc(100vh - 70px);
      }

      @media (max-width: 900px) {
        .chat-shell {
          grid-template-columns: 1fr;
          height: auto;
          padding: 1rem;
        }
        .conversations-pane.has-active {
          display: none;
        }
      }

      .conversations-pane {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 400px;
      }

      .pane-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--gray-200);
        font-weight: 600;
      }

      .conversation-list {
        flex: 1;
        overflow-y: auto;
      }

      .conversation-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 0.85rem 1.25rem;
        cursor: pointer;
        border-bottom: 1px solid var(--gray-100);
        transition: background 0.15s;
      }

      .conversation-row:hover {
        background: var(--gray-50);
      }

      .conversation-row.active {
        background: var(--primary-50);
        border-left: 3px solid var(--primary);
      }

      .conversation-avatar {
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        font-size: 0.9rem;
        overflow: hidden;
      }
      .conversation-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .message-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
        max-width: 70%;
      }
      .message-row.mine {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .message-row.theirs {
        align-self: flex-start;
      }
      .message-row .conversation-avatar {
        width: 28px;
        height: 28px;
        font-size: 0.7rem;
      }
      .message-row .message-bubble {
        max-width: 100%;
      }
      .message-row.mine + .message-meta {
        align-self: flex-end;
      }

      .conversation-meta {
        flex: 1;
        min-width: 0;
      }

      .conversation-name {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.92rem;
      }

      .conversation-time {
        color: var(--gray-500);
        font-size: 0.7rem;
        font-weight: 400;
        flex-shrink: 0;
      }

      .conversation-preview {
        color: var(--gray-600);
        font-size: 0.825rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .unread-badge {
        background: var(--primary);
        color: white;
        border-radius: 999px;
        padding: 0.125rem 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        margin-left: 0.5rem;
      }

      .empty-list {
        padding: 2rem 1rem;
        text-align: center;
        color: var(--gray-500);
      }

      .chat-pane {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 400px;
      }

      .chat-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .chat-header .partner-name {
        font-weight: 600;
      }

      .chat-header .partner-meta {
        color: var(--gray-500);
        font-size: 0.8rem;
      }

      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: var(--surface);
      }

      .message-bubble {
        padding: 0.5rem 0.85rem;
        border-radius: 14px;
        max-width: 70%;
        font-size: 0.92rem;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .auto-reply-tag {
        display: block;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        opacity: 0.7;
        margin-bottom: 0.2rem;
      }

      .message-bubble.mine {
        align-self: flex-end;
        background: var(--primary);
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      .message-bubble.theirs {
        align-self: flex-start;
        background: var(--card);
        color: var(--text);
        border: 1px solid var(--gray-200);
        border-bottom-left-radius: 4px;
      }

      .message-meta {
        font-size: 0.7rem;
        color: var(--gray-500);
        margin-top: 0.15rem;
      }

      .message-bubble.mine + .message-meta,
      .message-meta.mine {
        align-self: flex-end;
      }

      .listing-context {
        align-self: center;
        color: var(--gray-500);
        font-size: 0.75rem;
        padding: 0.25rem 0.6rem;
        background: var(--gray-100);
        border-radius: 999px;
        margin: 0.25rem 0;
      }

      .composer {
        border-top: 1px solid var(--gray-200);
        padding: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--card);
      }

      .composer textarea {
        flex: 1;
        resize: none;
        height: 44px;
        min-height: 44px;
        max-height: 44px;
        padding: 0.6rem 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius);
        font-family: inherit;
        font-size: 0.9rem;
        line-height: 1.4;
        background: var(--gray-100);
        color: var(--text);
        overflow-y: auto;
      }

      .composer button {
        align-self: center;
        flex: 0 0 64px;
        height: 44px;
        min-width: 64px;
      }

      .placeholder-pane {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-500);
        padding: 2rem;
        text-align: center;
      }

      .back-btn {
        background: transparent;
        border: 1px solid var(--gray-300);
        color: var(--gray-700);
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius);
        cursor: pointer;
        font-size: 0.85rem;
        display: none;
      }

      @media (max-width: 900px) {
        .back-btn {
          display: inline-flex;
        }
      }
    `,
  ],
  template: `
    <div class="chat-shell">
      <aside class="conversations-pane" [class.has-active]="!!activePartner()">
        <div class="pane-header">Rozmowy</div>
        <div class="conversation-list">
          @if (loadingConversations()) {
            <div class="empty-list">Ładowanie...</div>
          } @else if (conversations().length === 0) {
            <div class="empty-list">Brak rozmów. Otwórz dowolne ogłoszenie i napisz do sprzedawcy.</div>
          } @else {
            @for (conv of conversations(); track conv.partner._id) {
              <div
                class="conversation-row"
                [class.active]="activePartner()?._id === conv.partner._id"
                (click)="openConversation(conv.partner)"
              >
                <div class="conversation-avatar">
                  @if (conv.partner.avatar) {
                    <img [src]="conv.partner.avatar" [alt]="conv.partner.username" />
                  } @else {
                    {{ initials(conv.partner.username) }}
                  }
                </div>
                <div class="conversation-meta">
                  <div class="conversation-name">
                    <span>
                      {{ conv.partner.username }}
                      @if (conv.unreadCount > 0) {
                        <span class="unread-badge">{{ conv.unreadCount }}</span>
                      }
                    </span>
                    <span class="conversation-time">{{ formatTime(conv.lastMessage.createdAt) }}</span>
                  </div>
                  <div class="conversation-preview">{{ conv.lastMessage.content }}</div>
                </div>
              </div>
            }
          }
        </div>
      </aside>

      <section class="chat-pane">
        @if (!activePartner()) {
          <div class="placeholder-pane">
            <div>
              <p>Wybierz rozmowę z listy po lewej stronie</p>
              <p style="font-size: 0.85rem; margin-top: 0.5rem;">
                lub otwórz ogłoszenie i kliknij <strong>Napisz</strong>, aby rozpocząć nową rozmowę.
              </p>
            </div>
          </div>
        } @else {
          <div class="chat-header">
            <button class="back-btn" type="button" (click)="closeConversation()">&larr; Lista</button>
            <div class="conversation-avatar">
              @if (partnerAvatar()) {
                <img [src]="partnerAvatar()" [alt]="activePartner()!.username" />
              } @else {
                {{ initials(activePartner()!.username) }}
              }
            </div>
            <div>
              <div class="partner-name">{{ activePartner()!.username }}</div>
              <div class="partner-meta">{{ activePartner()!.email }}</div>
            </div>
          </div>

          <div #messagesArea class="messages-area">
            @if (loadingMessages()) {
              <div class="placeholder-pane">Ładowanie wiadomości...</div>
            } @else if (messages().length === 0) {
              <div class="placeholder-pane">Brak wiadomości w tej rozmowie. Napisz pierwszy.</div>
            } @else {
              @for (msg of messages(); track msg._id) {
                @if (msg.listing_id && shouldShowListingContext($index)) {
                  <div class="listing-context">Dotyczy ogłoszenia: {{ getListingTitle(msg) }}</div>
                }
                <div class="message-row" [class.mine]="isMine(msg)" [class.theirs]="!isMine(msg)">
                  <div class="conversation-avatar">
                    @if (avatarFor(msg)) {
                      <img [src]="avatarFor(msg)" alt="avatar" />
                    } @else {
                      {{ initials(usernameFor(msg)) }}
                    }
                  </div>
                  <div class="message-bubble" [class.mine]="isMine(msg)" [class.theirs]="!isMine(msg)">
                    @if (msg.isAutoReply) {
                      <span class="auto-reply-tag">Automatyczna odpowiedź</span>
                    }
                    {{ msg.content }}
                  </div>
                </div>
                <div class="message-meta" [class.mine]="isMine(msg)">{{ formatTime(msg.createdAt) }}</div>
              }
            }
          </div>

          <form class="composer" (ngSubmit)="send()">
            <textarea
              [(ngModel)]="draft"
              name="draft"
              placeholder="Napisz wiadomość..."
              (keydown.enter)="onEnter($event)"
            ></textarea>
            <button mat-flat-button color="primary" type="submit" [disabled]="!draft.trim() || sending()">
              @if (sending()) {
                <span class="btn-spinner"></span>
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </form>
        }
      </section>
    </div>
  `,
})
export class MessagesComponent implements OnInit, OnDestroy {
  private readonly messagesService = inject(MessagesService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('messagesArea') messagesArea?: ElementRef<HTMLDivElement>;

  protected readonly conversations = signal<ConversationSummary[]>([]);
  protected readonly loadingConversations = signal(true);
  protected readonly activePartner = signal<{ _id: string; username: string; email: string; avatar?: string } | null>(
    null,
  );
  protected readonly activeListingId = signal<string | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly loadingMessages = signal(false);
  protected readonly sending = signal(false);
  protected draft = '';

  protected readonly myId = computed(() => this.auth.user()?._id ?? null);
  protected readonly partnerAvatar = computed(() => this.activePartner()?.avatar ?? '');

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.refreshConversations(true);

    this.route.queryParamMap.subscribe((params) => {
      const to = params.get('to');
      const listing = params.get('listing');
      const prefill = params.get('prefill');
      if (to) {
        this.activeListingId.set(listing);
        this.openPartnerById(to);
        if (prefill) {
          this.draft = prefill;
        }
      }
    });

    this.pollSub = interval(8000).subscribe(() => {
      this.refreshConversations(false);
      const partner = this.activePartner();
      if (partner) {
        this.silentReloadMessages(partner._id);
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  protected initials(username: string): string {
    if (!username) return '?';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return username.substring(0, 2).toUpperCase();
  }

  protected formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
      ? d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('pl-PL');
  }

  protected avatarFor(msg: Message): string {
    if (this.isMine(msg)) return this.auth.user()?.avatar ?? '';
    const from = msg.from;
    if (typeof from === 'object' && from?.avatar) return from.avatar;
    return this.activePartner()?.avatar ?? '';
  }

  protected usernameFor(msg: Message): string {
    if (this.isMine(msg)) return this.auth.user()?.username ?? '?';
    const from = msg.from;
    if (typeof from === 'object' && from?.username) return from.username;
    return this.activePartner()?.username ?? '?';
  }

  protected isMine(msg: Message): boolean {
    const fromId = typeof msg.from === 'string' ? msg.from : (msg.from as User)._id;
    return fromId === this.myId();
  }

  protected getListingTitle(msg: Message): string {
    if (!msg.listing_id) return '';
    if (typeof msg.listing_id === 'string') return '';
    return msg.listing_id.title;
  }

  protected shouldShowListingContext(index: number): boolean {
    const list = this.messages();
    if (index === 0) return true;
    const prev = list[index - 1];
    const cur = list[index];
    const prevId = this.listingIdOf(prev);
    const curId = this.listingIdOf(cur);
    return prevId !== curId;
  }

  private listingIdOf(msg: Message): string | null {
    if (!msg.listing_id) return null;
    return typeof msg.listing_id === 'string' ? msg.listing_id : msg.listing_id._id;
  }

  protected openConversation(partner: { _id: string; username: string; email: string; avatar?: string }): void {
    this.activePartner.set(partner);
    this.loadMessages(partner._id);
    this.router.navigate([], {
      queryParams: { to: partner._id, listing: this.activeListingId() },
      queryParamsHandling: 'merge',
    });
  }

  protected closeConversation(): void {
    this.activePartner.set(null);
    this.messages.set([]);
    this.router.navigate([], { queryParams: {} });
  }

  protected onEnter(event: Event): void {
    const ev = event as KeyboardEvent;
    if (!ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  protected send(): void {
    const partner = this.activePartner();
    const content = this.draft.trim();
    if (!partner || !content || this.sending()) return;

    this.sending.set(true);
    this.messagesService.send({ to: partner._id, content, listing_id: this.activeListingId() }).subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        this.draft = '';
        this.sending.set(false);
        this.refreshConversations(false);
        queueMicrotask(() => this.scrollToBottom());
      },
      error: () => {
        this.sending.set(false);
        this.notifications.show('Nie udało się wysłać wiadomości');
      },
    });
  }

  private openPartnerById(userId: string): void {
    const existing = this.conversations().find((c) => c.partner._id === userId);
    if (existing) {
      this.openConversation(existing.partner);
      return;
    }
    this.activePartner.set({ _id: userId, username: 'Sprzedawca', email: '' });
    this.loadMessages(userId);
  }

  private refreshConversations(showLoading: boolean): void {
    if (showLoading) this.loadingConversations.set(true);
    this.messagesService.listConversations().subscribe({
      next: (list) => {
        this.conversations.set(list);
        this.loadingConversations.set(false);
        const partner = this.activePartner();
        if (partner && partner.email === '') {
          const existing = list.find((c) => c.partner._id === partner._id);
          if (existing) this.activePartner.set(existing.partner);
        }
      },
      error: () => {
        this.loadingConversations.set(false);
      },
    });
  }

  private loadMessages(userId: string): void {
    this.loadingMessages.set(true);
    this.messagesService.getConversation(userId).subscribe({
      next: (list) => {
        this.messages.set(list);
        this.loadingMessages.set(false);
        queueMicrotask(() => this.scrollToBottom());
      },
      error: () => {
        this.loadingMessages.set(false);
      },
    });
  }

  private silentReloadMessages(userId: string): void {
    this.messagesService.getConversation(userId).subscribe({
      next: (list) => {
        const prevLen = this.messages().length;
        this.messages.set(list);
        if (list.length !== prevLen) queueMicrotask(() => this.scrollToBottom());
      },
    });
  }

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
