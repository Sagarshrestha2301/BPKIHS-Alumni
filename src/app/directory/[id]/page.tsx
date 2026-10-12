import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { directoryPage } from '@/content/directory';
import { getAlumnusProfile } from '@/features/directory/get-alumnus-profile';
import { ProfileSkeleton } from '@/features/directory/profile-skeleton';
import { ProfileView } from '@/features/directory/profile-view';

export const metadata: Metadata = {
  title: directoryPage.profile.pageTitle,
};

async function ProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getAlumnusProfile(id);
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
