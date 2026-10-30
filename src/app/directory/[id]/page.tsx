import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { directoryPage } from '@/content/directory';
import { getAlumnusProfile } from '@/features/directory/get-alumnus-profile';
import { ProfileSkeleton } from '@/features/directory/profile-skeleton';
import { ProfileView } from '@/features/directory/profile-view';
import { getViewer } from '@/server/auth/session';

/**
 * Profile pages are the directory's indexable depth, so each one names the person and
 * canonicalises to itself.
 *
 * The not-found case is resolved here rather than in the page body, so the answer is settled
 * before the client renders: an unknown id still answers 200 because this route streams (Next
 * documents that `notFound()` after streaming begins cannot change the status) and Next attaches
 * `noindex`, which is what keeps it out of the index. A true 404 would need an existence check in
 * `proxy.ts` : see `docs/DEPLOYMENT.md` §10 before attempting that.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getViewer();
  const person = await getAlumnusProfile(id, viewer);
  if (!person) notFound();

  return {
    title: person.fullName,
    description: `${person.fullName}: ${person.programme}, batch ${person.batchYear}, ${person.country}`,
    alternates: { canonical: `/directory/${encodeURIComponent(person.id)}` },
    openGraph: { type: 'profile' },
  };
}

async function ProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Public profiles open for anyone; a members-only profile is a 404 for a signed-out visitor,
  // so the page never reveals that an unlisted record exists.
  const viewer = await getViewer();
  const person = await getAlumnusProfile(id, viewer);
  if (!person) notFound();

  return (
    <>
      <PageHeader
        crumbs={[{ label: directoryPage.title, href: '/directory' }, { label: person.fullName }]}
        title={person.fullName}
        description={person.programme + ', batch ' + person.batchYear}
      />
      <Section>
        <ProfileView person={person} />
      </Section>
    </>
  );
}

export default function AlumnusProfilePage({ params }: PageProps<'/directory/[id]'>) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}
