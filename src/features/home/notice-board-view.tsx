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

import { Button, buttonVariants } from '@/components/ui/button';
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

/**
 * Storage keys. The localStorage values hold the `publishedAt` of the newest notice the
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

/**
 * The landing-page notice board, in the style of a government notice column:
 * a closable panel listing the newest notices, and a one-time popup for whatever is
 * newer than the visitor has already seen. Every entry links to its own post page.
 *
 * The popup deliberately grabs no focus: it must not wrestle the skip link for the
 * first Tab on the page. Escape and the close button dismiss it; the panel close
 * remembers itself only until a newer notice is published.
 */
export function NoticeBoardView({ notices }: { notices: FeedPost[] }) {
  const newestIso = notices[0]?.publishedAt;

  /* Panel visibility lives in localStorage. The counter only forces a re-render when a
     click rewrites it, since storage itself never pushes a change event. */
  const [, reopenPanel] = useReducer((count: number) => count + 1, 0);
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

  const onPopupDismiss = (newest: string): void => {
    setPopupOpen(false);
    writeStored(STORAGE.seen, newest);
  };

  const onClosePanel = (newest: string): void => {
    writeStored(STORAGE.panelClosed, newest);
    reopenPanel();
  };

  const onOpenPanel = (): void => {
    writeStored(STORAGE.panelClosed, null);
    reopenPanel();
  };

  /* Escape is a courtesy (the popup is not modal and never held focus). */
  useEffect(() => {
    if (!popupOpen || !newestIso) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onPopupDismiss(newestIso);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupOpen, newestIso]);

  const newest = notices[0];
  if (!newest) return null;

  return (
    <>
      {/* The one-time popup. Non-modal and positionally separate from the panel. */}
      {popupOpen ? (
        <div
          role="dialog"
          aria-label={noticeBoard.popupTitle}
          className="border-warning-600/40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 fixed inset-x-3 top-20 z-50 rounded-xl border bg-white p-4 shadow-xl duration-200 sm:inset-x-auto sm:top-20 sm:right-4 sm:w-80"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-warning-600 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Bell aria-hidden="true" className="size-3.5" />
              {noticeBoard.popupTitle}
            </p>
            <button
              type="button"
              onClick={() => onPopupDismiss(newest.publishedAt)}
              aria-label={noticeBoard.popupCloseLabel}
              className="-mt-1 -mr-1 rounded-md p-1 text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="text-primary-900 mt-2 text-base font-semibold">{newest.title}</p>
          <p className="mt-1 text-sm text-neutral-600">
            {POST_TYPE_LABELS[newest.type]} · {formatDate(newest.publishedAt)}
          </p>
          {newest.excerpt ? (
            <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{newest.excerpt}</p>
          ) : null}
          <div className="mt-3">
            <Link
              href={`/community/${encodeURIComponent(newest.id)}`}
              onClick={() => onPopupDismiss(newest.publishedAt)}
              className={cn(buttonVariants(), 'h-10 gap-2 px-4 text-sm')}
            >
              {noticeBoard.readLabel}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* The closable board. Bottom sheet on small screens; right column on xl screens. */}
      {panelClosed ? (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenPanel}
          className="border-warning-600/40 text-warning-600 hover:bg-warning-600/10 fixed right-3 bottom-3 z-40 gap-2 shadow-md sm:right-4 sm:bottom-4"
        >
          <Bell aria-hidden="true" className="size-4" />
          {noticeBoard.openLabel}
          <span className="bg-warning-600 rounded-full px-1.5 text-xs text-white">
            {notices.length}
          </span>
        </Button>
      ) : (
        <section
          aria-label={noticeBoard.title}
          className="border-warning-600/30 bg-warning-600/5 fixed inset-x-3 bottom-3 z-40 flex max-h-[55vh] flex-col overflow-hidden rounded-xl border shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-72 xl:top-1/2 xl:bottom-auto xl:-translate-y-1/2"
        >
          <div className="border-warning-600/30 bg-warning-600/10 flex shrink-0 items-center justify-between border-b px-3 py-2.5">
            <p className="text-primary-900 text-sm font-semibold">
              {noticeBoard.title}
              <span aria-hidden="true" className="text-warning-600 ml-2 text-xs font-normal">
                {noticeBoard.titleNe}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onClosePanel(newest.publishedAt)}
              aria-label={noticeBoard.closeLabel}
              className="rounded-md p-1 text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <ul className="flex-1 list-none overflow-y-auto overscroll-contain p-1.5">
            {notices.map((post) => {
              const Icon = NOTICE_ICONS[post.type as keyof typeof NOTICE_ICONS] ?? Bell;
              return (
                <li key={post.id}>
                  <Link
                    href={`/community/${encodeURIComponent(post.id)}`}
                    className="hover:bg-warning-600/10 focus-visible:outline-primary-700 block rounded-lg px-2.5 py-2 transition-colors focus-visible:outline-2"
                  >
                    <span className="text-warning-600 flex items-center gap-1.5 text-xs font-medium">
                      <Icon aria-hidden="true" className="size-3.5" />
                      {POST_TYPE_LABELS[post.type]}
                      <span aria-hidden="true" className="font-normal text-neutral-600">
                        · {formatDate(post.publishedAt)}
                      </span>
                    </span>
                    <span className="text-primary-900 mt-0.5 line-clamp-2 block text-sm font-medium group-hover:underline">
                      {post.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-warning-600/20 shrink-0 border-t px-3 py-2">
            <Link
              href={noticeBoard.allHref}
              className="text-primary-700 hover:text-primary-900 flex items-center gap-1 text-sm font-medium"
            >
              {noticeBoard.allLabel}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
