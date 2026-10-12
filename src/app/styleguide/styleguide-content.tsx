'use client';

import { UsersIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import { Container } from '@/components/layout/container';
import { DonateButton } from '@/components/shared/donate-button';
import { DonateLink } from '@/components/shared/donate-link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Eyebrow } from '@/components/shared/eyebrow';
import { FormField } from '@/components/shared/form-field';
import { NewsletterForm } from '@/components/shared/newsletter-form';
import { ProgressBar } from '@/components/shared/progress-bar';
import { StatCard } from '@/components/shared/stat-card';
import { Stepper } from '@/components/shared/stepper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { contrastRatio } from '@/lib/contrast';

const sections = [
  { id: 'sg-colours', label: 'Colours' },
  { id: 'sg-type', label: 'Typography' },
  { id: 'sg-buttons', label: 'Buttons' },
  { id: 'sg-forms', label: 'Forms' },
  { id: 'sg-surfaces', label: 'Surfaces' },
  { id: 'sg-feedback', label: 'Feedback' },
  { id: 'sg-nav', label: 'Navigation and overlays' },
  { id: 'sg-newsletter', label: 'Newsletter' },
];

const colourGroups = [
  { title: 'Primary', prefix: 'primary-' },
  { title: 'Donate (accent)', prefix: 'accent-' },
  { title: 'Status', prefix: '-600' },
  { title: 'Neutral', prefix: 'neutral-' },
];

const programmes = [
  { value: 'mbbs', label: 'MBBS' },
  { value: 'md', label: 'MD / MS' },
  { value: 'bmit', label: 'BMIT' },
];

const steps = [
  { id: 'amount', label: 'Amount' },
  { id: 'signin', label: 'Sign in' },
  { id: 'payment', label: 'Payment' },
];

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28 space-y-6">
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-semibold tracking-wider text-neutral-600 uppercase">{children}</p>
  );
}

function Swatch({
  name,
  hex,
  colours,
}: {
  name: string;
  hex: string;
  colours: Record<string, string>;
}) {
  const onWhite = contrastRatio(hex, colours['white'] ?? '#ffffff').toFixed(2);
  const onInk = contrastRatio(hex, colours['neutral-900'] ?? '#16202b').toFixed(2);
  return (
    <div className="space-y-1.5">
      <div className="h-12 rounded-lg border border-neutral-300" style={{ backgroundColor: hex }} />
      <p className="text-sm font-medium text-neutral-900">{name}</p>
      <p className="text-xs text-neutral-600">{hex}</p>
      <p className="text-xs text-neutral-600">
        vs white {onWhite} / vs ink {onInk}
      </p>
    </div>
  );
}

