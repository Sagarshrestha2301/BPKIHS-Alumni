import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { accountPage, profilePage } from '@/content/account';
import { PhotoForm } from '@/features/account/photo-form';
import { ProfileForm } from '@/features/account/profile-form';
import { getSession } from '@/server/auth/session';
import { findRegistrationForUser } from '@/server/services/registration';

export const metadata: Metadata = {
  title: profilePage.title,
  description: profilePage.description,
  robots: { index: false, follow: false },
};

/** Session and profile reads are per request; see the note in /account. */
export const instant = false;

export default async function EditProfilePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await findRegistrationForUser(session.user.id);
  if (!profile) redirect('/account');

  return (
    <>
      <PageHeader
        crumbs={[{ label: accountPage.title, href: '/account' }, { label: profilePage.title }]}
        title={profilePage.title}
        description={profilePage.description}
      />

      <Section>
        <div className="grid gap-6">
          <PhotoForm profile={profile} />
          <ProfileForm profile={profile} email={session.user.email} />
        </div>
      </Section>
    </>
  );
}
