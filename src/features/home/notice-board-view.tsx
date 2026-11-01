'use client';

import {
  ArrowRight,
  Bell,
  CalendarDays,
  type LucideIcon,
  Megaphone,
  Newspaper,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useReducer, useState, useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { noticeBoard } from '@/content/home';
import { POST_TYPE_LABELS } from '@/features/community/post-card';
import type { FeedPost } from '@/lib/api/types';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';

/** Icons for the four staff post types the board shows. */
const NOTICE_ICONS: Record<'news' | 'notice' | 'announcement' | 'event', LucideIcon> = {
  news: Newspaper,
  notice: Bell,
  announcement: Megaphone,
  event: CalendarDays,
};

/** Storage keys. The localStorage values hold the `publishedAt` of the newest notice the
 * visitor acted on, so dismissing one notice never mutes the next one published after it.
 * The sessionStorage key only stops the popup re-raising after in-page navigation within
 * the same visit; dismissal records the durable "seen" mark.
 */
const STORAGE = {
  seen: 'bpkihs.homeNotices.seen',
  panelClosed: 'bpkihs.homeNotices.panelClosed',
  popupShownThisVisit: 'bpkihs.homeNotices.popupShownThisVisit',
} as const;

/** Storage never pushes; the snapshot is re-read whenever a render asks for it. */
const stubSubscribe = () => () => {};

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
    /* not storable: the panel simply reopens next visit */
  }
}

/** The landing-page notice board, in the style of a government notice column:
 * a closable panel listing the newest notices, and a large centered modal popup for
 * whatever is newer than the visitor has already seen. Every entry links to its
 * own post page.
 *
 * The popup is a proper modal: Base UI moves focus into it, traps Tab while it is
 * open, and Escape, the backdrop and the close button all dismiss it, recording the
 * "seen" mark so it returns only for the next published notice. Crossing the board
 * hides it completely — until a newer notice is published, nothing stays on screen.
 */
export function NoticeBoardView({ notices }: { notices: FeedPost[] }) {
  const newestIso = notices[0]?.publishedAt;

  /* Panel visibility lives in localStorage. The counter only forces a re-render when a
     click rewrites it, since storage itself never pushes a change event. */
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const panelClosed = useSyncExternalStore(
    stubSubscribe,
    () => {
      void newestIso;
      return readStored(STORAGE.panelClosed) === (newestIso ?? '\u0000');
    },
    () => false,
  );

  const [popupOpen, setPopupOpen] = useState(false);

  /* The one-time popup: only for content newer than the last seen mark, once per visit. */
  useEffect(() => {
    if (!newestIso) return;
    const timer = window.setTimeout(() => {
      const seen = readStored(STORAGE.seen);
      const shownThisVisit = readStored(STORAGE.popupShownThisVisit, true) === '1';
      if (shownThisVisit || (seen && seen >= newestIso)) return;
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

  const onClosePanel = (newest: string): void => {
    writeStored(STORAGE.panelClosed, newest);
    redraw();
  };

  const newest = notices[0];
  if (!newest) return null;

  return (
    <>
      ,{/* The one-time popup: a large, readable modal with the full notice excerpt. */}
      <Dialog open={popupOpen} onOpenChange={onPopupOpenChange}>
        <DialogContent showCloseButton={false} className="gap-4 p-8 sm:max-w-lg">
          <div className="flex items-start justify-between gap-4">
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
          </div>
          <DialogTitle className="font-heading text-2xl leading-tight font-semibold">
            {newest.title}
          </DialogTitle>
          <p className="mt-2 text-lg text-neutral-500">
            {POST_TYPE_LABELS[newest.type]} · {formatDate(newest.publishedAt)}
          </p>
          {newest.excerpt ? (
            <p className="text-xl leading-relaxed text-neutral-600">{newest.excerpt}</p>
          ) : null}
          <div className="mt-1 border-t border-neutral-200 pt-4">
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
      {/* The closable board. Bottom sheet on small screens; right column wider on xl. */}
      {panelClosed ? null : (
        <section
          aria-label={noticeBoard.title}
          className="border-warning-600/30 bg-warning-600/5 fixed inset-x-3 bottom-3 z-40 flex max-h-[60vh] flex-col overflow-hidden rounded-xl border shadow-lg sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-full xl:top-1/2 xl:bottom-auto"
        >
          <div className="border-warning-600/30 bg-warning-600/10 flex shrink-0 items-center justify-between border-b px-6 py-3">
            <p className="text-primary-900 text-lg font-semibold">
              {noticeBoard.title}
              <span aria-hidden="true" className="text-warning-600 ml-2 text-base font-normal">
                {noticeBoard.titleNe}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onClosePanel(newest.publishedAt)}
              aria-label={noticeBoard.closeLabel}
              className="rounded-md p-3 text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <ul className="flex-1 list-none overflow-y-auto overscroll-contain p-3">
            {notices.map((post) => {
              const Icon = NOTICE_ICONS[post.type as keyof typeof NOTICE_ICONS] ?? Bell;
              return (
                <li key={post.id}>
                  <Link
                    href={`/community/${encodeURIComponent(post.id)}`}
                    className="hover:bg-warning-600/10 focus-visible:outline-primary-700 block rounded-lg px-4 py-3 transition-colors focus-visible:outline-2"
                  >
                    <span className="text-warning-600 flex items-center gap-2 text-sm font-medium">
                      <Icon aria-hidden="true" className="size-4" />
                      {POST_TYPE_LABELS[post.type]}
                      <span aria-hidden="true" className="font-normal text-neutral-600">
                        · {formatDate(post.publishedAt)}
                      </span>
                    </span>
                    <span className="text-primary-900 mt-2 line-clamp-3 block text-xl leading-snug font-medium">
                      {post.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-warning-600/20 shrink-0 border-t px-6 py-3">
            <Link
              href={noticeBoard.allHref}
              className="text-primary-700 hover:text-primary-900 flex items-center gap-2 text-lg font-medium"
            >
              {noticeBoard.allLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
