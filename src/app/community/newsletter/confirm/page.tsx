import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { newsletterPage } from '@/content/community';
import { cn } from '@/lib/utils';

/**
 * The page the double opt-in email links to. It renders a plain HTML form, so confirming works
 * without JavaScript and without a script bundle: the token is the only thing that matters.
 *
 * The page deliberately does not reveal whether the token is valid. That answer only comes
 * back from the POST, which keeps a GET from changing anything : some email clients and
 * security scanners fetch every link in a message.
 */
export const metadata: Metadata = {
  title: newsletterPage.confirm.title,
  description: newsletterPage.confirm.description,
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ConfirmNewsletterPage({
  searchParams,
}: PageProps<'/community/newsletter/confirm'>) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token.trim() : '';

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Community', href: '/community' },
          { label: newsletterPage.title, href: '/community/newsletter' },
          { label: newsletterPage.confirm.title },
        ]}
        title={newsletterPage.confirm.title}
        description={newsletterPage.confirm.description}
      />

      <Section>
        <div className="max-w-xl rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
          {token ? (
            <form action="/api/v1/newsletter/confirm" method="post" className="grid gap-5">
              <input type="hidden" name="token" value={token} />
              <p className="text-sm text-neutral-600">{newsletterPage.confirm.intro}</p>
              <button
                type="submit"
                className={cn(buttonVariants(), 'h-11 justify-self-start px-6')}
              >
                {newsletterPage.confirm.button}
              </button>
            </form>
          ) : (
            <p role="status" className="text-sm text-neutral-900">
              {newsletterPage.confirm.invalid}
            </p>
          )}

          <p className="mt-5 text-sm text-neutral-600">{newsletterPage.confirm.privacy}</p>
          <p className="mt-5 text-sm">
            <Link href="/community/newsletter" className="text-primary-700 underline">
              {newsletterPage.confirm.back}
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
