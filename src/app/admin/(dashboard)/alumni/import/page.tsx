import type { Metadata } from 'next';
import Link from 'next/link';

import { adminAlumniImportPage } from '@/content/admin';
import { AlumniImport } from '@/features/admin/alumni-import';
import { AdminPageHeader } from '@/features/admin/page-header';
import { requireAdminPage } from '@/server/auth/admin-page';

export const metadata: Metadata = { title: adminAlumniImportPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

export default async function AdminAlumniImportPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={adminAlumniImportPage.title}
        description={adminAlumniImportPage.description}
        actions={
          <Link
            href="/admin/alumni"
            className="text-primary-700 text-sm underline underline-offset-4"
          >
            {adminAlumniImportPage.backToList}
          </Link>
        }
      />
      <AlumniImport />
    </div>
  );
}
