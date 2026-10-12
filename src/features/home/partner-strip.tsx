import Image from 'next/image';

import { Container } from '@/components/layout/container';
import { partnerStrip } from '@/content/home';
import { site } from '@/content/site';

/** The institute for now. More partner logos are added here when the Association supplies them. */
export function PartnerStrip() {
  return (
    <section
      aria-labelledby="partners-heading"
      className="border-t border-neutral-300 py-8 lg:py-10"
    >
      <Container>
        <h2
          id="partners-heading"
          className="font-body text-sm font-semibold tracking-wider text-neutral-600 uppercase"
        >
          {partnerStrip.title}
        </h2>
        <ul className="mt-4 flex flex-wrap items-center gap-8">
          <li>
            <a
              href={site.instituteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-900 focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-3 rounded-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
            >
              <Image
                src={site.logo.src}
                alt=""
                width={site.logo.width}
                height={site.logo.height}
                className="size-12"
              />
              {site.instituteName}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </Container>
    </section>
  );
}
