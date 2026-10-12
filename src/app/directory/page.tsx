import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { directoryPage } from '@/content/directory';
import { DirectoryContent } from '@/features/directory/directory-content';
import { DirectorySkeleton } from '@/features/directory/directory-skeleton';

export const metadata: Metadata = {
  title: directoryPage.title,
  description: directoryPage.description,
  alternates: { canonical: '/directory' },
};

export default function DirectoryPage({ searchParams }: PageProps<'/directory'>) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: directoryPage.title }]}
        title={directoryPage.title}
        description={directoryPage.description}
      />
      <Section>
        <Suspense fallback={<DirectorySkeleton />}>
          <DirectoryContent searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  );
}
