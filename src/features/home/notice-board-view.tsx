'use client';

import { ArrowRight, Bell, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { noticeBoard } from '@/content/home';
import { POST_TYPE_LABELS } from '@/features/community/post-card';
import type { FeedPost } from '@/lib/api/types';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';

/** Storage keys. The localStorage values hold the `publishedAt` of the newest notice the
 * visitor acted on, so dismissing one notice never mutes the next one published after it.
 * The sessionStorage key only stops the popup re-raising after in-page navigation within
 * the same visit; dismissal records the durable "seen" mark.
 */
const STORAGE = {
  seen: 'bpkihs.homeNotices.seen',
  popupShownThisVisit: 'bpkihs.homeNotices.popupShownThisVisit',
} as const;

/** Safari private mode throws on storage access; the fallback (always show) is fine. */
function readStored(key: string, session = false): string | null {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null, session = false): void {
  try {
    const store = session ? sessionStorage : localStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* not storable: the popup simply reopens next visit */
  }
}

/** The landing-page notice popup: a large centered modal for whatever is newer than the
 * visitor has already seen.
 *
 * The popup is a proper modal: Base UI moves focus into it, traps Tab while it is open,
 * and Escape, the backdrop and the close button all dismiss it, recording the "seen" mark
 * so it returns only for the next published notice. Long unbroken content such as URLs
 * wraps inside the modal instead of overflowing past its edge.
 */
export function NoticeBoardView({ notices }: { notices: FeedPost[] }) {
  const newestIso = notices[0]?.publishedAt;

  const [popupOpen, setPopupOpen] = useState(false);

  /* The one-time popup: only for content newer than the last seen mark, once per visit. */
  useEffect(() => {
    if (!newestIso) return;
    const timer = window.setTimeout(() => {
      const shownThisVisit = readStored(STORAGE.popupShownThisVisit, true) === '1';
      if (shownThisVisit) return;
      writeStored(STORAGE.popupShownThisVisit, '1', true);
      setPopupOpen(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [newestIso]);

  /* Every route out of the dialog closes it and records the newest notice as seen. */
  const onPopupOpenChange = (open: boolean): void => {
    setPopupOpen(open);
    if (!open && newestIso) writeStored(STORAGE.seen, newestIso);
  };

  const newest = notices[0];
  if (!newest) return null;

  return (
    <Dialog open={popupOpen} onOpenChange={onPopupOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] min-w-0 gap-4 overflow-hidden p-8 sm:max-w-lg"
      >
        <div className="flex min-w-0 items-start justify-between gap-4">
          <p className="text-warning-600 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <Bell aria-hidden="true" className="size-4" />
            {noticeBoard.popupTitle}
          </p>
          <DialogClose
            aria-label={noticeBoard.popupCloseLabel}
            className="-mt-1 -mr-1 rounded-md p-3 text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <X aria-hidden="true" className="size-4" />
          </DialogClose>
        </div>{' '}
        <DialogTitle className="font-heading min-w-0 text-2xl leading-tight font-semibold wrap-anywhere">
          {newest.title}
        </DialogTitle>
        <p className="mt-2 text-lg text-neutral-500">
          {POST_TYPE_LABELS[newest.type]} · {formatDate(newest.publishedAt)}
        </p>
        {newest.excerpt ? (
          <p className="min-w-0 text-xl leading-relaxed wrap-anywhere text-neutral-600">
            {newest.excerpt}
          </p>
        ) : null}
        <div className="mt-1 min-w-0 border-t border-neutral-200 pt-4">
          <Link
            href={`/community/${encodeURIComponent(newest.id)}`}
            onClick={() => onPopupOpenChange(false)}
            className={cn(buttonVariants(), 'h-12 gap-2.5 px-5 text-base font-medium')}
          >
            {noticeBoard.readLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
