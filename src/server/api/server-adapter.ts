import type { ApiClient } from '@/lib/api/contract';
import { ApiError } from '@/lib/api/errors';
import type { Viewer } from '@/lib/api/privacy';

import { ANONYMOUS_VIEWER } from '../auth/session';
import { getAlumniFilterOptions, getAlumnus, listAlumni } from '../services/alumni';
import {
  getPost,
  listFeed,
  reportPost,
  submitPost,
  subscribeNewsletter,
  updateNewsletterPrefs,
} from '../services/community';
import { getSiteStats, getWelcomeMessage, listFaq } from '../services/content';
import {
  createDonation,
  getFundsBreakdown,
  getGoal,
  listGoals,
  listPublicDonors,
} from '../services/donations';
import { getEvent, listEvents, submitRsvp } from '../services/events';
import { listBoard } from '../services/governance';
import { submitRegistration } from '../services/registration';
import { submitSupportTicket } from '../services/support';

/**
 * Server Components read through this adapter. It calls the same services as the route
 * handlers but without a network round-trip, so a cached page never fetches its own API.
 *
 * The viewer is passed in per request: alumni and admins get the alumni-only directory view,
 * everyone else the public one. When omitted it is the anonymous viewer.
 */
export function createServerAdapter(viewer: Viewer = ANONYMOUS_VIEWER): ApiClient {
  return {
    getSiteStats,
    getWelcomeMessage,

    listAlumni: (params) => listAlumni(params, viewer),
    getAlumnus: (id) => getAlumnus(id, viewer),
    getAlumniFilterOptions: () => getAlumniFilterOptions(viewer),
    submitRegistration,
    verifyRegistration: async () => {
      throw new ApiError('not_implemented', 'Verification happens in the browser.');
    },
    resendRegistrationCode: async () => {
      throw new ApiError('not_implemented', 'Resending happens in the browser.');
    },

    listGoals,
    getGoal,
    createDonation: (input) => createDonation(input),
    getFundsBreakdown,
    listPublicDonors,

    listBoard,
    listEvents,
    getEvent,
    submitRsvp,

    listFeed,
    getPost,
    submitPost,
    reportPost,
    subscribeNewsletter,
    updateNewsletterPrefs,

    listFaq,
    submitSupportTicket,
    submitContactMessage: async () => {
      throw new ApiError('not_implemented', 'Contact messages are sent from the browser.');
    },

    updateMyProfile: async () => {
      throw new ApiError('not_implemented', 'Profile changes happen in the browser.');
    },
    uploadMyPhoto: async () => {
      throw new ApiError('not_implemented', 'Photo uploads happen in the browser.');
    },
    removeMyPhoto: async () => {
      throw new ApiError('not_implemented', 'Photo changes happen in the browser.');
    },
    changePassword: async () => {
      throw new ApiError('not_implemented', 'Password changes happen in the browser.');
    },
    requestPasswordReset: async () => {
      throw new ApiError('not_implemented', 'Password resets happen in the browser.');
    },
    resetPassword: async () => {
      throw new ApiError('not_implemented', 'Password resets happen in the browser.');
    },

    getSession: async () => null,
    login: async () => {
      throw new ApiError('not_implemented', 'Sign-in happens in the browser.');
    },
    signup: async () => {
      throw new ApiError('not_implemented', 'Sign-up happens in the browser.');
    },
    logout: async () => {
      throw new ApiError('not_implemented', 'Sign-out happens in the browser.');
    },
  };
}

export const serverAdapter: ApiClient = createServerAdapter();
