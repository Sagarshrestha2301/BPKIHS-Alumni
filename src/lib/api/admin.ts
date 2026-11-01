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
  FeedPost,
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

export interface AdminPost extends FeedPost {
  createdAt: string;
  updatedAt: string;
}

export interface AdminFaqItem extends FaqItem {
  sortOrder: number;
}

export interface AdminFundRow {
  id: string;
  category: string;
  sharePercent: number;
  period: string;
  sortOrder: number;
}

export interface AdminWelcomeMessage extends WelcomeMessage {
  updatedAt?: string;
}

export interface AdminSubscriber {
  id: string;
  email: string;
  interests: NewsletterInterest[];
  /** `pending` asked to join and has not opened its confirmation email yet. */
  status: 'subscribed' | 'unsubscribed' | 'pending';
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

export interface AdminGoalUpdate {
  id: string;
  goalId: string;
  body: string;
  createdAt: string;
}

export interface ContentOverview {
  events: AdminEvent[];
  goals: AdminGoal[];
  updates: AdminGoalUpdate[];
  board: AdminBoardMember[];
  faq: AdminFaqItem[];
  welcome: AdminWelcomeMessage | null;
  funds: AdminFundRow[];
}
