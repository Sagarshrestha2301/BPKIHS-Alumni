import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { boardPage } from '@/content/board';
import { BoardSection } from '@/features/governance/board-section';
import { BoardSkeleton } from '@/features/governance/board-skeleton';

export const metadata: Metadata = {
  title: boardPage.title,
  description: boardPage.description,
  alternates: { canonical: '/about/board' },
};

export default function BoardPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About', href: '/about' }, { label: boardPage.title }]}
        title={boardPage.title}
        description={boardPage.description}
      />
      <Section>
        <Suspense fallback={<BoardSkeleton />}>
          <BoardSection />
        </Suspense>
      </Section>
    </>
  );
}
