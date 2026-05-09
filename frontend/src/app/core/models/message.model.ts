import { User } from './user.model';

export interface Message {
  _id: string;
  from: User | string;
  to: User | string;
  listing_id: { _id: string; title: string } | string | null;
  content: string;
  read_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  partner: { _id: string; username: string; email: string; avatar?: string };
  lastMessage: {
    _id: string;
    content: string;
    createdAt: string;
    from: string;
    to: string;
    listing_id: string | null;
  };
  unreadCount: number;
}
