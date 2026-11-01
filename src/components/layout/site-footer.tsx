'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NewsletterForm } from '@/components/shared/newsletter-form';
import { footerAddress, footerGroups, legalNav } from '@/content/footer';
import { site } from '@/content/site';

import { Container } from './container';

const linkClass =
  'text-primary-100 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function SiteFooter() {
  const pathname = usePathname();
  // The dashboard has its own shell: no public footer under it.
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="pb-14 lg:pb-0">
      <section
        aria-labelledby="newsletter-heading"
        className="from-primary-100/90 via-primary-100/50 to-primary-100/70 border-primary-200/50 border-t bg-linear-to-b py-12"
      >
        <Container className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2
              id="newsletter-heading"
              className="font-heading text-primary-900 text-2xl font-bold tracking-tight"
            >
              Stay in touch
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              News, events and stories from the BPKIHS alumni community. Unsubscribe any time.
            </p>
          </div>
          <NewsletterForm />
        </Container>
      </section>
      <div className="bg-primary-900 text-primary-100">
        <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="font-heading text-lg font-bold text-white">{site.name}</p>
            <p className="mt-2 text-sm">{site.instituteName}</p>
            <p className="text-sm">{footerAddress}</p>
            <a
              href={site.instituteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-block text-sm ${linkClass}`}
            >
              Visit bpkihs.edu
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold tracking-wider text-white uppercase">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`text-sm ${linkClass}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </Container>
        <div className="border-t border-white/20">
          <Container className="flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {site.copyrightYear} {site.name}
            </p>
            <ul className="flex flex-wrap gap-4">
              {legalNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </div>
    </footer>
  );
}
