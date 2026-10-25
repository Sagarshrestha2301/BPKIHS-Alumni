import Link from 'next/link';
import { Fragment } from 'react';

import { Container } from '@/components/layout/container';
import { JsonLd } from '@/components/shared/json-ld';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';

export type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  /** The trail after Home. The last item is the current page. */
  crumbs: readonly Crumb[];
  title: string;
  description?: string;
};

/** Header for inner pages: breadcrumbs, the page h1 and a short description. */
export function PageHeader({ crumbs, title, description }: PageHeaderProps) {
  const trail: Crumb[] = [{ label: 'Home', href: '/' }, ...crumbs];

  return (
    <header className="bg-secondary border-b border-neutral-300 py-8 lg:py-12">
      <JsonLd value={breadcrumbJsonLd(trail)} />
      <Container>
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((crumb, index) => {
              const last = index === trail.length - 1;
              return (
                <Fragment key={crumb.label}>
                  <BreadcrumbItem>
                    {last || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={crumb.href} />}
                        className="inline-flex min-h-6 items-center underline underline-offset-4"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {last ? null : <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="font-heading mt-4">{title}</h1>
        {description ? (
          <p className="text-body-l mt-3 max-w-2xl text-neutral-600">{description}</p>
        ) : null}
      </Container>
    </header>
  );
}
