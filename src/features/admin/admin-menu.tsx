'use client';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { adminShell } from '@/content/admin';
import { AdminNav, type AdminNavCounts } from '@/features/admin/admin-nav';

/**
 * The sidebar collapses below `lg`. This is a disclosure, not a modal: one button, one
 * panel, Escape closes it, and a route change closes it so the next page starts clean.
 */
export function AdminMenu({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();
  // Remember which route the panel was opened on. A navigation changes `pathname`, so the
  // panel closes without an effect that writes state during render.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        onClick={() => setOpenPath(open ? null : pathname)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/30 px-3 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {open ? (
          <X aria-hidden="true" className="size-4" />
        ) : (
          <Menu aria-hidden="true" className="size-4" />
        )}
        {open ? adminShell.closeMenu : adminShell.menu}
      </button>

      {open ? (
        <div
          id="admin-mobile-nav"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpenPath(null);
          }}
          className="absolute top-[calc(100%+0.6rem)] left-0 z-50 max-h-[calc(100vh-5.5rem)] w-72 overflow-y-auto rounded-xl border border-neutral-300 bg-white p-3 shadow-xl"
        >
          <AdminNav counts={counts} />
        </div>
      ) : null}
    </div>
  );
}
