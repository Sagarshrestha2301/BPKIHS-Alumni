/**
 * Shapes returned by the admin content endpoints. They extend the public record with the
 * fields an editor needs (drafts, ordering, inactive goals) and are never used by public
 * components.
 */
import type {
  AlumniEvent,
  BoardMember,
  DonationGoal,
  FaqItem,
  NewsletterInterest,
  WelcomeMessage,
} from './types';

export interface AdminEvent extends AlumniEvent {
  endsAt?: string;
  gallery?: AlumniEvent['gallery'];
  createdAt: string;
  updatedAt: string;
}

export interface AdminGoal extends DonationGoal {
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminBoardMember extends BoardMember {
  sortOrder: number;
}

export interface AdminFaqItem extends FaqItem {
  sortOrder: number;
}

export interface AdminWelcomeMessage extends WelcomeMessage {
  updatedAt?: string;
}

export interface AdminSubscriber {
  id: string;
  email: string;
  interests: NewsletterInterest[];
  status: 'subscribed' | 'unsubscribed';
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  status: 'sending' | 'sent' | 'failed';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
}

export interface AdminNewsletterPage {
  subscribers: {
    items: AdminSubscriber[];
    total: number;
    subscribed: number;
    page: number;
    pageSize: number;
  };
  campaigns: NewsletterCampaign[];
}

export interface ContentOverview {
  events: AdminEvent[];
  goals: AdminGoal[];
  board: AdminBoardMember[];
  faq: AdminFaqItem[];
  welcome: AdminWelcomeMessage | null;
}