export function StyleguideContent({ colours }: { colours: Record<string, string> }) {
  const names = Object.keys(colours).filter((n) => n !== 'white');
  return (
    <Container className="space-y-16 py-12">
      <header className="space-y-4">
        <Eyebrow>Development only</Eyebrow>
        <h1>Styleguide</h1>
        <p className="text-body-l max-w-prose text-neutral-600">
          Every shared component and state in one place. This page returns 404 in production builds.
        </p>
        <nav aria-label="Styleguide sections">
          <ul className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={'#' + s.id}
                  className="text-primary-700 hover:bg-primary-100 focus-visible:outline-primary-700 inline-flex h-11 items-center rounded-lg border border-neutral-300 px-4 text-sm font-medium focus-visible:outline-2"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Block id="sg-colours" title="Colours">
        <p className="max-w-prose text-neutral-600">
          Read from tokens.css. Ratios are against white and against body ink (neutral-900). Text
          needs 4.5:1, large text and UI parts need 3:1.
        </p>
        {colourGroups.map((group) => {
          const list = names.filter((n) =>
            group.prefix === '-600'
              ? /^(success|warning|danger)-/.test(n)
              : n.startsWith(group.prefix),
          );
          return (
            <div key={group.title} className="space-y-3">
              <Sub>{group.title}</Sub>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {list.map((n) => (
                  <Swatch key={n} name={n} hex={colours[n] ?? '#000000'} colours={colours} />
                ))}
              </div>
            </div>
          );
        })}
      </Block>

      <Block id="sg-type" title="Typography">
        <div className="space-y-5">
          <p className="font-heading text-display lg:text-display-lg leading-[1.1] font-bold">
            Display: Once BPKIHS, always BPKIHS
          </p>
          <p className="font-heading text-h1 lg:text-h1-lg leading-tight font-bold">
            H1: Alumni directory
          </p>
          <p className="font-heading text-h2 lg:text-h2-lg leading-tight font-bold">
            H2: Featured giving goals
          </p>
          <p className="font-heading text-h3 lg:text-h3-lg leading-snug font-bold">
            H3: Upcoming events
          </p>
          <p className="text-body-l leading-relaxed">
            Body L: a short, plain-English introduction.
          </p>
          <p>Body: the default text size for paragraphs and forms.</p>
          <p className="text-sm text-neutral-600">Small: captions and helper text.</p>
          <Eyebrow>Eyebrow label</Eyebrow>
          <p lang="ne" className="text-body-l">
            बी.पी. कोइराला स्वास्थ्य विज्ञान प्रतिष्ठान
          </p>
        </div>
      </Block>

      <Block id="sg-buttons" title="Buttons">
        <div className="space-y-3">
          <Sub>Variants</Sub>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>
        <div className="space-y-3">
          <Sub>Donate</Sub>
          <div className="flex flex-wrap gap-3">
            <DonateButton>Give now</DonateButton>
            <DonateLink href="/donate">Donate (link)</DonateLink>
            <DonateButton disabled>Disabled</DonateButton>
          </div>
        </div>
        <div className="space-y-3">
          <Sub>Disabled</Sub>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Primary</Button>
            <Button variant="outline" disabled>
              Outline
            </Button>
          </div>
        </div>
      </Block>

      <Block id="sg-forms" title="Forms">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Full name" required>
            {(c) => <Input {...c} className="h-11" />}
          </FormField>
          <FormField label="Full name (with hint)" hint="As on your certificate">
            {(c) => <Input {...c} className="h-11" />}
          </FormField>
          <FormField label="Email (with error)" error="Enter a valid email address." required>
            {(c) => <Input {...c} type="email" defaultValue="name@" className="h-11" />}
          </FormField>
          <FormField label="Phone (disabled)">
            {(c) => <Input {...c} disabled defaultValue="+977 98XXXXXXXX" className="h-11" />}
          </FormField>
          <FormField label="Specialisation" hint="Optional">
            {(c) => <Textarea {...c} rows={3} />}
          </FormField>
          <FormField
            label="Specialisation (with error)"
            error="Please keep this under 200 characters."
          >
            {(c) => <Textarea {...c} rows={3} />}
          </FormField>
          <FormField label="Programme">
            {(c) => (
              <Select items={programmes} defaultValue="mbbs">
                <SelectTrigger {...c} className="w-full data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programmes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField label="Programme (with error)" error="Choose your programme.">
            {(c) => (
              <Select items={programmes} defaultValue="bmit">
                <SelectTrigger {...c} className="w-full data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programmes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <Sub>Checkbox</Sub>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb1" />
              <Label htmlFor="sg-cb1">Unchecked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb2" defaultChecked />
              <Label htmlFor="sg-cb2">Checked</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb3" aria-invalid />
              <Label htmlFor="sg-cb3">Invalid</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb4" disabled />
              <Label htmlFor="sg-cb4">Disabled</Label>
            </div>
          </div>
          <div className="space-y-3">
            <Sub>Radio group</Sub>
            <RadioGroup defaultValue="mbbs" aria-label="Programme">
              {programmes.map((p) => (
                <div key={p.value} className="flex items-center gap-2">
                  <RadioGroupItem id={'sg-r-' + p.value} value={p.value} />
                  <Label htmlFor={'sg-r-' + p.value}>{p.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Sub>Switch</Sub>
            <div className="flex items-center gap-3">
              <Switch id="sg-sw1" />
              <Label htmlFor="sg-sw1">Show my email</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sg-sw2" defaultChecked />
              <Label htmlFor="sg-sw2">Allow messages</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sg-sw3" disabled />
              <Label htmlFor="sg-sw3">Disabled</Label>
            </div>
          </div>
        </div>
      </Block>

      <Block id="sg-surfaces" title="Surfaces">
        <Card>
          <CardHeader>
            <CardTitle>Sample card</CardTitle>
            <CardDescription>Cards hold goals, events, people and posts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Approved</Badge>
            <Badge variant="secondary">MBBS</Badge>
            <Badge variant="outline">Sample</Badge>
          </CardContent>
        </Card>
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Current board</TabsTrigger>
            <TabsTrigger value="previous">Previous boards</TabsTrigger>
          </TabsList>
          <TabsContent value="current">Current board members appear here.</TabsContent>
          <TabsContent value="previous">Past boards, grouped by term.</TabsContent>
        </Tabs>
        <Accordion>
          <AccordionItem value="a">
            <AccordionTrigger>How do we work with BPKIHS?</AccordionTrigger>
            <AccordionContent>Sample answer text for the accordion.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Where does my donation go?</AccordionTrigger>
            <AccordionContent>Sample answer text for the second item.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Block>

      <Block id="sg-feedback" title="Feedback">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard value="1,240" label="Alumni registered" icon={UsersIcon} sample />
          <StatCard value="NPR 4.2M" label="Funds raised" sample />
          <StatCard value="6" label="Active programmes" sample />
        </div>
        <ProgressBar
          label="Scholarship Fund"
          raised={420000}
          target={1000000}
          raisedLabel="NPR 4,200"
          targetLabel="NPR 10,000"
          supporters={58}
        />
        <Stepper steps={steps} currentIndex={1} />
        <EmptyState
          title="No alumni match these filters"
          description="Try removing a filter or searching for a different name."
          action={<Button variant="outline">Reset filters</Button>}
        />
        <ErrorState onRetry={() => toast.success('Retry clicked')} />
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Button onClick={() => toast.success('Saved. This is a sample toast.')}>Show toast</Button>
      </Block>

      <Block id="sg-nav" title="Navigation and overlays">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Styleguide</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#sg-nav" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#sg-nav" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#sg-nav">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#sg-nav" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sample dialog</DialogTitle>
                <DialogDescription>Focus is trapped here. Press Escape to close.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sample sheet</SheetTitle>
                <SheetDescription>Used for the mobile menu and filters.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Block>

      <Block id="sg-newsletter" title="Newsletter">
        <div className="bg-primary-100 rounded-lg p-6">
          <NewsletterForm />
        </div>
      </Block>

      <Toaster />
    </Container>
  );
}
